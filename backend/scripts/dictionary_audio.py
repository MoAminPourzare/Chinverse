"""Resumable, offline dictionary MP3 production. No database or application credentials needed."""
import argparse
import asyncio
from collections import OrderedDict
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import unicodedata


CATALOG_DIR = Path(__file__).resolve().parents[1] / "data" / "dictionary"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "dictionary-audio-output"
VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "-10%"


def reading_key(value):
    return re.sub(r"[\s'’]", "", unicodedata.normalize("NFC", value).lower()).replace("u:", "ü").replace("v", "ü")


def split_readings(value):
    return [part.strip() for part in re.split(r"[/|,，;；]", value) if part.strip()]


def read_catalog(directory=CATALOG_DIR):
    import csv
    names = [f"hsk{level}_words_dictionary.csv" for level in range(1, 7)] + [
        "hsk7-9_words_dictionary.csv", "non_hsk_words_dictionary.csv",
    ]
    words = OrderedDict()
    digest = hashlib.sha256()
    for name in names:
        path = Path(directory) / name
        digest.update(name.encode())
        digest.update(path.read_bytes())
        with path.open(encoding="utf-8-sig", newline="") as stream:
            for row in csv.DictReader(stream):
                chinese = row["chinese_word"].strip()
                if not chinese or not row["pinyin"].strip():
                    raise ValueError(f"Missing word or pinyin in {name}")
                word = words.setdefault(chinese, {
                    "chinese": chinese, "pinyins": [], "level": row["word_hsk_level"],
                    "source_word_id": row["word_id"], "meanings": [],
                })
                for pinyin in split_readings(row["pinyin"]):
                    if reading_key(pinyin) not in {reading_key(p) for p in word["pinyins"]}:
                        word["pinyins"].append(pinyin)
                meaning = row["persian_meaning"].strip()
                if meaning and meaning not in word["meanings"]:
                    word["meanings"].append(meaning)
    for word in words.values():
        reasons = []
        if len(word["pinyins"]) > 1:
            reasons.append("multiple_readings")
        if len(word["chinese"]) == 1:
            reasons.append("single_character")
        if "儿" in word["chinese"] and len(word["chinese"]) > 1:
            reasons.append("erhua")
        if not re.fullmatch(r"[\u3400-\u9fff]+", word["chinese"]):
            reasons.append("mixed_script")
        word["review_reasons"] = reasons
    return list(words.values()), digest.hexdigest()


def job_key(word, voice=VOICE, rate=RATE):
    payload = [word["chinese"], word["pinyins"], voice, rate, "edge-tts"]
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False).encode()).hexdigest()


def file_digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inspect_mp3(path):
    from mutagen import MutagenError
    from mutagen.mp3 import MP3
    try:
        info = MP3(path).info
    except MutagenError as exc:
        raise ValueError("Invalid MP3") from exc
    if not 0.2 <= info.length <= 30 or info.sample_rate < 16000 or info.bitrate <= 0:
        raise ValueError("Unexpected MP3 duration or format")
    return {"duration_seconds": round(info.length, 4), "sample_rate": info.sample_rate,
            "bitrate": info.bitrate, "channels": info.channels, "size_bytes": Path(path).stat().st_size}


def atomic_json(path, payload):
    path = Path(path)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


@contextmanager
def output_lock(directory):
    """OS-managed lock is released on crashes; a stale PID never prevents resuming."""
    with (directory / ".run.lock").open("a+b") as stream:
        if stream.tell() == 0:
            stream.write(b"0")
            stream.flush()
        stream.seek(0)
        try:
            if __import__("os").name == "nt":
                import msvcrt
                msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            raise RuntimeError("Another audio job is already using this output folder") from exc
        try:
            yield
        finally:
            stream.seek(0)
            if __import__("os").name == "nt":
                msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(stream, fcntl.LOCK_UN)


def existing_files(directory):
    if directory is None:
        return {}
    result = {}
    for path in Path(directory).glob("*.mp3"):
        match = re.fullmatch(r"\d+_(.+)", path.stem)
        if match:
            chinese = match[1]
            if chinese in result:
                raise ValueError(f"More than one existing recording for {chinese}")
            result[chinese] = path
    return result


