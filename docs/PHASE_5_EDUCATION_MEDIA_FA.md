# ChinVerse | گزارش فاز ۵: آموزش و رسانه

> این گزارش هم‌زمان با اجرای فاز پنج به‌روزرسانی می‌شود. هر مرحله باید با کد، migration، تست و شاهد قابل‌تکرار بسته شود؛ هیچ URL و داده‌ی نمونه‌ای نباید بدون منبع و مجوز وارد انتشار عمومی شود.

## وضعیت فعلی

- تاریخ شروع: ۱۱ اوت ۲۰۲۶
- شاخه: `codex/phase-5-education-media`
- وضعیت: پیاده‌سازی و full rerun محلی کامل؛ commit، CI و deploy محافظت‌شده هنوز انجام نشده‌اند
- دامنه: محتوای دوره و درس، ویدئو/HLS، زیرنویس، entitlement، کنترل کیفیت رسانه و ممیزی داده/مجوز
- خط قرمز انتشار: محتوای `draft`، رسانه‌ی بدون مجوز، URL خام HLS یا محتوای پولی بدون entitlement نباید از API عمومی برگردد.

وضعیت ردیابی release:

| شاهد | وضعیت |
| --- | --- |
| release SHA | `pending` |
| GitHub Quality Gates | `pending` |
| Hugging Face staging deploy/smoke | `pending` |
| Vercel Preview محافظت‌شده | `pending` |

## مراحل اجرایی

### مرحله ۰ — ممیزی و قرارداد خروجی

وضعیت: تکمیل‌شده — ۱۱ اوت ۲۰۲۶

یافته‌های baseline پیش از تغییر:

- player اصلی در `frontend/src/app/watch/[domain]/[courseId]/page.tsx` بر اساس شناسه‌ی ویژه‌ی `pronunciation/7`، دو URL خام Arvan و transcript/fallback محلی تصمیم می‌گیرد؛ صفحه‌ی `frontend/src/app/lessons/[id]` نیز ویدئو و poster نمونه دارد.
- فایل‌های `frontend/src/data/firstVideoTranscript.ts`، `firstPronunciationLessonTranscript.ts` و `pronunciationLesson7Transcript.ts` URL و متن runtime را hardcode کرده‌اند؛ route محلی first-video نیز به فایل روی دیسک متکی است.
- API عمومی دوره در `backend/app/api/v1/endpoints/courses.py` مقدار خام `lessons.video_url` را برمی‌گرداند و وضعیت انتشار یا entitlement را کنترل نمی‌کند.
- `Course`/`Lesson` lifecycle انتشار ندارند؛ `LessonSubtitle` cue سطری بدون revision/status است؛ `MediaAsset` نیز source/license/checksum/review ندارد.
- subscription فعال در مدل موجود قابل تشخیص است، اما سرویس مستقل entitlement و URL امضاشده‌ی media وجود ندارد. gateway فعلی placeholder است و نباید برای production فعال شود.
- سه CSV دیکشنری HSK1 تا HSK3 موجودند، ولی gate یکپارچه برای duplicate/sense و inventory مجوز همه‌ی تصویرها و ویدئوها وجود ندارد.

قرارداد مصوب پیاده‌سازی:

- public فقط `published` را می‌بیند و هیچ `video_url`/`file_url` خامی دریافت نمی‌کند؛
- `GET /api/v1/courses/lessons/{lesson_id}/playback` پس از entitlement یک URL کوتاه‌عمر صادر می‌کند؛ درس رایگان بدون ورود و درس پولی فقط با اشتراک فعال؛
- زیرنویس منتشرشده از DB و با revision/quality validation برگردانده می‌شود؛ draft و asset بدون تأیید مجوز fail-closed هستند؛
- workflow ادمین برای draft، validate، publish و archive همراه با audit trail اجرا می‌شود.

### مرحله ۱ — مدل داده و workflow انتشار

وضعیت: تکمیل‌شده — migration و parity روی PostgreSQL محلی تأیید شد

- asset رسانه‌ای با منبع، مجوز، checksum و وضعیت lifecycle؛
- وضعیت `draft`/`published`/`archived` برای دوره، درس و subtitle؛
- revision قابل‌ردیابی برای subtitle و media؛
- endpointهای admin برای ایجاد، اعتبارسنجی، انتشار و آرشیو.

### مرحله ۲ — دسترسی رسانه و entitlement

وضعیت: تکمیل‌شده در کد و full integration محلی؛ smoke cross-tier زنده پس از deploy انجام می‌شود

- صدور URL امضاشده‌ی کوتاه‌عمر برای HLS؛
- کنترل مالکیت/اشتراک/رایگان‌بودن قبل از صدور URL؛
- عدم افشای URL خام provider، `storage_key` یا metadata داخلی در API عمومی؛
- re-check شدن وضعیت انتشار، مجوز و entitlement هنگام resolve هر resource؛
- Range برای progressive media و rewrite امضاشده‌ی manifest/playlist/key/segment؛
- audit log برای صدور و رد دسترسی، بدون ثبت DB/log برای token یا شناسه‌ی جعلی و بدون write جداگانه برای هر segment؛
- bucket خصوصی مستقل برای course media در S3 و fail-closed بودن تنظیمات در صورت یکی‌بودن bucket عمومی و خصوصی.

