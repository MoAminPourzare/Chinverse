# گزارش فاز هفت: کارایی و عملیات

تاریخ ممیزی و شروع اجرا: ۲۱ اوت ۲۰۲۶
شاخه: `codex/phase-7-performance-operations`
وضعیت این سند: implementation و پذیرش محلی کامل؛ promotion همان SHA به staging،
load/soak زنده و فعال‌سازی provider اختیاری Sentry در بخش شواهد نهایی ثبت می‌شوند.

## دامنه و معیار پذیرش

فاز هفت این قراردادها را پوشش می‌دهد:

1. تمام درخواست‌های مرورگر و providerها timeout محدود، retry کنترل‌شده و حالت
   offline قابل‌فهم داشته باشند؛ mutationهای ناامن خودکار retry نشوند.
2. polling چت و اعلان با visibility/network تطبیق یابد و WebSocket در failure به
   polling محدود و دارای backoff برگردد.
3. مسیرهای پرترافیک query و تصویر ممیزی و budget مشخص داشته باشند.
4. load و soak فقط روی local یا staging اثبات‌شده، با GET، سقف سخت و گزارش JSON
   تکرارپذیر اجرا شوند.
5. frontend، backend، DB و storage دارای liveness/readiness پیوسته باشند.
6. request ID، structured logging و error tracking بدون ثبت token/cookie/PII فعال
   باشند.
7. شکست monitor یک alert قابل‌ردیابی بسازد و recovery آن را ببندد.
8. rollback کد، DB و storage با release immutable، backup معتبر و smoke پس از
   بازیابی تمرین و مستند شود.

شرط خروج: هیچ P0/P1 باز در scope فاز، pipeline سبز، deploy staging همان SHA، load
و soak با threshold سبز، monitor دستی سبز و rollback drill موفق.

## baseline ممیزی‌شده

### موارد مثبت

- liveness بک‌اند سبک و مستقل است و release/tier را گزارش می‌کند.
- readiness فعلی PostgreSQL را با `SELECT 1` بررسی می‌کرد و Docker از آن استفاده
  می‌کرد.
- استقرار HF با OIDC، checkout یک SHA immutable و الزام Quality Gates انجام می‌شود.
- Preview فرانت با Vercel SSO محافظت می‌شود و health آن release را گزارش می‌کند.
- migrationها در CI از empty DB تا head، rollback تا base و rebuild می‌شوند.
- backup custom-format با checksum و restore transaction-safe از فاز دو وجود داشت.

### gapهای P0/P1 آغاز فاز

- P0 زنده مشاهده نشد: در شروع ممیزی HF `/health` و `/health/ready` هر دو `200`
  و database=`ok` بودند.
- workflow deploy هنوز به شاخه فاز پنج قفل بود؛ بنابراین هر SHA فاز هفت در guard
  branch رد می‌شد.
- readiness storage نداشت و probe دیتابیس deadline صریح نداشت.
- هیچ runner load/soak، structured log، request ID، metrics، Sentry یا alert
  پیوسته در repository نبود.
- هیچ workflow دارای `schedule` نبود؛ failure بعد از deploy فقط در همان run دیده
  می‌شد.
- restore مقدار `c8f1e2a4d6b9` را hardcode کرده بود، در حالی که Alembic head فعلی
  `b5e7c9d1f3a2` است؛ backup جدید به‌اشتباه false-fail می‌شد.
- ۳۵۷ فایل public فرانت حدود ۷۱٫۶۴ MiB بودند، ۲۲ source file تصویر runtime را
  `unoptimized` می‌کردند و ZIPهای بلااستفاده نیز داخل deploy بودند.
- Vercel BFF رسانه را server-side عبور می‌دهد؛ latency، duration/concurrency و
  egress این مسیر پیش از production باید با Range/HLS واقعی اندازه‌گیری شود.
- GitHub API عمومی هیچ Ruleset فعالی برای `main` گزارش نکرد.

## artifacts عملیاتی فاز