def saved_record(output, word, voice, rate):
    path = output / "records" / f"{job_key(word, voice, rate)}.json"
    if not path.exists():
        return None
    try:
        record = json.loads(path.read_text(encoding="utf-8"))
        if (record.get("chinese") != word["chinese"] or record.get("pinyins") != word["pinyins"]
                or record.get("voice") != voice or record.get("rate") != rate or record.get("status") != "ready"):
            return None
        digest = record["sha256"]
        if not re.fullmatch(r"[a-f0-9]{64}", digest) or record["audio_file"] != f"audio/{digest}.mp3":
            return None
        audio = output / record["audio_file"]
        if file_digest(audio) != digest or record["job_key"] != job_key(word, voice, rate):
            return None
        metrics = inspect_mp3(audio)
        return {**record, **word, **metrics}
    except (OSError, ValueError, KeyError):
        return None


def save_record(output, word, source, origin, voice, rate):
    metrics = inspect_mp3(source)
    digest = file_digest(source)
    destination = output / "audio" / f"{digest}.mp3"
    if not destination.exists() or file_digest(destination) != digest:
        temporary = output / "temporary" / f"{job_key(word, voice, rate)}.publish.partial"
        shutil.copyfile(source, temporary)
        if file_digest(temporary) != digest:
            temporary.unlink(missing_ok=True)
            raise ValueError("The source recording changed while being copied")
        temporary.replace(destination)
    record = {**word, **metrics, "status": "ready", "audio_file": f"audio/{digest}.mp3",
              "sha256": digest, "job_key": job_key(word, voice, rate), "voice": voice,
              "rate": rate, "origin": origin, "pronunciation_verified": False,
              "created_at": datetime.now(timezone.utc).isoformat()}
    atomic_json(output / "records" / f"{record['job_key']}.json", record)
    return record


def write_report(output, words, catalog_sha, voice, rate):
    records = []
    for word in words:
        record = saved_record(output, word, voice, rate)
        records.append(record or {**word, "status": "missing"})
    ready = sum(record["status"] == "ready" for record in records)
    summary = {"catalog_words": len(words), "ready": ready, "missing": len(words) - ready,
               "review_required": sum(bool(word["review_reasons"]) for word in words),
               "multiple_readings": sum(len(word["pinyins"]) > 1 for word in words)}
    atomic_json(output / "index.json", {"version": 1, "catalog_sha256": catalog_sha,
                "voice": voice, "rate": rate, "summary": summary, "words": records})
    write_review_page(output, records)
    return summary


