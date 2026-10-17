# گزارش اجرای مرحلهٔ ۳ آمادگی انتشار — عملیات و بازیابی

**آخرین به‌روزرسانی:** ۲۰۲۶-۰۹-۱۵
**وضعیت:** ✅ بسته؛ Sentry زندهٔ frontend/backend، privacy، health، load/soak،
alert/recovery و rollback/restore staging همگی با evidence ثبت شده‌اند.
**شاخه:** `codex/phase-8-beta-release`
**release اجرایی نهایی:** `42360d0160ea643183127e281fafe32f55faa044`

## هدف و ترتیب اجرای مرحله

این سند صفحهٔ ادامهٔ مستقل مرحلهٔ ۳ است. هر نشست بعدی باید از اولین موردی که
هنوز `🔶` یا `⏳` است ادامه دهد و بعد از هر اقدام همین سند را به‌روزرسانی کند.

| گام | موضوع | وضعیت فعلی | معیار خروج |
|---|---|---|---|
| ۳.۱ | Sentry با DSN و release/environment | ✅ | eventهای آزمایشی scrubشده در هر دو project staging مشاهده شدند |
| ۳.۲ | لاگ JSON، request/correlation ID و redaction | ✅ | تست redaction و request ID سبز؛ redaction در runtime زنده نیز مشاهده شد |
| ۳.۳ | health واقعی DB/storage/dependencies | ✅ | live `/health/ready` با target/database/storage=`ok` |
| ۳.۴ | smoke/load/soak و JSON evidence | ✅ | سه profile سبز و metric اشباع Neon ثبت شد |
| ۳.۵ | monitor، alert، triage و recovery | ✅ | failure/recovery و issue dedup با لینک run ثبت شد |
| ۳.۶ | rollback کد و restore دیتابیس staging | ✅ | restore شاخهٔ ایزوله، deploy SHA قبلی و بازگشت به SHA فعلی همگی سبز |
| ۳.۷ | تکمیل runbook و مالکیت escalation | ✅ staging | مسئول، threshold، کانال GitHub و objectiveهای RTO/RPO ثبت شدند |

## checkpoint هفتم — فعال‌سازی Sentry زنده

- دو project مجزای `chinverse-backend-staging` (FastAPI) و
  `chinverse-frontend-staging` (Next.js) در organization پروژه ساخته شدند.
- در Vercel، `NEXT_PUBLIC_SENTRY_DSN`، `SENTRY_DSN`،
  `NEXT_PUBLIC_SENTRY_ENABLED=true` و `SENTRY_ENABLED=true` فقط با scope
  **Preview** ثبت شدند؛ هیچ مقدار Sentry به Production اضافه نشد.
- release مرورگر از `VERCEL_GIT_COMMIT_SHA` در زمان build به
  `NEXT_PUBLIC_RELEASE_SHA` تزریق می‌شود تا eventهای client نیز به SHA تغییرناپذیر
  متصل باشند و یک مقدار دستی که بعداً stale شود لازم نباشد.
- switch یک‌بارهٔ `SENTRY_STARTUP_TEST_EVENT` به frontend/backend اضافه شد. این
  switch پیش‌فرض خاموش است، فقط در tier=`staging` event مصنوعی می‌فرستد و حتی با
  misconfiguration در production اثری ندارد. متن مصنوعی عمداً email/token دارد
  تا redaction زنده قابل مشاهده باشد.
- شواهد محلی این checkpoint: backend config/health=`44 passed`، privacy فرانت
  `3 passed`، typecheck موفق، lint با `0` خطا و دو warning قدیمی، build production
  با `66` صفحه موفق و آزمون مستقل تزریق release موفق است.
- backend DSN به‌صورت secret فقط در HF Space staging ثبت شد؛
  `SENTRY_TRACES_SAMPLE_RATE=0` باقی ماند و switch یک‌باره فقط برای یک restart
  staging فعال شد. storage bucket نیز در همان پنل با دسترسی Read & Write روی
  `/data` مشاهده شد.
