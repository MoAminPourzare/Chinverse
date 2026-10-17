# چک‌لیست بستن مرحلهٔ ۲ (staging) — قابل‌ادامه

این سند برای ادامهٔ کار پس از قطع‌شدن نشست یا تمام‌شدن توکن نگه‌داری می‌شود.
منظور از «مرحلهٔ ۲» در این سند، مرحلهٔ staging در
`docs/LAUNCH_READINESS_ACTION_PLAN_FA.md` است، نه فاز قدیمیِ دیتابیس/فایل.

## وضعیت فعلی — بسته‌شده در ۲۰۲۶-۰۹-۰۸

کد و استقرار برای release زیر سالم و قابل‌ردیابی است:

```text
8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18
```

- backend و frontend staging همین SHA را گزارش می‌کنند؛ `/health` و `/health/ready` سبز هستند.
- `database_target`، `database` و `storage` در readiness برابر `ok` هستند.
- deployment متادیتای Vercel برای همین SHA موفق است.
- preview ناشناس عمداً با SSO محافظت می‌شود و `X-Robots-Tag: noindex` می‌دهد.
- smoke بدون secret برای signup/login/account/chat/WebSocket/RBAC/cleanup موفق است؛
  smoke رسانه نیز entitlement رایگان، signed playback با Range `206` و subtitle فارسی را تأیید کرد.
- پس از smoke، fixture دقیق از Neon staging حذف شد و query نهایی برای course/section/lesson/subtitle/media همگی `0` برگشت.
- دو فایل `phase2-closeout-cover.png` و `phase2-closeout-video.mp4` از bucket خصوصی حذف شدند؛ UI پس از refresh مقدار `0 Bytes / 0 files` را نشان داد.
- endpointهای عمومی course fixture و playback درس 205 پس از cleanup هر دو `404` هستند؛ health همچنان `200` و readiness همچنان سبز است.
- workflow smoke در commit‌های بعدی URL immutable deployment همان SHA را resolve
  می‌کند؛ بنابراین docs-only deployment جدیدِ branch alias، تست release را منحرف
  نمی‌کند.
- آخرین اصلاح workflow در commit `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`
  push شده و deployهای frontend/backend را روی یک release SHA نگه می‌دارد؛
  Quality Gates `34215969535`، HF deploy `34215969479` و exact-SHA smoke `34215969552` سبز هستند.

مرحلهٔ ۲ رسماً بسته است؛ کار بعدی از اولین مرحلهٔ باز، یعنی مرحلهٔ ۳ عملیات، ادامه می‌یابد.

## نتیجهٔ نهایی

مرحلهٔ ۲ (`staging`) با وضعیت `✅` بسته شد. cleanup فقط روی branch=`staging`
در پروژهٔ Neon `twilight-unit-31615795` و bucket خصوصی staging انجام شد؛
production، `main` و داده‌های واقعی کاربران در این عملیات لمس نشدند.

## کار ۱ — انجام‌شده: مشاهدهٔ health داخلی frontend

این بخش، دستورالعمل تاریخی اجرای preflight است؛ blocker آن با مشاهدهٔ نشست SSO
بسته شد و نیازی به ساخت bypass جدید برای بستن مرحلهٔ ۲ نیست.

این کار فقط برای تست است و نباید SSO یا Deployment Protection را خاموش کند.

1. در Vercel پروژهٔ `death-stroke/chinverse` به مسیر
   **Settings → Deployment Protection → Protection Bypass for Automation** برو.
2. یک secret موقت و محدود به همین پروژه/Preview بساز. مقدار secret را در چت، فایل
   یا لاگ قرار نده.
3. در GitHub مخزن `MoAminPourzare/Chinverse` به مسیر
   **Settings → Environments → staging → Environment secrets** برو و secret زیر
   را با همان مقدار ذخیره کن:

   ```text
   Name: VERCEL_AUTOMATION_BYPASS_SECRET
   ```

4. در اجرای ثبت‌شدهٔ **Phase 2 exact-SHA staging smoke**، شاخهٔ
   `codex/phase-8-beta-release` با release زیر استفاده شد:

   ```text
   release_sha: 8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18
   run_backend_stateful: true
   run_stateful: false
   ```

5. در summary اجرا باید این سه مورد دیده شود: frontend `/api/health` با همان SHA،
   بررسی `robots/login/disabled routes`، و backend synthetic smoke سبز.
6. اگر secret فقط برای همین بررسی ساخته شده است، آن را از Vercel و GitHub حذف/rotate
   کن؛ اگر برای monitor مرحلهٔ ۷ لازم است، آن را فقط در Environment `staging` نگه
   دار و هرگز در `production` یا به‌صورت header سراسری استفاده نکن.

