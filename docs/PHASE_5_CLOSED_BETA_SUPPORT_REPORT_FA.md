# گزارش اجرای مرحلهٔ ۵ آمادگی لانچ — بتای بسته و پشتیبانی

**وضعیت:** ✅ معیار پذیرش مرحله روی staging برآورده شد؛ cohort واقعی owner،
consent و چرخهٔ کامل feedback/triage/resolution ثبت شد و شمارندهٔ P0/P1 باز صفر است.

**تاریخ شروع:** ۲۰۲۶-۰۹-۱۹  
**شاخه:** `codex/phase-8-beta-release`  
**SHA مبنا:** `93fca4d85d1e848bdb223991d2e7ec834cef67c1`  
**SHA اجرایی این مرحله:** `2ed32db756eb860357937a13d02d17857e277312`

مهاجرت و اولین deploy staging با `82e7dd42dd80f8c36b445cf4e214f069c13cb30b`
انجام شد و commit نهایی `2ed32db` پنل عملیات بتا را به همان مسیر اضافه کرد.

**زمان اجرای زنده:** `2026-09-19T15:42:51Z`

**owner عملیاتی:** صاحب پروژه

**تصمیم owner:** `continue`

## ۱. دامنه و cohort اولیه

بتا فقط روی staging و به‌صورت invite-only اجرا می‌شود. cohort اول کوچک نگه داشته
می‌شود تا پشتیبانی و توقف سریع ممکن باشد:

- سقف cohort فعال: **۵ تستر**؛ سقف دعوت صادرشده: **۱۰ دعوت**.
- ترکیب هدف: حداقل ۲ Android Chrome، ۲ iOS Safari و ۱ مرورگر دسکتاپ.
- معیار انتخاب: حساب تأییدشده، رضایت صریح با نسخهٔ `beta-v1`، توانایی ارسال
  گزارش بازتولیدپذیر و پذیرش محرمانه‌ماندن لینک و کد دعوت.
- زمان اجرا: **۷ روز از صدور اولین دعوت واقعی**؛ تاریخ دقیق شروع و پایان کنار
  اولین رکورد cohort ثبت می‌شود.
- دسترسی عمومی، rollout تصادفی و پرداخت در این دوره خاموش می‌ماند.

هویت، ایمیل، شماره تماس، token و کد خام دعوت نباید وارد این سند، issue عمومی،
Sentry message یا screenshot شوند. کد دعوت فقط یک بار هنگام صدور نمایش داده
می‌شود و backend فقط digest آن را نگه می‌دارد.

## ۲. owner، SLA و escalation

تا زمانی که owner دیگری صریحاً تعیین نشده، **صاحب پروژه** owner عملیاتی cohort،
بازخورد و تصمیم توقف/ادامه است.

| شدت | تعریف عملیاتی | پاسخ اولیه | اقدام |
|---|---|---:|---|
| P0 | نشت داده/secret، از دست‌رفتن داده، تصاحب حساب یا outage کامل | حداکثر ۱ ساعت | توقف کامل بتا، revoke دعوت‌ها و اجرای incident runbook |
| P1 | ورود، آموزش، چت یا حذف حساب برای بخش معنادار cohort مسدود است | حداکثر ۴ ساعت | توقف مسیر یا cohort، rollback/fix و retest |
| P2 | نقص مهم با workaround | حداکثر ۲۴ ساعت | triage و قرارگرفتن در نزدیک‌ترین patch |
| P3 | پیشنهاد یا نقص کم‌اثر | حداکثر ۷۲ ساعت | backlog یا dismissal مستند |

feedback جدید ابتدا `open/unclassified` است. owner آن را با severity یکی از
`P0/P1/P2/P3` طبقه‌بندی و به `triaged` منتقل می‌کند. پایان مرحله فقط وقتی مجاز
است که `open_p0_p1_count=0` باشد و هیچ incident متناظر در Sentry/issue tracker
باز نباشد.

## ۳. consent، privacy و حذف حساب

- صفحهٔ `/beta-feedback` پیش از ارسال بازخورد، پذیرش نسخهٔ دقیق consent را
  الزامی می‌کند.
- لینک‌های `/legal/terms` و `/legal/privacy` کنار consent نمایش داده می‌شوند.
- metadata بازخورد allowlist و محدود است؛ email/token/cookie و objectهای تو در
  تو حذف می‌شوند.
- مسیر حذف حساب در `/account/security#delete-account` موجود و از تنظیمات قابل
  دسترس است.
- moderation و escalation از مسیر triage ادمین و runbook مرحلهٔ ۳ انجام می‌شود.

## ۴. hardening انجام‌شده در این checkpoint

- `GET /api/v1/admin/beta/invites`: فهرست امن lifecycle دعوت‌ها؛ بدون کد خام،
  email یا digest آن.
- `GET /api/v1/admin/beta/summary`: snapshot بدون PII شامل تعداد دعوت‌ها،
  feedback، consent، release SHA و تعداد P0/P1 حل‌نشده.
- severity عملیاتی به feedback اضافه شد؛ migration جدید
  `a7d2c5e8f1b4` مقدارهای `unclassified/P0/P1/P2/P3` را enforce می‌کند.
- `PATCH /api/v1/admin/beta/feedback/{id}` علاوه بر status و note می‌تواند
  severity را ثبت کند و audit event بسازد.