def write_review_page(output, records):
    data = json.dumps(records, ensure_ascii=False).replace("<", "\\u003c")
    page = '''<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>بررسی تلفظ دیکشنری</title>
<style>body{font-family:Tahoma,Arial;max-width:1000px;margin:30px auto;padding:16px;background:#f7f8fa;color:#14243d}input,select,button{font:inherit;padding:10px;border:1px solid #ccd8e8;border-radius:10px}button{cursor:pointer;background:#155aa6;color:white}article{margin:16px 0;padding:20px;border:1px solid #dce5ee;border-radius:18px;background:white}h2{margin:0 0 8px}small{color:#64748b}audio{max-width:100%;display:block;margin:12px 0}.bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center}p{line-height:1.9}</style>
<h1>بررسی تلفظ واژه‌ها</h1><p>سالم بودن MP3، تأیید درستی تلفظ نیست. صدا را با پین‌یین و معنی مقایسه کن. برای واژهٔ چندخوانشی، خوانشی را انتخاب کن که در همین فایل شنیده می‌شود. این فایل فقط یک تلفظ مبناست و همهٔ خوانش‌ها را پوشش نمی‌دهد.</p>
<div class="bar"><input id="search" placeholder="واژه، پین‌یین یا معنی"><label><input id="sensitive" type="checkbox" checked> فقط نیازمند بررسی</label><button id="export">ذخیرهٔ تأییدها</button><label>بازیابی تأییدها <input id="restore" type="file" accept=".json"></label></div>
<p id="count"></p><div id="list"></div><div class="bar"><button id="prev">قبلی</button><span id="position"></span><button id="next">بعدی</button></div>
<script type="application/json" id="data">__DATA__</script><script>
const words=JSON.parse(document.getElementById('data').textContent), approvals=new Map();let page=0;
const search=document.getElementById('search'),sensitive=document.getElementById('sensitive');
const labels={multiple_readings:'چند خوانش',single_character:'تک‌حرفی',erhua:'تلفظ 儿',mixed_script:'متن ترکیبی'};
function render(){const q=search.value.toLowerCase(),filtered=words.filter(w=>(!sensitive.checked||w.review_reasons.length)&&JSON.stringify([w.chinese,w.pinyins,w.meanings]).toLowerCase().includes(q));const pages=Math.max(1,Math.ceil(filtered.length/40));page=Math.min(page,pages-1);document.getElementById('count').textContent=filtered.length+' واژه؛ '+approvals.size+' تأیید';document.getElementById('position').textContent=(page+1)+' / '+pages;const list=document.getElementById('list');list.replaceChildren();for(const w of filtered.slice(page*40,(page+1)*40)){const card=document.createElement('article'),title=document.createElement('h2');title.textContent=w.chinese;title.lang='zh-CN';const p=document.createElement('p');p.textContent=w.pinyins.join(' / ')+' — '+w.meanings.join('؛ ');const note=document.createElement('small');note.textContent=w.review_reasons.map(r=>labels[r]).join('، ');card.append(title,p,note);if(w.status==='ready'){const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=w.audio_file;const select=document.createElement('select');for(const reading of w.pinyins){const opt=document.createElement('option');opt.textContent=reading;select.append(opt)}const old=approvals.get(w.chinese);if(old)select.value=old.approved_pinyin;const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=!!old;const save=()=>{if(check.checked)approvals.set(w.chinese,{chinese:w.chinese,sha256:w.sha256,approved_pinyin:select.value});else approvals.delete(w.chinese);document.getElementById('count').textContent=filtered.length+' واژه؛ '+approvals.size+' تأیید'};check.onchange=save;select.onchange=save;label.append(check,document.createTextNode(' تلفظ این فایل را بررسی و تأیید کردم'));card.append(audio,select,document.createTextNode(' '),label)}else{const missing=document.createElement('p');missing.textContent='هنوز فایل صوتی ساخته نشده است.';card.append(missing)}list.append(card)}}
search.oninput=()=>{page=0;render()};sensitive.onchange=()=>{page=0;render()};document.getElementById('prev').onclick=()=>{page=Math.max(0,page-1);render()};document.getElementById('next').onclick=()=>{page++;render()};document.getElementById('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,approvals:[...approvals.values()]},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='approvals.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};document.getElementById('restore').onchange=async(e)=>{const data=JSON.parse(await e.target.files[0].text());for(const approval of data.approvals||[]){const w=words.find(w=>w.chinese===approval.chinese);if(w&&w.sha256===approval.sha256&&w.pinyins.includes(approval.approved_pinyin))approvals.set(w.chinese,approval)}render()};render();
</script></html>'''
    (output / "review.html").write_text(page.replace("__DATA__", data), encoding="utf-8")