| artifact | نقش |
|---|---|
| `.github/workflows/deploy-hf-space.yml` | deploy فقط از ancestry شاخه فاز هفت، release immutable، quality gate دقیق و DB/storage readiness |
| `.github/workflows/phase7-monitor.yml` | probe دوره‌ای frontend/backend/DB/storage و alert issue بدون response body |
| `backend/scripts/phase7_load_test.py` | smoke/load/soak فقط‌خواندنی با guard staging، cap و JSON |
| `backend/alembic/versions/e7c4a9b2d6f1_add_phase7_chat_operations.py` | index، relay و presence چند replica با commit-order |
| `backend/app/core/observability.py` | لاگ/metric/request ID/Sentry privacy policy |
| `backend/app/core/health.py` | DB/storage readiness محدود، cached و single-flight |
| `backend/scripts/verify_phase7_operations.py` | fail-fast قرارداد workflow، load، backup/restore و مستندات در CI |
| `scripts/backup-database.ps1` | ثبت Alembic revision واقعی داخل metadata backup |
| `scripts/restore-database.ps1` | مقایسه revision restore با metadata یا override صریح legacy؛ بدون revision ثابت |
| `docs/PHASE_7_ROLLBACK_RUNBOOK_FA.md` | runbook alert، rollback و recovery |

## پیاده‌سازی نهایی

- timeout مرورگر، upload و BFF محدود و قابل تنظیم است؛ فقط browser مالک retry
  خودکار GET/HEAD است، mutation replay نمی‌شود و `Retry-After` بزرگ‌تر از budget
  کوتاه نمی‌شود. وضعیت online/degraded/offline به کاربر اعلام می‌شود و bannerهای
  اطلاع‌رسانی کنترل‌های صفحه را مسدود نمی‌کنند.
- polling چت/اعلان بر اساس visibility، شبکه، فعالیت و failure backoff می‌گیرد.
  تاریخچه چت پیش از اولین incremental poll کامل و cursor آن seed می‌شود. WebSocket
  auth-first، handshake deadline، ping/pong deadline، reconnect jitter و fallback
  polling دارد.
- fanout چت چند replica بر PostgreSQL relay/presence lease استوار است؛ درج relay
  در commit order serialize می‌شود، fanout هم‌زمان bounded است، slow socket حذف و
  سقف اتصال هر کاربر enforce می‌شود. queryهای conversation/unread با indexهای فاز
  هفت و verifier plan کنترل می‌شوند.
- تصویر عمومی از optimizer allowlist محدود، TTL بلند و component مشترک استفاده
  می‌کند؛ origin API هرگز `/**` نمی‌گیرد و media خصوصی وارد optimizer/cache عمومی
  نمی‌شود. budget خودکار public=`80 MiB` و JavaScript=`4 MiB` داخل check/CI است.
- backend لاگ JSON ساخت‌یافته، request ID محدود، redaction secret/PII، metrics
  محافظت‌شده و middleware کامل ASGI دارد. exception دیتابیس پارامترها را مخفی
  می‌کند. Sentry frontend/backend با scrubber مسیر/بدنه/header/cookie/user/frame
  locals و dynamic identifier آماده است، اما بدون switch+DSN صریح کاملاً خاموش
  می‌ماند و replay/tracing پیش‌فرض ارسال نمی‌شود.
- liveness از dependency مستقل و readiness شامل probe واقعی DB و storage با
  timeout، single-flight و cache کوتاه است. deploy فقط وقتی همان SHA و هر دو probe
  سبز باشند موفق می‌شود.
- migration `e7c4a9b2d6f1`، schema verifier مستقل، runner load/soak read-only،
  monitor alert/recovery و backup/restore revision-aware به gate محلی و CI متصل‌اند.

## قرارداد load و soak

runner فقط GET می‌فرستد. URL دارای credential/query/fragment رد می‌شود. مقصد remote
باید HTTPS باشد، `--allow-staging` صریح دریافت کند و health آن دقیقاً
`deployment_tier=staging` برگرداند. برای production هیچ override وجود ندارد.

