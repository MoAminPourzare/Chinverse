# ChinVerse | گزارش فاز ۶: موبایل و UX

> این گزارش در طول اجرای فاز شش به‌صورت مرحله‌ای به‌روزرسانی می‌شود تا ادامه کار از هر Codex دیگری فقط با خواندن repository ممکن باشد. هیچ ادعای «تست روی دستگاه واقعی» بدون شاهد همان دستگاه ثبت نمی‌شود.

## وضعیت فعلی

- تاریخ شروع: ۱۵ اوت ۲۰۲۶ / ۲۴ مرداد ۱۴۰۵
- شاخه: `codex/phase-6-mobile-ux`
- وضعیت: مراحل ۱ تا ۵ پیاده‌سازی شده‌اند؛ مرحله ۶، gateهای مرورگر در حال انجام است
- release مبنا: فاز پنج با SHA=`3b3a918a66ea7df875965130ff86c7d1a1227576`
- دامنه: Android Chrome، iOS Safari، keyboard، safe area، fullscreen، orientation، back gesture، زوم ۲۰۰٪، dark mode، WCAG 2.2 AA، tap target حداقل ۴۴px و PWA install/update/offline

## معیار اتمام

فاز فقط زمانی بسته می‌شود که:

- رفتارهای موبایل و PWA در کد و تست خودکار پوشش داشته باشند؛
- viewportهای Chromium و WebKit موبایل، portrait/landscape، keyboard viewport و زوم ۲۰۰٪ بدون overflow بحرانی باشند؛
- مسیرهای اصلی با keyboard، focus و نام accessible قابل استفاده باشند؛
- manifest، service worker، install/update/offline و cache policy قابل‌تکرار باشند؛
- CI، Preview محافظت‌شده و smoke زنده شواهد قابل پیگیری داشته باشند؛
- تست سخت‌افزار واقعی فقط در صورت اجرای واقعی Android Chrome و iOS Safari «تکمیل» علامت بخورد؛ emulation جای دستگاه واقعی گزارش نمی‌شود.

## ردیابی هفت‌مرحله‌ای

1. ممیزی baseline موبایل/PWA/WCAG و ساخت گزارش — تکمیل.
2. viewport، safe-area، theme و layout responsive — تکمیل.
3. keyboard، fullscreen، orientation و back gesture — تکمیل کد و تست واحد.
4. WCAG 2.2 AA، زوم ۲۰۰٪ و tap target ۴۴px — تکمیل کد؛ gate خودکار Pixel سبز.
5. PWA install، update، offline و service worker — تکمیل کد؛ contract خودکار سبز.
6. تست Android Chrome/iOS Safari و regression خودکار — در حال انجام؛ Pixel/Chromium سبز و WebKit مانده.
7. full gates، commit/push، CI، deploy و smoke — pending.

## مرحله ۱ — baseline

یافته‌های اولیه:

- `viewport-fit=cover` و `width=device-width` در root layout موجود است و shell از `100dvh` استفاده می‌کند.
- safe-area بالا در scroll container و پایین در bottom navigation وجود دارد، اما insetهای چپ/راست، keyboard viewport و حالت standalone یکپارچه نیستند.
- dark mode دارای انتخاب light/dark/system و bootstrap پیش از hydration است؛ contrast و پوشش صفحات باید با gate بررسی شود.
- fullscreen استاندارد برای player وجود دارد، ولی fallbackهای iOS WebKit، orientation lifecycle و خروج امن از fullscreen پوشش کامل ندارند.
- چند صفحه مستقیماً `router.back()` را صدا می‌زنند؛ ورود مستقیم ممکن است کاربر را خارج از app کند و fallback داخلی لازم است.
- حدود ۲۶۸ عنصر button/link در source و حدود ۹۰ الگوی کنترل ۳۲/۳۶/۴۰ پیکسلی دیده شد؛ audit دقیق target size لازم است.
- Playwright از قبل پروژه‌های Desktop Chrome، Pixel 5 و iPhone 13/WebKit دارد و overflow چند مسیر را می‌سنجد، اما keyboard، zoom 200%، orientation، PWA و target size را پوشش نمی‌دهد.
- `manifest.json` فقط name/icon/display دارد؛ service worker، offline page، install prompt، update UX و cache policy وجود ندارد.
- محیط فعلی دسترسی مستقیم به دستگاه فیزیکی Android/iOS یا device lab احرازشده ندارد؛ این مورد تا فراهم‌شدن شاهد واقعی جدا از emulation گزارش می‌شود.

## شواهد و خروجی‌های مرحله‌ای

- گزارش baseline در همین فایل ثبت شد.
- زیرساخت viewport بصری با `visualViewport`، safe-area چهارطرفه، keyboard inset، standalone و orientation به root وصل شد.
- کنترل‌های درون app از back خام به fallback داخلی امن منتقل شدند؛ ورود مستقیم دیگر کاربر را از ChinVerse خارج نمی‌کند.
- player از fullscreen استاندارد استفاده می‌کند و برای iOS Safari fallback تمام‌صفحه CSS با safe-area، Escape/back و lock/unlock اختیاری orientation دارد.
- حداقل target کنترل‌های غیر-inline روی ۴۴×۴۴ پیکسل enforce و focus-visible/forced-colors/prefers-contrast پوشش داده شد.
- PWA شامل manifest کامل، صفحه `/offline`، service worker با cache فقط برای shell/static عمومی، install UX، راهنمای iOS و update lifecycle است؛ API، حساب و رسانه خصوصی cache نمی‌شوند.
- `npm run lint` — سبز.
- `npm run typecheck` — سبز.
- `npm test -- --run src/lib/mobileUx.test.ts src/lib/pwaAssets.test.ts` — ۲ فایل و ۵ تست، سبز.
- `phase6-mobile-ux.spec.ts` روی پروژه `mobile-chromium` — هر ۱۰ سناریو پس از اصلاح یافته‌ها سبز: PWA contract، portrait/landscape چهار مسیر، zoom 200%، target 44px، keyboard viewport، dark mode و back fallback. runner محلی Windows بعد از اتمام تست‌ها در teardown سرور dev معطل شد؛ اجرای نهایی با سرور مستقل تکرار می‌شود.
- آزمون Pixel 5 فوق emulation است و به‌عنوان تست سخت‌افزار Android گزارش نمی‌شود.
