# گزارش فاز هشت: بتای بسته و انتشار

تاریخ ممیزی: ۲۴ اوت ۲۰۲۶

این سند قرارداد انتشار فاز هشت، شواهد محلی و مواردی را که فقط با دسترسی مالک به
providerها قابل اثبات هستند ثبت می‌کند. اجرای DNS، ساخت حساب پرداخت، ارسال
پیام واقعی، تغییر رکورد WAF یا promotion production بدون تأیید صریح مالک انجام
نمی‌شود.

## نتیجه‌ی ممیزی فاز هفت

فاز هفت از نظر implementation و gate محلی کامل است، اما طبق بخش «شواهد نهایی»
در [`PHASE_7_PERFORMANCE_OPERATIONS_FA.md`](PHASE_7_PERFORMANCE_OPERATIONS_FA.md)
این موارد هنوز evidence زنده ندارند: promotion همان SHA به staging، smoke/load/soak
زنده، اجرای monitor و recovery، و drill مدیریت‌شده Neon. بنابراین فاز هفت برای
شرط «آماده‌ی انتشار» هنوز **کامل‌شده‌ی نهایی نیست**؛ فاز هشت می‌تواند کنترل‌های
بتا و release را آماده کند، ولی نمی‌تواند این evidence بیرونی را جعل کند.
این نتیجه با جدول شواهد نهایی و وضعیت provider در گزارش فاز هفت (بخش‌های پایانی
سند و شرط خروج آن) تطبیق داده شده است.
همچنین workflow فعلی backend به شاخه‌ی فاز هفت محدود است؛ پس از merge به
`main`، promotion باید با SHA کامل و dispatch/محیط محافظت‌شده انجام شود و نباید
فرض کرد push عادی به `main` خودکار production را تغییر می‌دهد.

## شرط خروج فاز هشت

انتشار عمومی فقط وقتی مجاز است که همه‌ی موارد زیر در یک release record ثبت شوند:

1. تعداد P0 و P1 باز صفر باشد؛ Critical و High شناخته‌شده نیز صفر باشند.
2. release frontend و backend یک SHA immutable و یک pair سازگار باشند.
3. بتای محدود حداقل یک cohort واقعی، consent معتبر، کانال feedback و owner پاسخ
   داشته باشد؛ داده‌ی شخصی feedback در issue عمومی کپی نشود.
4. Neon و object storage تولید از staging جدا، backup و restore روی مقصد ایزوله
   موفق، و retention/نسخه‌بندی فعال باشد.
5. دامنه‌ی متعلق به مالک با TLS، DNS، WAF، origin restriction، rate limit و
   health check سبز باشد.
6. email/SMS، Turnstile و payment با secretهای محیط production، webhook امضا‌شده،
   idempotency و refund/reconciliation smoke شوند.
7. canary، افزایش مرحله‌ای ترافیک، معیار توقف و rollback operator تأیید شده باشد.

منبع machine-readable این شرط:
[`PHASE_8_RELEASE_BLOCKERS.json`](PHASE_8_RELEASE_BLOCKERS.json)

## tracker هفت‌مرحله‌ای

| مرحله | دامنه | وضعیت | evidence / خروجی |
|---:|---|---|---|
| ۱ | ممیزی فاز هفت و تعیین release baseline | انجام‌شده محلی؛ promotion زنده pending | گزارش فاز هفت و commitهای gate محلی |
| ۲ | بتای بسته، allowlist، consent و feedback | implementation محلی انجام‌شده؛ cohort واقعی pending | backend beta/feedback contract، `/beta-feedback` invite/feedback UI، cohort record و تست‌ها |
| ۳ | جداسازی production Neon/storage و backup drill | pending دسترسی provider | runbook و blocker record؛ بدون mutation بیرونی |
| ۴ | دامنه اصلی، DNS/TLS/WAF، email/SMS، Turnstile و payment | pending دسترسی مالک/provider | checklist پایین؛ secretها فقط در manager |
| ۵ | canary و staged rollout با توقف خودکار | آماده‌ی محلی | workflow دستی و environment protection در `.github/workflows/phase8-release-gate.yml` |
| ۶ | incident، rollback و recovery | مستند و قابل‌اجرا محلی؛ drill زنده pending | [`PHASE_8_RELEASE_RUNBOOK_FA.md`](PHASE_8_RELEASE_RUNBOOK_FA.md) |
| ۷ | gate نهایی، شواهد و تصمیم انتشار | مسدود تا provider evidence | `verify-phase8-release.ps1` + blocker JSON + صفر P0/P1 |