| profile | مدت پیش‌فرض | concurrency | نرخ کل | threshold |
|---|---:|---:|---:|---|
| smoke | ۱۵ ثانیه | ۲ | ۱ req/s | error=0، p95≤۲۵۰۰ms |
| load | ۱۸۰ ثانیه | ۱۰ | ۵ req/s | error≤۱٪، p95≤۲۵۰۰ms |
| soak | ۹۰۰ ثانیه | ۵ | ۲ req/s | error≤۱٪، p95≤۲۵۰۰ms |

سقف remote مستقل از CLI برابر concurrency=25، نرخ=25 req/s و مدت=3600s است.
warm-up باید برای همه endpointها `2xx` باشد و سپس p50/p95/p99/max، status code،
network error، throughput و verdict داخل JSON اتمیک ثبت می‌شود. token و Vercel
bypass فقط از `PHASE7_BEARER_TOKEN` و `PHASE7_VERCEL_BYPASS_SECRET` خوانده می‌شوند
و هیچ‌گاه در output قرار نمی‌گیرند.

نمونه اعتبارسنجی بدون شبکه:

```powershell
cd backend
poetry run python scripts/phase7_load_test.py `
  --target backend `
  --base-url http://127.0.0.1:8000 `
  --profile soak `
  --dry-run
```

فرمان دقیق smoke بک‌اند staging پس از warm شدن HF و تأیید release:

```powershell
cd backend
poetry run python scripts/phase7_load_test.py `
  --target backend `
  --base-url https://moamin9-chinverse-api.hf.space `
  --profile smoke `
  --allow-staging `
  --expected-release FULL_LOWERCASE_SHA `
  --json-output ..\.tmp\phase7-backend-smoke.json
```

فرمان دقیق load:

```powershell
cd backend
poetry run python scripts/phase7_load_test.py `
  --target backend `
  --base-url https://moamin9-chinverse-api.hf.space `
  --profile load `
  --allow-staging `
  --expected-release FULL_LOWERCASE_SHA `
  --json-output ..\.tmp\phase7-backend-load.json
```

فرمان دقیق soak:

```powershell
cd backend
poetry run python scripts/phase7_load_test.py `
  --target backend `
  --base-url https://moamin9-chinverse-api.hf.space `
  --profile soak `
  --allow-staging `
  --expected-release FULL_LOWERCASE_SHA `
  --json-output ..\.tmp\phase7-backend-soak.json
```

برای Preview محافظت‌شده فرانت همان سه profile با `--target frontend`، stable
branch URL و متغیر `PHASE7_VERCEL_BYPASS_SECRET` اجرا می‌شوند. threshold هر اجرا
از profile خوانده و در JSON ثبت می‌شود؛ کاهش threshold برای سبزکردن مصنوعی نتیجه
مجاز نیست. سخت‌ترکردن آن با `--max-error-rate` و `--max-p95-ms` مجاز و ثبت‌شدنی است.

برای مسیرهای authenticated، token کوتاه‌عمر fixture staging فقط در متغیر محیطی
قرار می‌گیرد. load روی production، login/reset، upload، moderation mutation یا
داده واقعی کاربر ممنوع است. نتایج HF رایگان ظرفیت production محسوب نمی‌شوند؛ cold
start جدا از steady-state ثبت می‌شود.

## monitor و alert

workflow مانیتور هر ساعت دو بار و با timeout پنج‌دقیقه‌ای اجرا می‌شود و این موارد
را fail-closed می‌سنجد:

- frontend: `status=ok`، tier=`staging` و در صورت تنظیم SHA دقیق؛
- backend liveness: `status=ok`، tier=`staging` و در صورت تنظیم SHA دقیق؛
- readiness: database=`ok` و storage=`ok`.

Preview محافظت‌شده به repository secret با نام
`VERCEL_AUTOMATION_BYPASS_SECRET` نیاز دارد. مقدار آن فقط در GitHub/Vercel secret
manager ثبت می‌شود و نباید داخل chat، issue، log یا فایل قرار گیرد. شکست یک issue
واحد با عنوان ops می‌سازد/به‌روزرسانی می‌کند؛ recovery همان issue را با لینک run
می‌بندد. body پاسخ‌ها در issue کپی نمی‌شود.

