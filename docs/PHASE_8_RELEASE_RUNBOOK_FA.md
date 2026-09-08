# Runbook بتا، انتشار مرحله‌ای و rollback فاز هشت

نسخه: ۲۴ اوت ۲۰۲۶

این runbook برای operator دارای کمترین دسترسی است. هر اقدام مخرب (حذف branch،
overwrite object، downgrade زنده یا تغییر DNS) بدون approval مالک ممنوع است.

## قبل از شروع

1. Incident/release record خصوصی بساز و UTC، operator، SHA و آخرین release سالم
   را ثبت کن.
2. `verify-phase8-release.ps1` و Quality Gates همان SHA را اجرا کن.
3. blocker JSON را refresh کن؛ `open_p0/open_p1/known_critical/known_high` باید
   همگی صفر باشند و provider gateهای لازم evidence داشته باشند.
4. backup جدید بگیر و checksum، Alembic revision و مقصد ایزوله را ثبت کن.
5. health URLها، alert contact و rollback owner را دو نفره تأیید کن.

### مالکیت و escalation ثبت‌شده برای pre-launch staging

- Incident commander و rollback owner فعلی: صاحب مخزن `MoAminPourzare`.
- Operator فعلی staging: صاحب مخزن `MoAminPourzare` با دسترسی GitHub، Vercel، HF
  و Neon. اجرای هم‌زمان توسط operator دوم مجاز نیست.
- کانال ماشینی فعلی: issue عمومی deduplicated با عنوان
  `[ops] ChinVerse staging health monitor failed`؛ فقط status و لینک run و هرگز
  payload/secret در آن ثبت می‌شود. ساخت و بسته‌شدن خودکار آن در issue #1 اثبات شد.
- کانال خطای اپلیکیشن: Sentry staging پس از ثبت DSN؛ هنوز فعال نشده است.
- escalation خصوصی P0/P1 و verifier انسانی دوم هنوز توسط مالک معرفی نشده‌اند؛ تا
  ثبت یک کانال خصوصی واقعی، rollout عمومی مجاز نیست. شماره یا ایمیل حدس زده نشده
  و نباید در Git عمومی ثبت شود.
- thresholdهای توقف: readiness غیر-`ok`، هر P0/P1، error-rate بیش از `1%`،
  p95 بیش از `2500ms`، waiting DB بیشتر از صفر به‌صورت پایدار، یا خطای auth/payment.
- RTO هدف staging برابر `30m` و RPO هدف پس از backup دوره‌ای برابر `24h` است؛ این
  دو تا پایان drill restore فقط objective هستند و SLA محسوب نمی‌شوند.

## اجرای بتا

- allowlist را با user id/email hash شده و expiry ثبت کن؛ دسترسی revoke باید فوری
  باشد.
- cohort را با rollout پنج‌درصدی فعال کن؛ login، course read، chat، media
  entitlement، feedback و logout را smoke کن.
- هر ۵ دقیقه error budget، health/readiness، DB pool، storage و support feedback
  را بررسی کن؛ payload خصوصی را در گزارش کپی نکن.
- با P0/P1 یا payment/auth regression، rollout را freeze و feature را خاموش کن؛
  داده‌ی بتا را حذف یا به production منتقل نکن.

## promotion مرحله‌ای

workflow `.github/workflows/phase8-release-gate.yml` فقط manual و environment
protected است. ورودی `release_sha` باید full lowercase SHA باشد و با آخرین run
موفق Quality Gates یکی باشد. ترتیب rollout:

`5% → 25% → 50% → 100%`

برای هر پله health/readiness و error budget را به‌مدت توافق‌شده observe کن. پله‌ی
بعدی بدون approval صریح محیط اجرا نمی‌شود. `100%` بدون `confirm_public=true` fail
می‌شود.

## rollback frontend/backend

1. rollout را freeze و feature flags/beta gate را روی آخرین وضعیت سالم نگه دار.
2. در Vercel/HF deployment immutable قبلی را انتخاب کن؛ rebuild از working tree
   یا SHA نامعلوم ممنوع.
3. frontend `/api/health` و backend `/health`, `/health/ready` را با همان SHA و
   `deployment_tier=production` probe کن.
4. login، read-only feed/course، chat و entitlement read را smoke کن؛ writeها تا
   تأیید owner محدود بمانند.
5. اگر schema backward-compatible نیست، کد را rollback نکن؛ ابتدا compatibility
   patch یا feature flag، سپس migration تصمیم‌گیری‌شده اجرا کن.

## rollback database/storage

کد و schema را جدا rollback کن. ابتدا backup incident بگیر؛ restore فقط روی Neon
branch/DB ایزوله با checksum و revision metadata مجاز است. object را overwrite یا
delete نکن؛ version قبلی را restore و pointer DB را در transaction اصلاح کن. پس از
restore invariantهای schema، sentinel و media gateway را verify کن.

## DNS/WAF incident

در certificate یا WAF misconfiguration، canonical DNS را به آخرین origin سالم
برگردان، bypass عمومی نساز و origin مستقیم را block نگه دار. تغییر DNS باید با
TTL و زمان UTC ثبت شود؛ پس از recovery cache را purge و health را از شبکه‌ی بیرونی
و داخلی بررسی کن.

## recovery و بستن incident

Incident فقط زمانی بسته می‌شود که health/readiness، smoke، alert recovery و حداقل
یک window observation سبز باشند، P0/P1 جدید صفر باشد و RTO/RPO واقعی ثبت شده باشد.
secretهای موقت، bypass و cohort دعوت‌شده پس از verify revoke/rotate شوند. follow-up
شامل root cause، owner، deadline و regression test اجباری است.
