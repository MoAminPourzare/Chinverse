# چک‌لیست بستن مرحلهٔ ۲ (staging) — قابل‌ادامه

این سند برای ادامهٔ کار پس از قطع‌شدن نشست یا تمام‌شدن توکن نگه‌داری می‌شود.
منظور از «مرحلهٔ ۲» در این سند، مرحلهٔ staging در
`docs/LAUNCH_READINESS_ACTION_PLAN_FA.md` است، نه فاز قدیمیِ دیتابیس/فایل.

## وضعیت فعلی

کد و استقرار برای release زیر سالم و قابل‌ردیابی است:

```text
98918b607fd67b3e6c3f6d08de354fbcb86e1759
```

- backend روی HF همین SHA را گزارش می‌کند؛ `/health` و `/health/ready` سبز هستند.
- `database_target`، `database` و `storage` در readiness برابر `ok` هستند.
- deployment متادیتای Vercel برای همین SHA موفق است.
- preview ناشناس عمداً با SSO محافظت می‌شود و `X-Robots-Tag: noindex` می‌دهد.
- smoke بدون secret برای signup/login/account/chat/WebSocket/RBAC/cleanup موفق است.
- workflow smoke در commit‌های بعدی URL immutable deployment همان SHA را resolve
  می‌کند؛ بنابراین docs-only deployment جدیدِ branch alias، تست release را منحرف
  نمی‌کند.

پس کار باقی‌مانده «رفع باگ عمومی» نیست؛ دو شاهد live برای بستن رسمی gate کم است.

## کار ۱ — مشاهدهٔ health داخلی frontend

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

4. در **Actions → Phase 2 exact-SHA staging smoke → Run workflow**، شاخهٔ
   `codex/phase-8-beta-release` و ورودی‌های زیر را انتخاب کن:

   ```text
   release_sha: 98918b607fd67b3e6c3f6d08de354fbcb86e1759
   run_backend_stateful: true
   run_stateful: false
   ```

5. در summary اجرا باید این سه مورد دیده شود: frontend `/api/health` با همان SHA،
   بررسی `robots/login/disabled routes`، و backend synthetic smoke سبز.
6. اگر secret فقط برای همین بررسی ساخته شده است، آن را از Vercel و GitHub حذف/rotate
   کن؛ اگر برای monitor مرحلهٔ ۷ لازم است، آن را فقط در Environment `staging` نگه
   دار و هرگز در `production` یا به‌صورت header سراسری استفاده نکن.

## کار ۲ — یک محتوای synthetic برای اثبات signed playback

catalog staging اکنون `200 []` است. این پاسخ برای empty-state درست است، اما بدون یک
lesson منتشرشده نمی‌توان entitlement و URL امضاشده را live اثبات کرد.

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

## دسترسی‌هایی که لازم است

اگر می‌خواهی من اجرای کار ۲ را انجام دهم، secretها را داخل چت نفرست. یکی از این دو
روش را انتخاب کن:

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

مرحلهٔ ۲ وقتی `✅` می‌شود که کار ۱ مشاهدهٔ frontend را ثبت کند و کار ۲ حداقل یک
lesson رایگانِ منتشرشده را با signed playback/entitlement و cleanup اثبات کند.
اگر عمداً آموزش را در این release خالی نگه می‌داری، باید همین تصمیم را صریحاً به‌عنوان
`accepted-empty-catalog` ثبت کنی؛ در آن حالت مرحله از نظر استقرار سبز است، اما signed
playback هنوز «اثبات‌شده» محسوب نمی‌شود.

فرمان ادامه در نشست بعدی:

```text
مرحلهٔ ۲ را از PHASE_2_CLOSEOUT_CHECKLIST_FA.md ادامه بده
```