محدودیت مهم GitHub: workflow دارای `schedule` و `workflow_dispatch` باید ابتدا در
default branch وجود داشته باشد. تا پیش از merge فاز هفت به `main`، نه cron مرجع
عملیاتی است و نه می‌توان به dispatch این فایل جدید اتکا کرد؛ فقط syntax/verifier
محلی و probe مستقیم قابل‌ثبت است. بلافاصله پس از merge، اولین
`workflow_dispatch` روی SHA نهایی اجرا و سپس cadence زمان‌بندی‌شده مشاهده می‌شود.
این monitor جایگزین Sentry نیست؛ alert exception، source map و trace پس از ثبت
DSN/provider با Sentry تکمیل می‌شود.

## وضعیت provider و دسترسی لازم

| provider | وضعیت قابل‌اثبات | ورودی لازم برای پایان فاز |
|---|---|---|
| GitHub | repository عمومی، credential manager برای Git، Actions فعال؛ Ruleset فعال نیست | دسترسی Settings برای secret مانیتور، Ruleset و در صورت نیاز environment protection |
| Vercel | Preview محافظت‌شده و Git integration فعال؛ CLI محلی در PATH نیست | dashboard session و automation bypass secret scoped به Preview |
| Hugging Face | backend عمومی، OIDC deploy و health سبز؛ CLI/token محلی موجود نیست | dashboard برای env/log/storage و اجرای deploy OIDC |
| Neon | URL runtime staging موجود؛ management token/CLI محلی موجود نیست | dashboard برای branch موقت restore، metric و snapshot drill |
| Sentry | SDK و privacy scrubber frontend/backend نصب و fail-closed است؛ هیچ DSN یا telemetry فعالی وجود ندارد | تأیید مالک، org/project frontend+backend، DSNها و auth token source-map فقط در secret manager |
| Cloudflare | فقط Turnstile؛ CDN/R2 این release استفاده نمی‌شود | برای فاز هفت اجباری نیست؛ production asset domain در فاز هشت تعیین می‌شود |

## sequence تست و deploy

1. verifier، Ruff/compileall/Bandit، unit/integration، migration rebuild و frontend
   gates محلی اجرا شوند.
2. smoke local برای backend/frontend و تست timeout/health/storage سبز شود.
3. commit و push؛ هر سه Quality Gates برای همان SHA سبز شوند.
4. backend با workflow immutable روی HF deploy و DB/storage readiness تأیید شود.
5. Vercel Preview همان SHA آماده و SSO/bypass محدود برای مانیتور تنظیم شود.
6. پس از merge فایل monitor به default branch، dispatch دستی سبز شود؛ پیش از آن
   probe مستقیم ثبت شود. سپس smoke، load و soak staging با JSON اجرا شوند.
7. backup جدید با Alembic revision ساخته، روی Neon branch ایزوله restore و checksum،
   schema و sentinel داده تأیید شود.
8. rollback drill طبق runbook اجرا و سرویس به release فاز هفت بازگردانده شود.
9. Share/bypass موقت انسانی revoke شود؛ automation secret فقط در scope monitor
   بماند. شواهد SHA/run/deploy/load/restore در همین سند ثبت شوند.

## شواهد نهایی

پذیرش محلی release candidate:

- ممیزی نهایی مستقل: صفر finding سطح P0/P1؛ پنج P2 نهایی retry، `Retry-After`،
  initial polling، pong deadline و redaction identifier همگی اصلاح و regression
  test شدند.
- frontend: `23` فایل و `81` unit test؛ statement=`93.48%`، branch=`80.70%`،
  function=`98.50%` و line=`94.28%`. lint، TypeScript و build تولیدی `65` route
  سبز است. budget نهایی public=`75,116,694` bytes از `83,886,080` و JavaScript
  `3,103,725` bytes از `4,194,304` است؛ chunk HLS async با gzip=`156,753` bytes.
- browser production/CI: `155` collected، `150 passed` و `5 skipped` مورد انتظار
  برای live-staging یا قابلیت مختص engine؛ صفر failure در desktop Chromium، mobile
  Chromium، mobile WebKit و profileهای PWA.