- در project بک‌اند، issue با کلید `CHINVERSE-BACKEND-STAGING-1` و پیام
  `stage3-backend-live-check` مشاهده شد. tagهای `environment=staging` و
  release=`42360d0160ea643183127e281fafe32f55faa044` درست بودند و email/token
  مصنوعی به‌ترتیب `[redacted-email]` و `[redacted]` نمایش داده شدند.
- در project فرانت‌اند، issueهای `CHINVERSE-FRONTEND-STAGING-1/2` با پیام
  `stage3-frontend-live-check` مشاهده شدند. `environment=staging`، همان release
  کامل و redaction زندهٔ email/token تأیید شد.
- switch موقت Vercel به `false` بازگردانده و Preview همان branch بدون promotion
  به Production دوباره build شد. switch موقت HF حذف شد و Space به‌صورت خودکار
  restart شد؛ DSNها و enabled flagهای دائمی staging دست‌نخورده باقی ماندند.
- پس از cleanup، backend `/health` با HTTP `200` همان release، tier=`staging` و
  `indexable=false` را گزارش کرد و `/health/ready` برای
  database_target/database/storage همگی `ok` بود. health داخلی frontend نیز در
  نشست SSO مالک `ok` مشاهده شد؛ probe ناشناس Preview همچنان `302` و
  `X-Robots-Tag: noindex` است.