### مرحله ۳ — player و زیرنویس

وضعیت: تکمیل‌شده — build تولیدی و تست‌های frontend سبز است

- دریافت course/lesson/subtitle از API و حذف fallback شناسه‌ای؛
- parser/normalizer واحد برای SRT/VTT و کنترل overlap/gap؛
- sync بر اساس `timeupdate`، seek و تغییر زبان؛
- حالت خطا، poster، duration و retry قابل مشاهده؛
- URL پایدار و opaque برای cover/poster عمومی از مسیر
  `/api/v1/media/public-images/{media_id}` و نگه‌داشتن playback روی BFF هم‌origin.

### مرحله ۴ — کیفیت داده و مجوز

وضعیت: تکمیل فنی؛ بازبینی provenance انسانی باقی است

- ممیزی HSK1 تا HSK3 و جلوگیری از duplicate/sense ناسازگار؛
- گزارش فایل‌های رسانه‌ای بدون license/owner/checksum؛
- ثبت نتیجه ممیزی و fail شدن CI در صورت خطای Critical/High.

یافته‌های ممیزی اولیه:

- HSK1/2/3 به‌ترتیب ۳۰۰/۱۹۷/۴۹۰ واژه و ۶۸۳/۴۵۰/۸۸۲ ردیف داده دارند و duplicate واژه بین سطح‌ها دیده نشد.
- در HSK3، واژه‌ی `或` با `word_id=179` چهار ردیف و `sense_id`های تکراری `1,2,1,2` دارد؛ یکی duplicate کامل و دیگری collision معنایی است و باید deterministic پاک‌سازی شود.
- gap شناسه‌های sense برای `一` در HSK1 ثبت شد، اما چون به‌تنهایی نشانه‌ی خرابی نیست حذف خودکار نمی‌شود.
- ۳۴۷ فایل تصویر/ویدئو در rootهای رسانه‌ای repository پیدا شد (۱۶ MP4 و ۳۳۱ تصویر/بردار) و برای هیچ‌کدام registry قابل‌اثبات source/owner/license وجود ندارد؛ با سه CSV دیکشنری، ۳۵۰ مورد نیازمند بازبینی provenance هستند. این مورد High blocker انتشار عمومی است و مجوز حدس زده نخواهد شد.

نتیجه‌ی ابزار deterministic ممیزی (پس از inventory کامل):

- ۳۴۷ asset tracked ممیزی شد: ۳۳۱ تصویر/بردار و ۱۶ ویدئو؛ برای هرکدام path، SHA-256، نوع و وضعیت `review_required` در `docs/PHASE_5_MEDIA_LICENSE_REGISTRY.csv` ثبت شده است.
- duplicate کامل `或` حذف شد و sense متفاوت آن از ۲ به ۳ renumber شد؛ اکنون HSK3 تعداد ۸۸۱ ردیف و کل سه فایل ۲۰۱۴ sense دارد و blocker ساختاری dictionary صفر است.
- ۱۰۵ برچسب سطح ناسازگار HSK3 (HSK1/2/4 در فایل HSK3) عمداً حدس‌زده نشد و به‌عنوان finding قابل‌ردیابی `DICT_LEVEL_LABEL_MISMATCH` در سطح baseline ثبت شد؛ یک sense gap برای `一` نیز نیازمند بازبینی معنایی است.
- اجرای `audit_phase5_content.py --format text` اکنون `0 structural blockers` می‌دهد. انتشار strict license تا تکمیل owner/license/source برای ۳۴۷ asset و سه CSV، در مجموع ۳۵۰ مورد، همچنان مسدود است. این مانع انتشار عمومی است؛ Preview فقط در صورت محافظت دسترسی مجاز است.

### مرحله ۵ — آزمون و انتشار staging

وضعیت: full aggregate rerun محلی سبز؛ commit/CI/deploy و smoke زنده باقی است

- migration چرخه‌ی `base -> head -> base -> head` تا head
  `b5e7c9d1f3a2` روی PostgreSQL تأیید شده است؛
- ۱۲۵ تست واحد backend با پوشش ۵۸٫۵۲٪ و ۲۵ تست integration روی PostgreSQL ایزوله سبز است؛
- ۳۶ تست واحد frontend با پوشش ۹۳٫۴۸٪ statement و ۹۴٫۲۸٪ line سبز است و
  lint/typecheck/build تولیدی ۶۳ route را ساخته است؛
- پنل ادمین workflow ایجاد course/section/lesson، ثبت و review/publish رسانه، ingest/validate/publish زیرنویس و publish درس/دوره را پوشش می‌دهد؛
- health/readiness و smoke staging برای release جدید pending است؛
- SHA، runهای CI، commit provider و URL Preview پس از deploy در همین گزارش و handoff ثبت می‌شوند.