- backend: `161 passed`، `28 deselected` و coverage=`59.84%` در unit؛ integration
  PostgreSQL برابر `28 passed`. Ruff، compileall، Bandit، pip-audit و pip check
  سبز و vulnerability شناخته‌شده frontend نیز صفر است.
- migration واقعی `base -> e7c4a9b2d6f1 -> base -> e7c4a9b2d6f1`، Alembic parity،
  verifierهای فاز ۲/۳/۴/۵/۷، تست commit-order concurrent و production Docker build
  سبز شدند.
- backup/restore drill محلی روی دو PostgreSQL 18.4 ایزوله موفق بود: dump custom
  format با SHA-256=`85004d0ee04a8027e1a31bd929ffa54522983d6239f030c487204ad7f100a25c`،
  revision=`e7c4a9b2d6f1` و sentinel داده روی مقصد مستقل تأیید شد؛ containerهای موقت
  پس از verify حذف شدند. drill مدیریت‌شده Neon هنوز به دسترسی dashboard نیاز دارد.

baseline pre-deploy فقط برای اثبات runner روی release فاز پنج اجرا شد: ۱۵ درخواست
GET با نرخ ۱ req/s، صفر خطا، p50=`285.232ms`، p95/p99=`398.238ms` و verdict سبز.
این نتیجه smoke است، load/soak نیست و کیفیت release فاز هفت را اثبات نمی‌کند.

- release SHA و Quality Gates run: pending promotion
- HF deploy run، Space commit و health/readiness: pending
- Vercel deployment و `/api/health`: pending
- backend/frontend smoke JSON: pending
- load JSON و threshold: pending
- soak JSON و threshold: pending
- monitor manual run و alert/recovery drill: pending
- backup/restore محلی: موفق؛ Neon restore branch: pending provider access
- rollback provider و زمان recovery: pending promotion/provider access

Sentry SDK و privacy gate بخشی از release هستند، اما ساخت org/project، ثبت DSN و
ارسال تله‌متری تا تأیید صریح مالک غیرفعال است. این وضعیت نباید با «Sentry فعال»
گزارش شود.

## نتیجهٔ ممیزی تکمیلی پیش از فاز هشت (۲۴ اوت ۲۰۲۶)

ممیزی read-only مستقل، حکم زیر را تأیید کرد: implementation، تست و gate محلی فاز
هفت کامل است، اما operational/release exit هنوز کامل نیست. در نتیجهٔ ممیزی، یک
نقص P2 در interceptor احراز هویت نیز پیدا و اصلاح شد: پس از refresh موفق، replay
فقط برای GET/HEAD/OPTIONS مجاز است و mutationهای POST/PUT/PATCH/DELETE دیگر
خودکار replay نمی‌شوند؛ regression آن در `frontend/src/lib/requestPolicy.test.ts`
ثبت شده است.

شواهد محلی تکمیلی: verifier فاز هفت موفق، تست‌های هدفمند backend برابر ۴۶ مورد
سبز، typecheck و performance budget فرانت سبز. بااین‌حال promotion همان SHA به
staging، deploy/health واقعی HF و Vercel، JSONهای load/soak، اجرای monitor و
alert/recovery، Neon restore/rollback و Sentry DSN همچنان pending هستند. بنابراین
وضعیت فاز هفت در این سند «local implementation complete؛ production promotion
evidence pending» است، نه انتشار عملیاتی.

## شواهد نهایی مشترک با فاز هشت (۲۴ اوت ۲۰۲۶)

پس از اضافه‌شدن migration و کنترل‌های بتای فاز هشت، regression کامل backend بدون
integration برابر `174 passed, 28 deselected` با coverage=`60.34%`، Ruff و
compileall سبز شد؛ frontend برابر `25` فایل و `84` تست، typecheck/lint و build
تولیدی (`66` route) سبز است. این اعداد پذیرش محلی کد هستند و جای promotion،
load/soak زنده، Sentry DSN، restore مدیریت‌شده Neon یا rollback provider را
نمی‌گیرند؛ آن شواهد همچنان طبق جدول بالا pending است.