- [Quality Gates #89](https://github.com/MoAminPourzare/Chinverse/actions/runs/34962265847)،
  [HF deploy #37](https://github.com/MoAminPourzare/Chinverse/actions/runs/34962265826)
  و [smoke هم‌SHA #28](https://github.com/MoAminPourzare/Chinverse/actions/runs/34962265752)
  برای همین release هر سه با conclusion=`success` پایان یافتند. Production و
  `main` در این checkpoint تغییر نکردند.

## checkpoint سوم — شاخهٔ بازیابی و مانور هشدار

- یک شاخهٔ کاملاً ایزوله با نام `phase3-recovery-drill-20260908` و شناسهٔ
  `br-plain-band-atz12awk` از **staging** در Neon ساخته شد؛ production والد این
  مانور نیست و دست‌نخورده مانده است. شاخه برای حذف خودکار در ۲۰۲۶-۰۹-۰۹ تنظیم
  شده است.
- baseline شاخه ثبت شد: revision الِمبیک `f8a1b2c3d4e5`، تعداد جدول‌های public
  برابر `61`، کاربران `3`، دوره‌ها `68` و درس‌ها `204` است.
- canary فقط روی همین شاخه ایجاد و با یک ردیف
  `phase3-recovery-drill-20260908` تأیید شد؛ revision دیتابیس تغییر نکرد.
- گام بعدی Neon، `Reset from parent` است که canary شاخه را حذف می‌کند؛ چون این
  اقدام دادهٔ آزمایشی را دور می‌ریزد، تا تأیید صریح و لحظه‌ای مالک پروژه اجرا
  نمی‌شود.
- برای قابل اجرا شدن monitor پیش از merge به default branch، یک trigger بسیار
  محدود به push همین فایل روی `codex/phase-8-beta-release` اضافه شد و job به
  Environment امن `staging` متصل شد. نیمهٔ اول مانور با release عمداً نادرست
  اجرا شد. [run هشدار #1](https://github.com/MoAminPourzare/Chinverse/actions/runs/34248986887)
  طی `10s` با وضعیت failure پایان یافت و
  [issue عملیاتی #1](https://github.com/MoAminPourzare/Chinverse/issues/1) را با
  عنوان ثابت و بدون response body/secret ایجاد کرد. اکنون مقدار انتظار release
  به قرارداد عادی بازگردانده می‌شود تا run بازیابی، probe واقعی را سبز و همان
  issue را خودکار ببندد.

نیمهٔ recovery نیز کامل شد:

- [run بازیابی #2](https://github.com/MoAminPourzare/Chinverse/actions/runs/34249260908)
  در `18s` سبز شد؛ frontend، backend و DB/storage را واقعاً probe کرد.
- bot در issue #1 پیام recovery شامل لینک run گذاشت و همان issue را با reason
  `completed` بست. شمار issueهای باز پس از recovery صفر شد.
- `/health` زنده پس از مانور release بک‌اند
  `34fcecec1a5729cbb12c22caea1b5e53d53fc26a` را گزارش کرد و
  `/health/ready` همچنان database_target/database/storage=`ok` بود.

## checkpoint پنجم — restore واقعی شاخهٔ Neon

- مالک در ۲۰۲۶-۰۹-۰۹ اقدام destructive محدود به شاخهٔ آزمایشی را صریح تأیید کرد.
- `Reset from parent` روی `phase3-recovery-drill-20260908` اجرا شد و Neon تمام
  database/roleهای آن را با آخرین snapshot والد `staging` جایگزین کرد؛ connection
  string شاخه ثابت ماند و `production` یا خود `staging` تغییر نکردند.
- verification پس از reset در `422ms` یک ردیف سالم برگرداند:
  canary_removed=`true`، Alembic=`f8a1b2c3d4e5`، public tables=`61`، users=`3`،
  courses=`68` و lessons=`204`. همهٔ مقادیر دقیقاً با baseline پیش از canary
  برابر بودند.
- زمان عملیاتی reset تا verification کمتر از دو دقیقه و RPO نسبت به آخرین
  snapshot والد صفر بود. این عدد فقط evidence همین drill شاخه‌ای است، نه SLA
  production یا جایگزین backup دوره‌ای custom-format.

## checkpoint ششم — rollback واقعی کد staging

- پیش از مانور، backend staging release
  `34fcecec1a5729cbb12c22caea1b5e53d53fc26a` را با readiness کاملاً سبز گزارش
  می‌کرد.
- Quality Gates یک advisory تازهٔ runtime را در Next.js/Sharp کشف کرد. وابستگی‌ها
  به `next=16.3.4`، `eslint-config-next=16.3.4` و `sharp=0.35.4` ارتقا یافتند؛
  `npm audit --omit=dev --audit-level=low` اکنون `0 vulnerabilities` است. اجرای
  محلی نیز lint/typecheck، `90/90` تست با coverage خطوط `94.28%`، build production
  و performance budget را سبز کرد.
- تلاش نخست rollback عمداً fail-closed شد، چون checkout رویداد با SHA حل‌شدهٔ
  release یکسان نبود. workflow اصلاح شد تا همیشه `RELEASE_SHA` حل‌شده را checkout
  کند؛ این اصلاح برای dispatch عادی و rollback تکرارپذیر مشترک است.
- [run rollback کد #35](https://github.com/MoAminPourzare/Chinverse/actions/runs/34351328738)
  SHA سالم قبلی `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18` را روی HF staging مستقر کرد.
  `/health` دقیقاً همین SHA را با tier=`staging` و indexable=`false` گزارش کرد و
  `/health/ready` برای database_target/database/storage همگی `ok` بود.
- تنظیم موقت rollback حذف شد. [Quality Gates #86](https://github.com/MoAminPourzare/Chinverse/actions/runs/34351737921)
  با هر سه job سبز پایان یافت و [deploy بازیابی #36](https://github.com/MoAminPourzare/Chinverse/actions/runs/34351737924)
  در `7m 1s` موفق شد. backend سپس release
  `d29e09d06dfc35d538ec98f653ce76c0c753a4dd` را گزارش کرد و readiness هر سه
  dependency همچنان `ok` بود. [smoke هم‌SHA #27](https://github.com/MoAminPourzare/Chinverse/actions/runs/34351737942)
  نیز frontend/backend را روی همین SHA و preview محافظت‌شده تأیید کرد. گام ۳.۶
  کامل است و production/main دست‌نخورده‌اند.

## شواهد اجراشده

### verifier و تست‌های محلی

- `backend/scripts/verify_phase7_operations.py --repo-root .` موفق شد:
  `Phase 7 operational artifact verification passed`.
- تست‌های `backend/tests/test_health.py` و `backend/tests/test_phase7_load_test.py`:
  `34 passed`؛ فقط warningهای deprecation/cache محیطی وجود داشت.
- تست privacy فرانت `src/lib/sentryPolicy.test.ts`: `3 passed`.
- policyهای Sentry در backend و frontend شامل حذف body/query/cookie/user PII،
  محدودکردن header به `X-Request-ID`، route redaction، release و environment
  هستند. Sentry عمداً تا ثبت DSN و switch صریح خاموش می‌ماند.

### health و load زندهٔ staging

تمام درخواست‌های این بخش read-only هستند و فقط به allowlist runner فرستاده شدند:

- backend `/health`: HTTP `200`، `deployment_tier=staging`، `indexable=false` و
  release=`8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`.
- backend `/health/ready`: HTTP `200` با
  `database_target=ok`، `database=ok` و `storage=ok`.
- profile `smoke`: `15` درخواست، `0` خطا، p95=`394.895ms`، throughput=`1.048 req/s`.
- profile `load`: `869` درخواست، `0` خطا، error-rate=`0`، p50=`222.932ms`،
  p95=`359.526ms`، p99=`1130.210ms`، max=`2899.674ms`، throughput=`4.825 req/s`؛
  thresholdهای error≤۱٪ و p95≤۲۵۰۰ms سبز هستند.
- profile `soak`: `1774` درخواست در `899.859s`، `0` خطا، error-rate=`0`،
  p50=`224.337ms`، p95=`328.585ms`، p99=`618.376ms`، max=`1830.550ms` و
  throughput=`1.971 req/s`؛ thresholdهای error≤۱٪ و p95≤۲۵۰۰ms سبز هستند.
- evidence دائمی و بدون credential هر سه profile در
  [PHASE_3_LOAD_EVIDENCE.json](E:/Chinverse/docs/PHASE_3_LOAD_EVIDENCE.json)
  ثبت شده است. فایل‌های خام runner نیز در `.tmp` ignored باقی مانده‌اند.
- نمودار یک‌ساعتهٔ Neon برای شاخهٔ staging در همان بازه نشان داد RAM و CPU مصرفی
  پایین‌تر از allocation باقی ماند، deadlock برابر صفر بود، pooler حداکثر `2`
  connection فعال و `0` waiting با max-wait=`0.00s` داشت (سقف تنظیم‌شده `10000`).
  جزئیات machine-readable در همان JSON ثبت شد. provider بعضی metricهای مستقیم
  PostgreSQL را unavailable اعلام کرد و HF Free تاریخچهٔ CPU/RAM اپلیکیشن ارائه
  نمی‌دهد؛ این محدودیت به‌صراحت ثبت شده و به‌عنوان عدد ساختگی پر نشده است.

### اصلاح کنترل monitor

` .github/workflows/phase7-monitor.yml` اکنون frontend health را روی preview
immutable فعلی فاز ۸ می‌سنجد:

`https://chinverse-git-codex-phase-8-beta-release-death-stroke.vercel.app/api/health`

guard workflow و verifier نیز به همین audience به‌روزرسانی شده‌اند؛ bypass secret
هرگز در URL یا input قابل‌تغییر قرار نمی‌گیرد. اجرای schedule فقط پس از قرارگیری
workflow در default branch قابل اتکاست؛ failure و recovery provider از push
trigger محدود شاخهٔ release اثبات شده‌اند.

## موارد باقی‌مانده و مرز دسترسی

1. **مرحلهٔ ۳:** blocker فنی باز ندارد. هیچ DSN یا credential در Git، CI output
   یا این گزارش ذخیره نشده است.
2. **مرز rollout:** کانال خصوصی P0/P1 و verifier انسانی دوم هنوز باید پیش از
   rollout عمومی در مرحلهٔ ۷ تعیین شوند؛ این مورد معیار خروج عملیات staging را
   نقض نمی‌کند و به‌عنوان پیش‌نیاز rollout باقی می‌ماند.

## فرمان ادامه

مرحلهٔ ۳ بسته است. ادامهٔ نقشهٔ آمادگی انتشار باید از **مرحلهٔ ۴ — تست واقعی
موبایل و دسترس‌پذیری** انجام شود؛ تنظیمات دائمی Sentry staging حفظ شوند و switch
یک‌باره فقط با یک سناریوی آزمایشی جدید و مستند دوباره فعال شود.
