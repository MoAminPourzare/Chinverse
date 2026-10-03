# شواهد فاز ۵ — ممیزی داده، مجوز و رسانه

این سند خروجی ممیزی deterministic فاز پنج است. ابزار و تست‌های آن در
`backend/scripts/audit_phase5_content.py` و
`backend/tests/test_phase5_content_audit.py` قرار دارند. این بخش فقط شواهد
داده/مجوز را ثبت می‌کند و دربارهٔ مجوزی که مدرک آن در repository نیست ادعا
نمی‌کند.

## اجرای قابل تکرار

از ریشهٔ repository:

```powershell
python backend/scripts/audit_phase5_content.py --repo-root . --format json
```

برای بازسازی رجیستری‌ها (بدون حدس‌زدن فیلدهای مالک/مجوز):

```powershell
python backend/scripts/audit_phase5_content.py --repo-root . --sync-registries
```

گیت ساختاری (خطای Critical/High) خروجی غیرصفر می‌دهد. موارد provenance با
`review_required` به‌عنوان baseline blocker گزارش می‌شوند و فقط با
`--strict-licenses` باعث شکست command می‌شوند؛ بنابراین CI در برابر دادهٔ
تاریخیِ بدون مدرک، نتیجه را پنهان نمی‌کند و در عین حال تا زمان بررسی انسانی
کل build را از کار نمی‌اندازد.

## نتیجهٔ snapshot فعلی

- دیکشنری: ۳ فایل، ۹۸۷ واژه و ۲۰۱۴ ردیف sense (HSK1: ۶۸۳، HSK2: ۴۵۰، HSK3: ۸۸۱).
- media inventory: ۳۴۷ فایل، شامل ۳۳۱ تصویر و ۱۶ ویدئو، با حجم کل ۹۷٬۴۲۴٬۰۷۳ بایت.
  کل `frontend/public` به‌صورت recursive و دو پوشهٔ `firstVideo/` و
  `secondVideo/` ممیزی می‌شوند.
- رجیستری کامل رسانه در
  `docs/PHASE_5_MEDIA_LICENSE_REGISTRY.csv` و رجیستری سه CSV دیکشنری در
  `backend/data/dictionary/source_registry.csv` است. checksum هر ردیف از
  محتوای همان snapshot محاسبه شده است.
- هر ۳۴۷ رسانه و هر ۳ CSV فعلاً `review_required` هستند؛ چون owner/license/
  source_url مستند در repository پیدا نشد، هیچ‌کدام به‌صورت حدسی approved
  نشده‌اند. این ۳۵۰ مورد baseline blocker انتشار عمومی‌اند.

## پاک‌سازی و تفاوت با baseline قبلی

در HSK3، واژهٔ `或` با کلید `(word_id=179, chinese_word=或)` چهار ردیف داشت:
دو ردیف `sense_id=1` کاملاً یکسان بودند و دو ردیف `sense_id=2` محتوای متفاوت
داشتند. ردیف کاملاً تکراری حذف شد و sense متفاوت بدون حذف محتوا به اولین کلید
آزاد (`sense_id=3`) منتقل شد. invariant ابزار اکنون نبودن
`DICT_DUPLICATE_ROW` و `DICT_DUPLICATE_SENSE_ID` را بررسی می‌کند.

ادعای baseline قبلی دربارهٔ «۱۰۵ برچسب سطح ناسازگار» قابل بازتولید است: در
HSK3 دقیقاً ۱۰۵ ردیف با برچسبی غیر از `HSK 3` وجود دارد. ده برچسب بدون فاصلهٔ
`HSK2` فقط از نظر قالب به `HSK 2` normalize شدند؛ ۱۰۵ مورد semantic-level
هنوز بدون منبع رسمی تغییر داده نشده‌اند (پس از normalize: ۶۰ ردیف `HSK 2`،
۳۱ ردیف `HSK 4` و ۱۴ ردیف `HSK 1`). ابزار این موارد را medium baseline و
per-row گزارش می‌کند، نه اینکه سطح را حدس بزند.

همچنین HSK1 برای واژهٔ `一` senseهای `[1, 4, 5, 6, 7]` دارد. این gap حذف یا
renumber نشده و به‌عنوان مورد semantic review ثبت می‌شود، چون از روی CSV
به‌تنهایی نمی‌توان نتیجه گرفت senseهای ۲ و ۳ باید اضافه یا تغییر کنند.

## hardcodeهای باقی‌مانده

پس از حذف `frontend/src/lib/videoUtils.ts` و فایل‌های first-video، source scan
دیگر hardcode ساختاری رسانه/شناسه در frontend ندارد. URLهای نمونهٔ باقی‌مانده
در `backend/seed_lms.py` فقط baseline fixture هستند و هرگز از DTO عمومی یا
مسیر playback صادر نمی‌شوند؛ audit آن‌ها را جداگانه گزارش می‌کند تا در زمان
پاک‌سازی seed/ثبت مجوز نهایی حذف شوند.

## حفاظت CI

`quality-gates.yml` و `scripts/check.ps1` ابزار audit را اجرا می‌کنند. نبودن
فایل، ستون، checksum منطبق، نوع media، رجیستری ناقص، duplicate sense یا
hardcode رسانه‌ای Critical/High است و gate را fail می‌کند. وضعیت license
ناشناخته در رجیستری باقی می‌ماند تا صاحب پروژه مدرک source/owner/license را
ثبت کند؛ حذف فایل یا جعل مجوز بخشی از این ممیزی نیست.