## تصمیم‌های دامنه

- پرداخت واقعی و فعال‌سازی production خارج از این فاز است؛ entitlement باید با subscription موجود قابل‌آزمون باشد، اما gateway جعلی نباید فعال شود.
- هیچ فایل ویدئو/تصویر جدیدی بدون مدرک مجوز وارد storage یا Git نمی‌شود.
- داده‌ی نمونه‌ی فعلی فقط پس از ثبت source/license و checksum قابل انتشار است.
- Preview فاز پنج باید محافظت‌شده بماند؛ وضعیت `review_required` برای ۳۵۰ مورد اجازه‌ی انتشار عمومی محتوا را نمی‌دهد.

## شواهد اجرا

- مرحله ۰: جست‌وجوی repository-wide برای URLهای HLS، transcriptهای محلی، `video_url`، مدل‌ها، endpointها و workflowهای CI انجام شد؛ مسیرهای بالا baseline قابل‌تکرار ممیزی هستند.
- مرحله ۳: قرارداد playback، poster عمومی opaque و subtitle در suite ۳۶ تستی frontend پوشش دارد؛ fallback ناامن، response ناقص، cue خراب/تکراری، gap/overlap، انتخاب زبان و refresh پیش از انقضا پوشش داده شده‌اند.
- مرحله ۱: migration واقعی از head فاز چهار تا `b5e7c9d1f3a2` روی PostgreSQL محلی اجرا شد؛ خطای bind در JSON مهاجرت legacy شناسایی و با `jsonb_build_object` اصلاح شد. `verify_phase5_schema.py` تمام جدول‌ها، ستون‌ها و indexهای الزامی را تأیید کرد و `alembic check` بدون اختلاف مدل/migration پایان یافت.
- مرحله ۲: public API فقط DTO allowlistشده می‌دهد؛ mount خام course video/thumbnail حذف شده است. course media در S3 از bucket خصوصی مجزا خوانده می‌شود و publish، checksum/size واقعی فایل و graph محدود HLS را تا playlistها، key/init و segmentهای referenced بررسی می‌کند. traversal، URL خارجی و resource بدون امضای منطبق fail-closed هستند.
- مرحله ۳: `npm run lint`، typecheck تولیدی Next و `npm run build` موفق شد؛ build تعداد ۶۳ صفحه/مسیر را تولید کرد. suite واحد frontend نیز ۳۶ تست را با پوشش ۹۳٫۴۸٪ statement و ۹۴٫۲۸٪ line سبز کرد.
- مرحله ۴: اجرای audit در snapshot فعلی ۹۸۷ واژه/۲۰۱۴ sense و ۳۴۷ asset ثبت‌شده را گزارش می‌کند؛ blocker ساختاری صفر و ۳۷۹ finding مربوط به provenance/review باقی است. این findingها به‌صورت fail-closed اجازهٔ انتشار asset تأییدنشده را نمی‌دهند و جعل مجوز نشده است.
- مرحله ۵ (pre-release): full rerun تجمیعی ۱۲۵ تست واحد backend و ۲۵ integration را سبز کرد؛ پوشش backend برابر ۵۸٫۵۲٪ است. سناریوهای integration شامل HLS manifest/segment، MP4 Range، entitlement پولی و revoke، DTO allowlist، mount خصوصی و gateway تصویر عمومی است. چرخه migration `base -> head -> base -> head` تا `b5e7c9d1f3a2`، `alembic check` و verifierهای فازهای ۲ تا ۵ سبز هستند.
- مرحله ۵ (امنیت dependency): `ruff`، `compileall` و `bandit` سبز هستند؛ `npm audit --omit=dev` و `pip-audit` هیچ آسیب‌پذیری شناخته‌شده‌ای گزارش نکردند.
- مرحله ۵ (pending): release SHA، GitHub CI، deploy Hugging Face، Vercel Preview محافظت‌شده و smoke زنده پس از اتمام gate نهایی ثبت می‌شوند. تا آن زمان این سند ادعای deploy فاز پنج ندارد.

## ردیابی هفت‌مرحله‌ای

1. ممیزی baseline و قرارداد API — تکمیل‌شده.
2. مدل داده، migration و verifier — تکمیل‌شده.
3. workflow پیش‌نویس/اعتبارسنجی/انتشار/آرشیو — تکمیل‌شده.
4. HLS امضاشده، entitlement زنده، Range و audit — تکمیل‌شده.
5. player API-driven و زیرنویس DB بدون hardcode شناسه‌ای — تکمیل‌شده.
6. پاک‌سازی دیکشنری و inventory/registry مجوز — تکمیل فنی؛ ۳۵۰ provenance انسانی باز است.
7. full rerun محلی — تکمیل‌شده؛ release SHA، CI، deploy محافظت‌شده و smoke زنده pending است.