## بتای بسته و feedback

بتا باید با allowlist قابل revoke اجرا شود؛ email یا user id خام در log/URL/issue
نمی‌آید. سهم rollout با hash پایدار user id تعیین می‌شود تا با هر deploy cohort
جابجا نشود. محیط staging و beta هرگز نباید به داده‌ی production یا payment واقعی
وصل شوند.
فلگ backend (`FEATURE_BETA_ENABLED`) و فلگ shell فرانت (`NEXT_PUBLIC_BETA_MODE`)
باید در یک release pair عمداً هم‌زمان تنظیم شوند؛ مقدار پیش‌فرض هر دو خاموش است.

حداقل رکورد cohort شامل release SHA، زمان UTC، تعداد دعوت/فعال/بازخورد، نرخ
خطای P0/P1، owner و تصمیم ادامه/توقف است. feedback از مسیر support موجود یا
provider مورد تأیید دریافت و با request id و release correlate می‌شود، بدون token،
cookie، email یا متن خصوصی در issue عمومی.

### قرارداد backend بتا

نسخه‌ی فعلی مسیر مستقل و fail-closed دارد: `GET /api/v1/beta/status` وضعیت cohort
و نسخه‌ی consent را می‌دهد، `POST /api/v1/beta/invites/redeem` کد یک‌بارمصرف را
redeem می‌کند، `POST /api/v1/beta/consent` همان نسخه‌ی terms را به‌صورت idempotent
در `legal_acceptances` ثبت و audit می‌کند، و `POST /api/v1/beta/feedback` فقط پس از
eligibility و consent بازخورد ساختاریافته را در DB نگه می‌دارد. کد دعوت و ایمیل خام
در DB ذخیره نمی‌شوند؛ فقط HMAC/digest، user FK و metadata محدود ثبت می‌شود. admin
می‌تواند invite صادر، invite را با `POST /api/v1/admin/beta/invites/{invite_id}/revoke`
باطل و feedback را triage کند. `FEATURE_BETA_ENABLED=false` پیش‌فرض
است و UI به‌تنهایی نمی‌تواند دسترسی را باز کند.

درگاه پرداخت فقط interface و ledger امضای callback/idempotency دارد؛
`PAYMENT_PROVIDER=disabled` پیش‌فرض است و `generic_hmac` checkout یا entitlement
صادر نمی‌کند. تا نصب و بازبینی آداپتور واقعی و secret provider، فعال‌سازی پرداخت
عمومی مجاز نیست.

## checklist دامنه و WAF

این موارد باید در dashboard provider و سپس در release record ثبت شوند:

- دامنه‌ی اصلی و `www` در مالکیت پروژه؛ redirect واحد به canonical HTTPS؛
- DNS فقط A/AAAA/CNAME لازم، TTL مناسب rollout و DNSSEC در صورت پشتیبانی؛
- TLS معتبر، HSTS پس از تأیید certificate و no mixed content؛
- WAF: block origin مستقیم، rate limit برای auth/upload، challenge فقط روی abuse،
  و allowlist webhook providerها؛
- `ALLOWED_HOSTS` و CORS backend فقط canonical frontend/API origin؛
- health/readiness بدون bypass عمومی، cache-control `no-store` و alert روی 5xx؛
- CDN فقط asset عمومی versioned؛ API، cookie، entitlement و private media هرگز
  cache عمومی نشوند.

تا تعیین دامنه، هیچ hostname فرضی در کد production قرار نمی‌گیرد و مقدارهای
نمونه‌ی `.env.example` عمداً local/staging باقی می‌مانند.

## email/SMS، Turnstile و payment

فعال‌سازی واقعی نیازمند secret manager و دسترسی صاحب حساب است. قبل از live:

1. provider sandbox با timeout، retry محدود و idempotency key تست شود؛
2. webhook فقط HTTPS، امضا و timestamp را بررسی کند و replay رد شود؛
3. email verification و reset، SMS fallback و unsubscribe/consent ثبت شوند؛
4. payment success، timeout، duplicate webhook، refund و chargeback در sandbox
   و سپس با مبلغ آزمایشی live ثبت شوند؛
