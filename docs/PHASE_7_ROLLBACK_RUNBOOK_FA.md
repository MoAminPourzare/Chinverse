# Runbook هشدار، rollback و بازیابی ChinVerse

نسخه: فاز هفت، ۲۱ اوت ۲۰۲۶
محیط هدف این نسخه: staging محافظت‌شده
اصل ایمنی: هیچ secret، connection string، token یا response خصوصی در chat، issue،
Git، screenshot یا log قرار نگیرد.

## هدف و trigger

runbook وقتی اجرا می‌شود که یکی از این alertها رخ دهد:

- liveness یا readiness DB/storage fail شود؛
- نرخ `5xx` یا exception از budget مصوب عبور کند؛
- deploy release اشتباه، migration drift یا media/storage corruption مشاهده شود؛
- login/chat/feed یا مسیر حیاتی پس از deploy قابل‌استفاده نباشد؛
- نشت داده یا compromise محتمل باشد.

P0 یعنی افشا/حذف داده، takeover، outage کامل یا corruption رو‌به‌گسترش؛ عملیات
تغییردهنده متوقف و مالک فوراً درگیر می‌شود. P1 یعنی قابلیت حیاتی یا readiness خراب
است اما containment ممکن است. برای P2/P3 rollback فقط با ارزیابی ریسک انجام می‌شود.

## نقش‌ها و کانال ثبت

- Incident commander: مالک پروژه یا فردی که او تعیین می‌کند.
- Operator: دارنده دسترسی محدود GitHub/Vercel/HF/Neon.
- Verifier: فردی غیر از operator، اگر در دسترس باشد.
- رکورد: یک issue خصوصی/محدود یا ticket incident؛ issue عمومی فقط status کلی و
  لینک run بدون داده حساس دارد.

هر رخداد باید UTC start، release خراب، آخرین release سالم، اثر کاربر، تصمیم،
فرمان‌های اجراشده، backup checksum، زمان recovery و اقدام پس از رخداد را ثبت کند.

## containment اولیه

1. alert را acknowledge و severity را تعیین کن؛ وضعیت را حدس نزن.
2. releaseهای frontend/backend و نتیجه health را ثبت کن.
3. اگر write می‌تواند corruption را بیشتر کند، feature مربوط یا کل write path را
   از edge محدود کن؛ خاموش‌کردن DB یا حذف فایل ممنوع است.
4. پیش از migration downgrade یا data repair، backup تازه بگیر.
5. deployهای هم‌زمان را متوقف کن و فقط یک operator ادامه دهد.
6. credential compromise با rotate/revoke پاسخ داده می‌شود، نه فقط rollback کد.

baseline شناخته‌شده پیش از فاز هفت:

- frontend code=`1219342ce50139c1ac6a109ad7f1cb23ba2b7bab`؛
- backend=`3b3a918a66ea7df875965130ff86c7d1a1227576`؛
- Alembic head=`b5e7c9d1f3a2`.

این مقادیر صرفاً نقطه شروع‌اند؛ هنگام incident باید از run و deployment واقعی
دوباره تأیید شوند.

## rollback فرانت Vercel

1. deployment قبلی را که SHA دقیق و Quality Gates سبز دارد انتخاب کن.
2. در Vercel همان deployment immutable را Promote/Rollback کن؛ rebuild از working
   tree یا commit نامشخص مجاز نیست.
3. `/api/health` باید release مورد انتظار و tier staging را برگرداند.
4. landing، login shell، BFF read، offline shell و یک journey authenticated امن
   smoke شوند.
5. اگر backend contract ناسازگار است، frontend و backend به pair سازگار برگردند.
6. Preview همچنان SSO-protected بماند؛ Share انسانی موقت پس از verify revoke شود.

اگر automation bypass استفاده می‌شود فقط secret مانیتور باقی می‌ماند؛ مقدار آن
هرگز در URL یا issue ثبت نمی‌شود.

## rollback بک‌اند Hugging Face

1. SHA قبلی باید در ancestry شاخه release فاز هفت باشد و Quality Gates همان SHA
   با event push موفق داشته باشد.
2. workflow `Deploy staging backend` را با `release_sha` کامل اجرا کن.
3. release معمولی فقط وقتی موفق است که health همان SHA و readiness شامل
   database=`ok` و storage=`ok` باشد.
4. releaseهای پیش از قرارداد storage برای rollback مستقیم مجاز نیستند. اگر تنها
   baseline قدیمی است، patch خراب revert می‌شود اما observability/readiness فاز
   هفت حفظ و یک SHA جدید با Quality Gates کامل ساخته می‌شود.
5. log build/startup، migration head و Space commit ثبت شوند.