- privacy notice به UI رضایت‌نامهٔ بتا اضافه شد.
- صفحهٔ `/admin/beta` برای admin/MFA اضافه شد: summary، صدور یک‌بارهٔ کد دعوت،
  revoke، فهرست بدون PII و triage همراه severity/note را بدون نیاز به SQL یا
  فراخوانی دستی API انجام می‌دهد.

## ۵. تنظیم امن staging پیش از اولین دعوت

مقادیر staging باید چنین باشند؛ مقدار secret نباید در Git یا این گزارش قرار
گیرد:

```text
FEATURE_BETA_ENABLED=true
BETA_INVITE_REQUIRED=true
BETA_ROLLOUT_PERCENT=0
BETA_ALLOWED_EMAILS=
BETA_INVITE_HASH_SECRET=<random secret, at least 32 characters>
BETA_CONSENT_VERSION=beta-v1
NEXT_PUBLIC_BETA_MODE=true
```

staging و preview باید private/noindex بمانند. هیچ‌یک از این تنظیمات مجوز تغییر
production یا `main` نیست.

## ۶. چرخهٔ روزانهٔ beta/support

در شروع و پایان هر روز beta:

1. health/readiness و SHA frontend/backend را بررسی کن.
2. snapshot ادمین را بگیر و فقط آمار aggregate را اینجا ثبت کن.
3. feedbackهای `open` را triage، severity و owner بده.
4. Sentry و issue tracker را برای incidentهای هم‌بازه بررسی کن.
5. اگر P0/P1 باز است، rollout را متوقف و escalation بالا را اجرا کن.

قالب evidence روزانه:

```text
UTC time:
release SHA:
invited / redeemed / consented:
feedback open / triaged / resolved:
unresolved P0 / P1:
incident links (بدون PII):
owner decision: continue | pause | rollback | close
```

## ۷. نتیجهٔ تست محلی

- backend focused beta tests: `11 passed`؛ کل suite غیر-integration برابر
  `185 passed, 30 deselected`.
- `ruff` برای endpoint، model، migration و تست‌های تغییرکرده: موفق.
- Alembic: تنها head برابر `a7d2c5e8f1b4`.
- frontend beta service test: `1 passed`؛ typecheck و production build با route
  `/beta-feedback` و `/admin/beta` (در مجموع `67` route) موفق.
- [Quality Gates run 35439383731](https://github.com/MoAminPourzare/Chinverse/actions/runs/35439383731):
  موفق؛ backend unit/integration، migration parity، rollback/rebuild، container،
  frontend lint/typecheck/test/build/browser همگی سبز.
- [Deploy staging run 35439383768](https://github.com/MoAminPourzare/Chinverse/actions/runs/35439383768):
  موفق برای SHA دقیق بالا.
- [Exact-SHA smoke run 35439383901](https://github.com/MoAminPourzare/Chinverse/actions/runs/35439383901):
  موفق؛ backend/frontend هم‌SHA، protection، noindex، readiness و بسته‌بودن
  قابلیت‌های حساس تأیید شد.

## ۸. موارد لازم برای تبدیل وضعیت به ✅

- [x] migration و release این مرحله روی staging deploy و exact-SHA smoke سبز شد.
- [x] `FEATURE_BETA_ENABLED=true` و `BETA_INVITE_HASH_SECRET` فقط در HF staging
  تنظیم شدند؛ مقدار secret در Git، گزارش یا خروجی ابزار ثبت نشد.
- [x] یک دعوت واقعی با admin/MFA صادر و با حساب owner روی DB واقعی staging
  redeem شد؛ backend فقط digest را نگه داشت.
- [x] owner نسخهٔ `beta-v1` را پذیرفت و یک feedback واقعی با امتیاز `5` ثبت کرد.
- [x] feedback با severity=`P3` و note عملیاتی triage و سپس `resolved` شد.
- [x] snapshot بدون PII و تصمیم `continue` ثبت شد.
- [x] snapshot نهایی پنل بتا `open=0` و `open P0/P1=0` نشان داد؛ در چرخهٔ زنده
  نیز incident متناظر مشاهده نشد.
- [x] `NEXT_PUBLIC_BETA_MODE=true` فقط برای Preview branch
  `codex/phase-8-beta-release` در Vercel ثبت شد؛ Production و `main` تغییر نکردند.

### snapshot نهایی بدون PII

```text
UTC time: 2026-09-19T15:42:51Z
backend functional release SHA: 2ed32db756eb860357937a13d02d17857e277312
invited / redeemed / consented: 1 / 1 / 1
feedback open / triaged / resolved: 0 / 0 / 1
unresolved P0 / P1: 0 / 0
incident links: none observed during the live cycle
owner decision: continue
```

Vercel Preview با deployment شناسهٔ `47zmVygMKH4HKp71M4tDGwcjBhi9` و source
`6e7ad04f87b4fe3d18cd97f4dbc35687b9c6c2c9` برای دریافت flag branch-only
redeploy شد. این source فقط checkpoint مستندات پس از release اجرایی بالا است.

**یادداشت غیرمسدودکننده:** مسیرهای expiry/revoke/idempotency در suite integration
پوشش دارند. در اجرای زنده، دعوت مصرف‌شده به‌درستی `redeemed` باقی ماند و revoke
مصنوعی برای تغییر تاریخچهٔ همان دعوت انجام نشد؛ مشاهدهٔ expiry طبیعی یک دعوت
کوتاه‌عمر می‌تواند در چرخهٔ روزانهٔ بعدی ثبت شود، اما جزو معیار پذیرش رسمی این
مرحله نیست.
