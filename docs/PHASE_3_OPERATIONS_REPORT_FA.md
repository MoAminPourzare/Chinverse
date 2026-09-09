# گزارش اجرای مرحلهٔ ۳ آمادگی انتشار — عملیات و بازیابی

**آخرین به‌روزرسانی:** ۲۰۲۶-۰۹-۰۹
**وضعیت:** 🔶 در حال اجرا؛ load/soak، alert/recovery، restore دیتابیس و نیمهٔ
rollback کد زنده سبز هستند؛ بازیابی کد و Sentry باید بسته شوند.
**شاخه:** `codex/phase-8-beta-release`
**release اجرایی مبنا:** `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`

## هدف و ترتیب اجرای مرحله

این سند صفحهٔ ادامهٔ مستقل مرحلهٔ ۳ است. هر نشست بعدی باید از اولین موردی که
هنوز `🔶` یا `⏳` است ادامه دهد و بعد از هر اقدام همین سند را به‌روزرسانی کند.

| گام | موضوع | وضعیت فعلی | معیار خروج |
|---|---|---|---|
| ۳.۱ | Sentry با DSN و release/environment | 🔶 | event آزمایشی scrubشده در staging و مشاهدهٔ آن در project |
| ۳.۲ | لاگ JSON، request/correlation ID و redaction | ✅ محلی | تست redaction و request ID سبز؛ نمونهٔ runtime بدون secret |
| ۳.۳ | health واقعی DB/storage/dependencies | ✅ | live `/health/ready` با target/database/storage=`ok` |
| ۳.۴ | smoke/load/soak و JSON evidence | ✅ | سه profile سبز و metric اشباع Neon ثبت شد |
| ۳.۵ | monitor، alert، triage و recovery | ✅ | failure/recovery و issue dedup با لینک run ثبت شد |
| ۳.۶ | rollback کد و restore دیتابیس staging | ✅ DB / 🔶 بازیابی کد | restore شاخهٔ ایزوله و deploy SHA قبلی سبز؛ بازگشت به SHA فعلی در حال اجراست |
| ۳.۷ | تکمیل runbook و مالکیت escalation | ✅ staging | مسئول، threshold، کانال GitHub و objectiveهای RTO/RPO ثبت شدند |

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
- تنظیم موقت rollback حذف شده و recovery به release فعلی از همان مسیر immutable
  در حال اجراست؛ پس از مشاهدهٔ SHA بازیابی و readiness سبز، گام ۳.۶ بسته می‌شود.

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

1. **Sentry:** SDK و scrubber در کد آماده‌اند، اما DSN، project و ارسال event
   فعال نشده‌اند. ثبت این موارد نیازمند تصمیم و دسترسی صاحب پروژه در Sentry است؛
   secret در چت یا Git ثبت نمی‌شود.
2. **Recovery کد:** rollback واقعی به SHA سالم قبلی سبز است و تنظیم موقت حذف شده؛
   فقط مشاهدهٔ deploy بازیابی روی SHA فعلی و readiness نهایی باقی مانده است.
3. **Escalation خصوصی:** owner، operator، thresholdها و کانال GitHub ثبت شده‌اند؛
   کانال خصوصی P0/P1 و verifier انسانی دوم پیش از rollout عمومی باید تعیین شوند.

## فرمان ادامه

به‌ترتیب recovery کد staging و Sentry ادامه داده شود. تا ثبت DSN و event
مشاهده‌شده، گام ۳.۱ عمداً `🔶` باقی می‌ماند.