workflow فایل‌ها را با `--delete="*"` mirror می‌کند و startup فعلی migration را
پیش از Uvicorn اجرا می‌کند. failure post-deploy به‌معنای rollback خودکار نیست؛
operator باید وضعیت release واقعی `/health` را ببیند و در صورت لزوم SHA سالم را
صریح دوباره deploy کند.

## rollback دیتابیس Neon

rollback کد را از rollback schema جدا نگه دار. ابتدا بررسی کن آیا release قبلی با
schema جدید backward-compatible است؛ اگر بله downgrade زنده انجام نده.

backup جدید:

```powershell
pwsh -NoProfile -File .\scripts\backup-database.ps1 `
  -SourceLabel phase7-staging `
  -OutputDirectory .\.backups\phase7-incident
```

metadata باید checksum، release SHA و `alembic_revision` داشته باشد. restore فقط
روی branch/DB ایزوله:

```powershell
pwsh -NoProfile -File .\scripts\restore-database.ps1 `
  -DumpPath .\.backups\phase7-incident\BACKUP.dump `
  -ConfirmIsolatedTarget
```

برای backup legacy که metadata revision ندارد، operator پس از review dump و سند
فاز مربوط، revision را صریح می‌دهد:

```powershell
pwsh -NoProfile -File .\scripts\restore-database.ps1 `
  -DumpPath .\.backups\legacy\BACKUP.dump `
  -ExpectedAlembicRevision REVIEWED_REVISION `
  -ConfirmIsolatedTarget
```

restore روی source، مقصد هم‌host بدون override ایزوله، checksum خراب، metadata
ناسازگار یا revision متفاوت fail-closed است. پس از restore باید invariantهای schema،
تعداد sentinelها و journey read اجرا شوند. تغییر production یا حذف Neon branch
نیازمند تأیید صریح مالک است.

## rollback storage و رسانه

1. DB URL/key قدیمی تا پایان verification حذف نشود.
2. فایل یا object را overwrite/delete نکن؛ ابتدا checksum و provenance را ثبت کن.
3. mounted storage: وجود root، قابلیت read/write probe و نمونه avatar/gallery/service
   تأیید شود.
4. S3 آینده: versioning/lifecycle و bucket جدا؛ restore object با نسخه قبلی و سپس
   DB pointer در transaction انجام شود.
5. HLS/private media فقط از gateway entitlement و Range smoke شود؛ provider URL
   نباید به browser/log برگردد.

## verification و recovery

rollback زمانی تمام است که همه موارد زیر سبز باشند:

- frontend health release مورد انتظار؛
- backend health release مورد انتظار؛
- readiness database و storage؛
- login/refresh/logout fixture، feed/course read، upload کوچک و WebSocket chat؛
- صفر migration drift و خطای تکرارشونده P0/P1 در error tracking؛
- monitor دستی سبز و issue alert با پیام recovery بسته شده باشد.

سپس writeها مرحله‌ای باز، بار و error برای حداقل ۱۵ دقیقه مشاهده و incident از
active به monitoring منتقل می‌شود. RTO هدف staging ۳۰ دقیقه و RPO هدف پس از فعال
شدن backup دوره‌ای ۲۴ ساعت است؛ تا وقتی drill واقعی زمان/نسخه را اثبات نکرده این
دو فقط objective هستند، نه SLA.

## alert matrix

| signal | شرط | اقدام اول |
|---|---|---|
| frontend health | non-2xx، tier/release اشتباه | Vercel deployment و protection را بررسی کن |
| backend liveness | non-2xx یا release اشتباه | HF runtime/build و آخرین deploy را بررسی کن |
| DB readiness | failed/timeout | Neon status، pool و query saturation را بررسی کن |
| storage readiness | failed/timeout | mount/S3 permission و quota را بررسی کن |
| exception/error budget | عبور از threshold | request ID/release را correlate و feature را contain کن |
| load/soak | error>۱٪ یا p95>۲۵۰۰ms | deploy نکن؛ query/egress/pool را پروفایل کن |

GitHub monitor failure یک issue ops deduplicated ایجاد می‌کند و recovery آن را
می‌بندد. schedule و workflow_dispatch این فایل جدید تنها پس از حضور workflow در
default branch قابل‌اتکا هستند؛ پیش از merge فقط probe مستقیم و verifier محلی
ثبت می‌شود. GitHub issue alert جایگزین pager یا Sentry نیست و مالک باید
notification حساب را فعال نگه دارد.

## drill لازم پیش از بستن فاز

1. monitor failure کنترل‌شده بدون ثبت secret و recovery واقعی؛
2. rollback Vercel به deployment قبلی و بازگشت به release فاز هفت؛
3. rollback HF به SHA سازگار و بازگشت به release فاز هفت؛
4. backup schema فعلی و restore روی Neon branch موقت؛
5. اندازه‌گیری RTO/RPO واقعی و ثبت checksum/revision؛
6. حذف branch موقت فقط پس از تأیید و با مجوز مالک.
