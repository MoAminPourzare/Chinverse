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
| ۳.۴ | smoke/load/soak و JSON evidence | 🔶 | smoke و load سبز؛ soak در حال اجرا/ثبت نتیجه |
| ۳.۵ | monitor، alert، triage و recovery | 🔶 | manual run و issue dedup/recovery با لینک run |
| ۳.۶ | rollback کد و restore دیتابیس staging | 🔶 | backup checksum/revision، restore branch ایزوله و smoke بعدی |
| ۳.۷ | تکمیل runbook و مالکیت escalation | 🔶 | مسئول، threshold، کانال و زمان RTO/RPO ثبت‌شده |

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
- JSON خام runner در `.tmp/phase3-backend-smoke.json` و
  `.tmp/phase3-backend-load.json` ذخیره شد؛ این پوشه عمداً ignored است و token یا
  credential در آن نوشته نمی‌شود.

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
   این کار به دسترسی GitHub Actions و secret bypass staging نیاز دارد.
3. **Soak:** profile پانزده‌دقیقه‌ای با سقف داخلی runner در حال اجراست؛ پس از پایان
   باید JSON و verdict آن به این سند افزوده شود.
4. **Rollback/restore:** runbook و wrapperهای revision-aware موجودند، و backup/restore
   محلی قبلاً سبز بوده است؛ restore branch واقعی Neon و rollback provider هنوز
   بدون دسترسی dashboard اجرا نشده‌اند. production و `main` نباید در این drill
   لمس شوند.
5. **Escalation:** نام incident commander، operator، کانال و RTO/RPO واقعی باید
   توسط صاحب پروژه تعیین و در `PHASE_7_ROLLBACK_RUNBOOK_FA.md` ثبت شود.

## فرمان ادامه

پس از پایان soak، ابتدا نتیجهٔ آن ثبت شود؛ سپس به‌ترتیب ۳.۵ (manual monitor و
alert/recovery)، ۳.۶ (backup/restore و rollback ایزوله) و ۳.۷ (تکمیل runbook) ادامه
داده شود. تا ثبت DSN و event مشاهده‌شده، گام ۳.۱ عمداً `🔶` باقی می‌ماند.
