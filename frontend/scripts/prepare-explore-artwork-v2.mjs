/* Rebuild only the eleven owner-selected Explore images; preserve the source PNGs. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const source = path.join(repo, "فایل های اپلیکیشن من/تصاویر بخش کاوش2");
const target = path.join(repo, "frontend/public/assets/chinverse/explore");
const learning = "یادگیری زبان چینی/ست دوم/بدون نوشته";
const entertainment = "سرگرمی چینی/ست اول";
const wideCrop = { left: 1200, top: 0, width: 1308, height: 627 };
const images = [
    { id: "hsk", file: `${learning}/HSK.png` },
    { id: "pronunciation", file: `${learning}/تلفظ2.png` },
    { id: "characters", file: `${learning}/کاراکتر.png` },
    { id: "grammar", file: `${learning}/گرامر.png` },
    { id: "idioms", file: `${learning}/اصطلاحات.png2.png` },
    { id: "practical", file: `${learning}/چینی کاربردی.png` },
    { id: "vlogs", file: `${learning}/یادگیری با ولاگ.png` },
    { id: "music", file: "سرگرمی چینی/عکس های بلاتکلیف/موسیقی.png", crop: { left: 540, top: 85, width: 1132, height: 750 } },
    { id: "podcasts", file: `${entertainment}/پادکست.png`, crop: wideCrop },
    { id: "topic-talks", file: `${entertainment}/گفتارهای موضوعی.png`, crop: wideCrop },
    { id: "movies", file: `${entertainment}/فیلم.png`, crop: wideCrop },
];

(async () => {
    fs.mkdirSync(target, { recursive: true });
    const outputs = [];
    for (const item of images) {
        const input = path.join(source, item.file);
        const output = path.join(target, `${item.id}-v2.webp`);
        let pipeline = sharp(input);
        if (item.crop) pipeline = pipeline.extract(item.crop);
        await pipeline.resize(768, 768, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 88, effort: 6 }).toFile(output);
        const metadata = await sharp(output).metadata();
        outputs.push({
            id: item.id, source: item.file, crop: item.crop || null,
            width: metadata.width, height: metadata.height,
            bytes: fs.statSync(output).size, originalBytes: fs.statSync(input).size,
            sha256: crypto.createHash("sha256").update(fs.readFileSync(output)).digest("hex"),
        });
    }
    console.log(JSON.stringify({ images: outputs, totalBytes: outputs.reduce((n, row) => n + row.bytes, 0) }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