5. entitlement فقط از webhook تأییدشده صادر و با revoke/expiry دوباره بررسی شود؛
6. secret، شماره، token و payload خصوصی در logs یا report نیاید.

کد فعلی payment فقط مرز callback امضاشده و idempotency را fail-closed نگه می‌دارد؛
این **درگاه واقعی یا checkout قابل‌فروش نیست** و تا نصب adapter تأییدشده نباید
فلگ اشتراک production روشن شود.

## staged rollout

ترتیب مجاز: internal operator → cohort بتا (۵٪) → ۲۵٪ → ۵۰٪ → ۱۰۰٪. هر مرحله
حداقل ۱۵ دقیقه observation (یا یک window توافق‌شده) دارد و فقط با معیارهای زیر
افزایش می‌یابد:

- health/readiness سبز؛
- P0/P1 جدید صفر؛ 5xx و auth/payment failure زیر budget؛
- p95 و saturation DB/storage داخل budget فاز هفت؛
- feedback بحرانی بدون پاسخ نمانده باشد.

هر شکست threshold، افزایش rollout را متوقف و آخرین release immutable سالم را
برمی‌گرداند. rollout ۱۰۰٪ نیازمند `confirm_public=true` و approval محیط protected
است؛ workflow به‌صورت خودکار DNS، payment یا WAF را تغییر نمی‌دهد. مانند هر
workflow دستی، dispatch عملی آن پس از merge فایل به default branch و ساخت
environment محافظت‌شده‌ی `production` ممکن است؛ پیش از آن فقط lint و verifier
محلی قابل‌اثبات است.

## وضعیت فعلی و blockerها

در زمان این گزارش هیچ credential یا session قابل‌استفاده برای GitHub Ruleset،
Vercel Production، Hugging Face production Space، Neon management، Sentry،
Cloudflare DNS/WAF یا payment/email/SMS ارائه نشده است. رکوردها در
`PHASE_8_RELEASE_BLOCKERS.json` به‌صورت صریح `pending` هستند. این pending بودن
به‌معنای وجود P0/P1 نرم‌افزاری نیست؛ به‌معنای نبود evidence عملیاتی است و شرط
انتشار را fail-closed نگه می‌دارد.

## فرمان‌های gate محلی

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-phase8-release.ps1
```

برای promotion واقعی، ابتدا quality gate همان SHA، سپس workflow دستی با environment
protected و health URLهای ثبت‌شده اجرا شود. هیچ secret را در command line یا chat
قرار نده.

## شواهد اجرای همین ممیزی

- backend non-integration: `174 passed, 28 deselected`، پوشش `60.34%`؛
- backend Ruff و compileall: موفق؛
- frontend Vitest: `25` فایل و `84` تست موفق؛
- `npm run typecheck`: موفق؛
- `npm run lint`: موفق؛
- `npm run build`: موفق؛ route جدید `/beta-feedback` در build و در مجموع ۶۶ route
  تولید شد؛
- `verify-phase8-release.ps1`: موفق؛ هیچ P0/P1/Critical/High شناخته‌شده در blocker
  record ثبت نشده است؛ provider gateها عمداً `pending` باقی مانده‌اند؛
- اجرای همان verifier با `-RequireAllProviderGates` عمداً fail-closed شد و هر پنج
  provider gate pending را فهرست کرد؛
- workflow production علاوه بر blocker record، issueهای باز GitHub با labelهای
  `P0`/`P1`/`Critical`/`High` را نیز در لحظه‌ی promotion بررسی و در صورت وجود
  متوقف می‌کند؛
- هیچ DNS، WAF، payment، email/SMS، Sentry DSN، Neon production یا deploy عمومی در
  این ممیزی تغییر نکرده است.

`verify_phase8_schema.py` روی PostgreSQL محلی موجود با revision قدیمی متوقف شد و
به head جدید نرسید؛ اجرای migration و restore کامل باید روی PostgreSQL ایزوله‌ی
تست/CI یا محیط production ثبت‌شده انجام شود. Docker test database در این نشست
در دسترس نبود، بنابراین این مورد به‌عنوان evidence عملیاتی pending باقی می‌ماند،
نه به‌عنوان موفقیت جعلی.
