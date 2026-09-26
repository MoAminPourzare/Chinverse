# گزارش اجرای مرحلهٔ ۶ آمادگی لانچ — پرداخت و entitlement

**وضعیت:** ✅ `SKIPPED-FREE-BETA` — لانچ فعلی رایگان است؛ core ثبت شده و feature
پرداخت fail-closed و خاموش مانده است.

**تاریخ شروع:** ۲۰۲۶-۰۹-۱۹

**شاخه:** `codex/phase-8-beta-release`

**SHA مبنا:** `5682c10390a74771bf8d4c8e3825d1671c52b8fb`

**SHA checkpoint هسته:** `d9fa0ad73367e215b779a42966794719996df8c1`

## ۱. تصمیم انتشار

این مرحله فقط برای لانچ پولی لازم است. صاحب پروژه تصمیم گرفت لانچ فعلی رایگان باشد؛
بنابراین مرحله برای این rollout با `SKIPPED-FREE-BETA` بسته می‌شود. هیچ provider یا
حساب تسویه‌ای فعال نشده است.
تا زمان تکمیل sandbox و یک تراکنش کم‌مبلغ کنترل‌شده، مقادیر زیر باید خاموش بمانند:

```text
FEATURE_SUBSCRIPTIONS_ENABLED=false
NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=false
PAYMENT_PROVIDER=disabled
```

Production و `main` خارج از دامنهٔ این مرحله‌اند.

## ۲. نتیجهٔ audit شروع

- جدول‌های `subscription_plans`، `user_subscriptions`، `subscription_orders` و
  `payment_webhook_events` وجود دارند.
- مسیر checkout فعلی فقط order محلی می‌سازد و عمداً URL پرداخت تولید نمی‌کند.
- `generic_hmac` فقط مرز امضا و idempotency callback است و provider تجاری نیست.
- با `PAYMENT_PROVIDER=disabled`، webhook عمومی رد می‌شود و entitlement پولی صادر
  نمی‌کند؛ هستهٔ صدور امن فقط برای بازشدن آتی provider تأییدشده آماده است.
- entitlement رسانه فقط subscription با status=`active` و بازهٔ معتبر را قبول
  می‌کند و revoke/expiry را در هر درخواست دوباره می‌سنجد.
- تنظیمات اجازه نمی‌دهند feature اشتراک همراه provider=`disabled` روشن شود.

## ۳. provider و روش تسویه

کشور عملیاتی: ایران. انتخاب provider به تأیید صریح owner و credential حساب
پذیرنده نیاز دارد. مستندات رسمی NextPay مسیر token، redirect، verify و refund را
منتشر کرده است، اما انتخاب آن هنوز قطعی نیست:

- <https://nextpay.org/nx/docs>

هیچ API key، webhook secret، شماره کارت/شبا یا دادهٔ تسویه نباید در Git، گزارش،
لاگ یا screenshot ثبت شود.

## ۴. برنامهٔ فنی این مرحله

- ledger تغییرناپذیر برای success/refund/chargeback و اتصال order به entitlement؛
- امضای timestampدار، محدودیت عمر callback، replay protection و idempotency DB؛
- اعتبارسنجی order، amount، currency و provider reference پیش از صدور entitlement؛
- تمدید، expiry، revoke، refund و chargeback تراکنشی؛
- reconciliation روزانه و گزارش anomaly بدون PII؛
- تست واحد و integration روی Postgres واقعی؛
- سپس adapter provider منتخب، sandbox و تراکنش live کم‌مبلغ.

## ۵. checklist زنده

- [x] audit کد، schema، feature flag و مرز provider فعلی انجام شد.
- [x] migration `c9e4b6a8d2f1` برای lifecycle سفارش، revoke/expiry و
  `payment_ledger_entries` اضافه شد.
- [x] webhook timestampدار با tolerance، replay protection، تطبیق amount/currency/
  order/reference و idempotency DB پیاده شد.
- [x] success/renewal entitlement و refund/chargeback revoke تراکنشی و audit شد.
- [x] reconciliation بدون PII برای paid-without-entitlement، revoked-still-active
  و stale events اضافه شد.
- [x] تست‌های غیر integration موجود سبز بودند: `185 passed`، coverage=`60.04%`، و
  ruff کل backend سبز بود؛ یک تست واحد timestampدار دیگر نیز به suite اضافه شد و
  نتیجهٔ نهایی آن در CI ثبت می‌شود.
- [x] feature اشتراک و checkout عمومی خاموش ماند.
- [x] provider، حساب پذیرنده و روش تسویه برای `SKIPPED-FREE-BETA` موضوع این rollout
  نیست و عمداً فعال نشد.
- [x] lifecycle داخلی payment/entitlement و migration تکمیل شد؛ اجرای migration روی
  staging/DB جداگانه هنوز باید با credential همان محیط انجام شود.
- [x] امضای timestampدار، replay و idempotency در کد و تست integration نوشته شد؛
  اجرای PostgreSQL واقعی در CI/staging باقی است.
- [x] success، renewal، revoke، refund و chargeback در مسیر تراکنشی و تست
  integration پوشش داده شد؛ expiry در entitlement query موجود است.
- [x] reconciliation و audit ledger بدون PII پیاده و تست شد؛ اجرای DB واقعی باقی
  است.
- [x] adapter provider، sandbox و تراکنش live برای لانچ رایگان لازم نیستند و به
  backlog لانچ پولی منتقل شدند.
- [x] rollout پرداخت و observation window برای لانچ رایگان لازم نیست و به backlog
  لانچ پولی منتقل شد.

## ۶. معیار بسته‌شدن این rollout رایگان

هیچ checkout یا entitlement پولی نباید فعال باشد، defaultهای پرداخت باید fail-closed
باقی بمانند و تصمیم `SKIPPED-FREE-BETA` در گزارش ثبت شود. خرید، تمدید، لغو، refund
و callback تکراری در sandbox/live فقط با بازشدن دوبارهٔ مرحله برای لانچ پولی لازم
خواهند بود.

**یادداشت آینده:** نام provider و credential حساب پذیرنده هنوز ارائه نشده‌اند؛ این
برای لانچ رایگان blocker نیست، اما provider gate پرداخت را برای لانچ پولی آینده
pending نگه می‌دارد. هیچ feature پرداختی با این تصمیم روشن نمی‌شود.
