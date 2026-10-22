# انتقال نسخهٔ فعلی به دامنهٔ اصلی Vercel — ۶ اکتبر ۲۰۲۶

مالک پروژه درخواست کرد نسخهٔ فعلی در `https://chinverse.vercel.app/` برای مشاهدهٔ دیگران در دسترس باشد. عملیات از داشبورد Vercel و با گزینهٔ Promote to Production انجام شد.

## نسخه‌ها

- نسخهٔ قبلی دامنهٔ اصلی: `bd7b016edede215885f495370b1976a230d3a996` از شاخهٔ `main`؛ deployment برابر `CS6kwn9QC4VMLPLWwrapGWeU8c5q`.
- نسخهٔ انتخاب‌شده: `2ea6fab59a20293e2f21e5df5deb142600e5d9ac` از شاخهٔ `codex/phase-8-beta-release`؛ preview برابر `qxt9RkY7acGUXM9uYg6Q745HPHXA`.
- نسخهٔ جدید Production در Vercel: `BdugPSDKBUBucKTCopi2C8tza9Fo`؛ وضعیت نهایی Ready و دامنهٔ متصل `chinverse.vercel.app`.
- صفحهٔ نسخهٔ جدید: https://vercel.com/death-stroke/chinverse/BdugPSDKBUBucKTCopi2C8tza9Fo

## بررسی نتیجه

درخواست‌های HTTP زیر بدون cookie یا ورود به حساب Vercel اجرا شدند:

| مسیر | نتیجه |
| --- | --- |
| `/` | HTTP 200؛ عنوان صفحه «چین‌ورس»؛ بدون redirect به ورود Vercel |
| `/api/health` | HTTP 200؛ `status=ok`؛ release برابر SHA نسخهٔ انتخاب‌شده |
| `/api/backend/courses/?subcategory_slug=hsk` | HTTP 200؛ پاسخ شامل یک دوره |

در مرورگر نیز صفحهٔ خانه و محتوای فعالیت‌ها نمایش داده شدند. تصویر نتیجه در `artifacts/domain-promotion-2026-10-06.jpg` ذخیره شده است.

## حدود این عملیات

- محیط deployment در Vercel اکنون Production است، اما پیکربندی خود برنامه همچنان `deployment_tier=staging` گزارش می‌کند. تغییر دامنه، تأیید آمادگی تمام قابلیت‌ها یا تکمیل گیت‌های انتشار عمومی نیست.
- شاخهٔ Production که پیش از انتقال در داشبورد مشاهده شد `main` بود؛ تنظیم Branch Tracking در این عملیات ویرایش نشد. انتقال انجام‌شده مربوط به همین نسخه است؛ برای تغییرات بعدی شاخهٔ آزمایشی، وضعیت انتشار دامنهٔ اصلی دوباره بررسی شود.
- این عملیات تغییری در کد برنامه، دادهٔ دیتابیس، تنظیمات سرویس‌های پرداخت/ارسال پیام، یا شاخهٔ Git ایجاد نکرد.
- اجرای کامل تست‌های برنامه تکرار نشد؛ build و استقرار Vercel موفق شد و بررسی‌های عمومی بالا انجام شدند.
- برای بازگرداندن نسخهٔ قبلی، deployment قبلی و SHA آن در بالا ثبت شده‌اند؛ عملیات rollback در این جلسه انجام نشد.