async def generate(args, words, catalog_sha):
    output = args.output.resolve()
    for subdir in ("audio", "records", "temporary"):
        (output / subdir).mkdir(parents=True, exist_ok=True)
    atomic_json(output / "catalog.json", {"version": 1, "catalog_sha256": catalog_sha, "words": words})
    existing = existing_files(args.existing_dir)
    if existing and (args.voice != VOICE or args.rate != RATE):
        raise ValueError("Existing HSK1 clips were made with Xiaoxiao at -10%; omit --existing-dir when changing settings")
    pending = []
    reused = resumed = 0
    for word in words:
        if saved_record(output, word, args.voice, args.rate):
            resumed += 1
            continue
        if word["chinese"] in existing:
            try:
                save_record(output, word, existing[word["chinese"]], "owner_hsk1", args.voice, args.rate)
                reused += 1
                continue
            except (OSError, ValueError) as exc:
                print(f"Existing clip rejected for {word['chinese']}: {type(exc).__name__}", flush=True)
        pending.append(word)
    print(f"Catalog: {len(words)}; resumed: {resumed}; reused: {reused}; pending: {len(pending)}", flush=True)
    if args.report_only:
        return write_report(output, words, catalog_sha, args.voice, args.rate)
    if args.limit:
        pending = pending[:args.limit]
    if pending:
        import edge_tts
        queue = asyncio.Queue()
        for word in pending:
            queue.put_nowait(word)
        completed = 0
        streak = 0
        stop = asyncio.Event()

        async def worker():
            nonlocal completed, streak
            while not queue.empty() and not stop.is_set():
                word = queue.get_nowait()
                temporary = output / "temporary" / f"{job_key(word, args.voice, args.rate)}.partial.mp3"
                succeeded = False
                for attempt in range(args.retries):
                    try:
                        communicate = edge_tts.Communicate(word["chinese"], args.voice, rate=args.rate)
                        await asyncio.wait_for(communicate.save(str(temporary)), timeout=args.timeout)
                        save_record(output, word, temporary, "edge_tts", args.voice, args.rate)
                        succeeded = True
                        break
                    except Exception as exc:
                        print(f"Retry {attempt + 1}/{args.retries} {word['chinese']}: {type(exc).__name__}", flush=True)
                        if attempt + 1 < args.retries:
                            await asyncio.sleep(min(30, 2 ** (attempt + 1)))
                    finally:
                        temporary.unlink(missing_ok=True)
                if succeeded:
                    streak = 0
                    completed += 1
                    if completed % 10 == 0 or completed == len(pending):
                        print(f"Generated {completed}/{len(pending)}; latest: {word['chinese']}", flush=True)
                else:
                    streak += 1
                    if streak >= 6:
                        print("Repeated service failures; stopping safely. Run the same command later to resume.", flush=True)
                        stop.set()
                queue.task_done()
                await asyncio.sleep(0.4)
        try:
            await asyncio.gather(*(worker() for _ in range(args.workers)))
        finally:
            summary = write_report(output, words, catalog_sha, args.voice, args.rate)
    else:
        summary = write_report(output, words, catalog_sha, args.voice, args.rate)
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-dir", type=Path, default=CATALOG_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--existing-dir", type=Path)
    parser.add_argument("--voice", default=VOICE)
    parser.add_argument("--rate", default=RATE)
    parser.add_argument("--workers", type=int, choices=range(1, 4), default=2)
    parser.add_argument("--retries", type=int, choices=range(1, 9), default=4)
    parser.add_argument("--timeout", type=int, choices=range(10, 121), default=40)
    parser.add_argument("--limit", type=int, default=0, help="Generate only this many NEW clips; 0 means all")
    parser.add_argument("--report-only", action="store_true", help="Reuse existing clips and write reports without any TTS calls")
    args = parser.parse_args()
    if args.limit < 0 or args.existing_dir and not args.existing_dir.is_dir():
        parser.error("Invalid limit or existing directory")
    if args.existing_dir and args.output.resolve().is_relative_to(args.existing_dir.resolve()):
        parser.error("Output must be separate from the existing source audio directory")
    args.output.mkdir(parents=True, exist_ok=True)
    words, catalog_sha = read_catalog(args.catalog_dir)
    with output_lock(args.output):
        try:
            summary = asyncio.run(generate(args, words, catalog_sha))
        except KeyboardInterrupt:
            print("Stopped. Completed clips are preserved; run the same command to resume.")
            return 130
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    print(f"Review page: {args.output.resolve() / 'review.html'}", flush=True)
    return 0 if summary["missing"] == 0 or args.report_only or args.limit else 2


if __name__ == "__main__":
    raise SystemExit(main())
