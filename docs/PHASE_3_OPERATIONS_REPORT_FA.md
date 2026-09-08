# گزارش اجرای مرحلهٔ ۳ آمادگی انتشار — عملیات و بازیابی

**آخرین به‌روزرسانی:** ۲۰۲۶-۰۹-۰۸
**وضعیت:** 🔶 در حال اجرا؛ پیاده‌سازی محلی و شواهد load سبز است، اما Sentry/alert و
rollback/restore مدیریت‌شده هنوز نیازمند دسترسی provider هستند.
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
| ۳.۴ | smoke/load/soak و JSON evidence | ✅ runner / 🔶 saturation | هر سه profile و JSON سبز؛ metric منابع provider هنوز باید ثبت شود |
| ۳.۵ | monitor، alert، triage و recovery | 🔶 | manual run و issue dedup/recovery با لینک run |
| ۳.۶ | rollback کد و restore دیتابیس staging | 🔶 | backup checksum/revision، restore branch ایزوله و smoke بعدی |
| ۳.۷ | تکمیل runbook و مالکیت escalation | 🔶 | مسئول، threshold، کانال و زمان RTO/RPO ثبت‌شده |

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
  اجرا می‌شود؛ پس از مشاهدهٔ issue هشدار، همان مقدار فوراً به قرارداد عادی
  برگردانده و recovery ثبت خواهد شد.

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

### اصلاح کنترل monitor

` .github/workflows/phase7-monitor.yml` اکنون frontend health را روی preview
immutable فعلی فاز ۸ می‌سنجد:

`https://chinverse-git-codex-phase-8-beta-release-death-stroke.vercel.app/api/health`

guard workflow و verifier نیز به همین audience به‌روزرسانی شده‌اند؛ bypass secret
هرگز در URL یا input قابل‌تغییر قرار نمی‌گیرد. اجرای schedule فقط پس از قرارگیری
workflow در default branch قابل اتکاست؛ manual dispatch provider evidence هنوز
باز است.

## موارد باقی‌مانده و مرز دسترسی

1. **Sentry:** SDK و scrubber در کد آماده‌اند، اما DSN، project و ارسال event
   فعال نشده‌اند. ثبت این موارد نیازمند تصمیم و دسترسی صاحب پروژه در Sentry است؛
   secret در چت یا Git ثبت نمی‌شود.
2. **Alert/recovery:** workflow مانیتور issue deduplicated می‌سازد و recovery آن را
   می‌بندد، اما یک manual run شکست‌خورده و سپس recovery با لینک run هنوز ثبت نشده؛
   این کار به دسترسی GitHub Actions و secret bypass staging نیاز دارد. مشاهدهٔ
   read-only مخزن نشان داد workflow روی شاخهٔ release موجود است، اما چون هنوز در
   default branch نیست، GitHub اجرای آن را `Not found` اعلام می‌کند؛ طبق قرارداد
   GitHub، schedule/dispatch پس از merge به default branch قابل اتکا خواهد بود.
3. **Resource saturation:** سه profile از نظر latency/error/throughput سبز هستند،
   اما CPU/RAM/DB connection saturation در dashboard provider هنوز ثبت نشده است.
4. **Rollback/restore:** runbook و wrapperهای revision-aware موجودند، و backup/restore
   محلی قبلاً سبز بوده است؛ restore branch واقعی Neon و rollback provider هنوز
   بدون دسترسی dashboard اجرا نشده‌اند. production و `main` نباید در این drill
   لمس شوند.
5. **Escalation:** نام incident commander، operator، کانال و RTO/RPO واقعی باید
   توسط صاحب پروژه تعیین و در `PHASE_7_ROLLBACK_RUNBOOK_FA.md` ثبت شود.

## فرمان ادامه

به‌ترتیب ۳.۵ (manual monitor و alert/recovery)، ۳.۶ (backup/restore و rollback
ایزوله)، ۳.۷ (تکمیل runbook) و ثبت metric اشباع provider ادامه داده شود. تا ثبت
DSN و event مشاهده‌شده، گام ۳.۱ عمداً `🔶` باقی می‌ماند.