## کار ۲ — انجام‌شده: محتوای synthetic و cleanup

برای اثبات live، یک course/lesson رایگان synthetic با subtitle فارسی ساخته و
منتشر شد؛ playback امضاشده، entitlement و Range `206` تأیید شدند. سپس همان fixture
به‌صورت محافظت‌شده حذف شد و catalog/playback نبود آن را `404` برگرداندند.

محتوای واقعی یا مجوز تجاری لازم نیست؛ یک تصویر و ویدیوی کوتاه synthetic/free کافی
است. بااین‌حال backend عمداً فقط پس از طی workflow زیر انتشار را قبول می‌کند:

1. مطمئن شو مقصد **Neon staging** است: branch
   `br-shiny-darkness-at6obb2e` و endpoint `ep-wild-band-atse2yoq`؛ به production
   وصل نشو. اتصال باید `sslmode=verify-full` داشته باشد.
2. یک حساب admin فعال و MFAدار در staging آماده کن. signup عادی به‌تنهایی admin
   نیست؛ ارتقای نقش و تأیید MFA باید از مسیر کنترل‌شدهٔ staging انجام شود.
3. asset تصویر cover و asset ویدیو را در storage خصوصی staging قرار بده و در DB
   ثبت کن. برای هر asset checksum، `storage_key` و نوع رسانه باید واقعی باشد.
4. برای هر asset این workflow را اجرا کن: `register → license-review(approved) →
   publish`. مقدار `approved` در اینجا فقط state فنی fixture است و ادعای مجوز
   تجاری نیست.
5. یک course و section بساز، سپس یک lesson رایگان را به video asset وصل کن و به‌ترتیب
   `publish lesson → publish course` را انجام بده.
6. حداقل یک subtitle track کوتاه (ترجیحاً JSON با cueهای بدون overlap) بساز، quality
   validation را بگذران و track را publish کن.
7. با یک کاربر عادی staging، `GET /api/v1/courses/` و
   `GET /api/v1/courses/lessons/{id}/playback` را بررسی کن. باید `200`،
   `entitlement.granted=true` برای lesson رایگان، `playback_url` امضاشده با expiry،
   و subtitle منتشرشده برگردد؛ URL خام provider/storage نباید در DTO عمومی باشد.
8. همان fixture را با شناسهٔ run ثبت‌شده پاک کن و دوباره catalog/playback را بررسی کن.

در کد فعلی seed قدیمیِ `backend/seed_lms.py` این کار را انجام نمی‌دهد: آن فقط
Course/Section/Lesson با `SAMPLE_VIDEO` می‌سازد و MediaAsset یا publication state
ایجاد نمی‌کند. از آن برای staging استفاده نکن.

## دسترسی‌های استفاده‌شده (تاریخی)

admin دارای MFA در staging و نشست‌های Neon/HF در ۲۰۲۶-۰۹-۰۸ آماده و استفاده شدند؛
هیچ secret یا credential در چت، فایل یا لاگ قرار نگرفت.

این گزینه‌ها فقط برای بازاجرای تاریخی هستند و برای مرحلهٔ ۲ بسته‌شده لازم نیستند:

- خودت در Neon staging وارد شو و بگو «Neon staging آماده است» تا فقط همان branch را
  با fixture synthetic بررسی و cleanup کنم؛ یا
- این نام‌ها را فقط در GitHub Environment `staging` قرار بده و بگو workflow را اجرا
  کنم:

  ```text
  PHASE2_STAGING_DATABASE_URL
  PHASE2_USER_1_PASSWORD
  PHASE2_USER_2_PASSWORD
  PHASE2_MODERATOR_PASSWORD
  PHASE2_ADMIN_PASSWORD
  VERCEL_AUTOMATION_BYPASS_SECRET
  ```

مقدار هیچ‌کدام نباید در issue، artifact، خروجی Actions یا گزارش commit شود.

## معیار نهایی و فرمان ادامه

مرحلهٔ ۲ با ثبت هر دو شاهد بالا `✅` شده است: health داخلی frontend و یک lesson
رایگانِ منتشرشده با signed playback/entitlement و cleanup. catalog خالی فعلی
نتیجهٔ cleanup است، نه blocker؛ تصمیم `accepted-empty-catalog` لازم نیست.

فرمان ادامه در نشست بعدی (برای مرحلهٔ بعد):

```text
مرحلهٔ ۳ را از LAUNCH_READINESS_ACTION_PLAN_FA.md ادامه بده
```
