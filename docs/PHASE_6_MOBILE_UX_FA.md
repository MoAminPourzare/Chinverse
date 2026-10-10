# ChinVerse | گزارش فاز ۶: موبایل و UX

> این گزارش در طول اجرای فاز شش به‌صورت مرحله‌ای به‌روزرسانی می‌شود تا ادامه کار از هر Codex دیگری فقط با خواندن repository ممکن باشد. هیچ ادعای «تست روی دستگاه واقعی» بدون شاهد همان دستگاه ثبت نمی‌شود.

## وضعیت فعلی

- تاریخ شروع: ۱۵ اوت ۲۰۲۶ / ۲۴ مرداد ۱۴۰۵
- شاخه: `codex/phase-6-mobile-ux`
- وضعیت: پیاده‌سازی، gateهای محلی/مرورگر emulation، commit، CI، Vercel Preview و
  smoke زنده انجام شده‌اند؛ journey کامل روی دستگاه واقعی و تست دستی assistive
  technology هنوز evidence gap هستند و در نتیجه فاز از نظر سخت‌افزاری کامل نیست
- release مبنا: فاز پنج با SHA=`3b3a918a66ea7df875965130ff86c7d1a1227576`
- release code فاز شش: SHA=`1219342ce50139c1ac6a109ad7f1cb23ba2b7bab`
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
3. keyboard، fullscreen، orientation و back gesture — پیاده‌سازی خودکار انجام شده؛
   شاهد سخت‌افزار واقعی مانده است.
4. WCAG 2.2 AA، زوم ۲۰۰٪ و tap target ۴۴px — اصلاحات و gateهای خودکار انجام
   شده‌اند؛ این ممیزی خودکار جای audit دستی یا assistive technology واقعی نیست.
5. PWA install، update، offline و service worker — پیاده‌سازی و gate خودکار کامل.
6. تست Chromium/WebKit و regression خودکار — production suite کامل سبز؛ چند
   دستگاه BrowserStack واقعاً launch شدند، اما journey خود اپ روی سخت‌افزار کامل
   نشد و assistive technology دستی انجام نشده است.
7. full gates، commit/push، CI، deploy و smoke خودکار — تکمیل؛ شواهد سخت‌افزاری
   و assistive technology جداگانه pending هستند.

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
- تشخیص keyboard فقط با focus روی کنترل قابل‌ویرایش و scale نزدیک ۱ انجام می‌شود؛
  pinch zoom دیگر navigation و نوارهای app را به‌اشتباه وارد حالت keyboard نمی‌کند.
- path، query و hash مسیرهای SPA ثبت می‌شوند. history با marker همان session و عمق
  داخلی اعتبارسنجی می‌شود؛ stack کهنه یا ورود مستقیم به fallback داخلی می‌رود و
  هیچ fallback خارجی پذیرفته نمی‌شود.
- تغییر pathname یک live announcement و انتقال focus محافظه‌کارانه به heading/main
  دارد و اگر کاربر روی کنترل فعال جدید باشد focus او دزدیده نمی‌شود.
- player از fullscreen استاندارد استفاده می‌کند و برای iOS Safari fallback تمام‌صفحه CSS با safe-area، Escape/back و lock/unlock اختیاری orientation دارد.
- حداقل target کنترل‌های غیر-inline روی ۴۴×۴۴ پیکسل enforce و focus-visible،
  forced-colors، prefers-contrast و prefers-reduced-motion پوشش داده شد. labelهای
  ورودی‌های امنیت حساب، live status/error و semantics چند dialog نیز اصلاح شدند.
- dark mode پیش از hydration از preference کاربر یا system اعمال می‌شود و palette
  صفحات موجود برای حالت روشن/تیره یکپارچه شده است.
- suite دسترس‌پذیری با `@axe-core/playwright` مسیرهای عمومی اصلی را با tagهای
  WCAG 2.2 A/AA در حالت روشن و مسیرهای منتخب را در dark mode بررسی می‌کند؛ تست
  keyboard-only نیز visible focus را کنترل می‌کند.
- PWA شامل manifest installable، صفحه مستقل و بدون اسکریپت `/offline.html`، CSS
  همان‌مبدأ، install prompt در Chromium، راهنمای صریح Safari/iOS و update UX است.
- service worker با release SHA نام‌گذاری می‌شود، cacheهای release قبلی را حذف
  می‌کند و فقط offline shell و assetهای عمومی allowlistشده را cache می‌کند. مسیرهای
  API، upload، media و private media هم در fetch و هم در پاک‌سازی cache fail-closed
  هستند؛ داده حساب و رسانه خصوصی offline ذخیره نمی‌شود.
- `npm run check` — سبز: lint، typecheck، ۴۸ unit test، پوشش frontend برابر
  `93.48%` statement و `94.28%` line و production build برابر ۶۵ route.
- اجرای نهایی محلی Phase 6 روی production build: `65 collected`، `63 passed`،
  `2 skipped` مورد انتظار cross-engine، `0 failed` در ۱٫۹ دقیقه. skipها مربوط به
  قرارداد اختصاصی install event در Chromium و راهنمای اختصاصی Safari/WebKit هستند.
  سناریوی worker/update/cache Chromium نیز پس از اصلاح worker مصنوعی قدیمی به
  release authoritative مسیر `/api/health` جداگانه در ۸٫۱ ثانیه سبز شد.
- `npm audit` برای dependencyهای frontend صفر vulnerability شناخته‌شده گزارش کرد.
- profileهای Pixel 5/Chromium و iPhone 13/WebKit در Playwright **emulation** هستند؛
  هیچ‌کدام به‌عنوان تست سخت‌افزار Android Chrome یا iOS Safari گزارش نمی‌شوند.

## release، CI و smoke زنده

- release code deploy و smoke‌شده
  `1219342ce50139c1ac6a109ad7f1cb23ba2b7bab` است؛ commit شواهد مستندات می‌تواند
  پس از آن روی همان شاخه قرار بگیرد، بدون اینکه کد runtime را تغییر دهد.
- GitHub Quality Gates [run 32419922159](https://github.com/MoAminPourzare/Chinverse/actions/runs/32419922159)
  برای همان SHA سبز است؛ jobهای `Release baseline`، `Frontend` و `Backend` موفق‌اند.
- Vercel deployment فاز شش `FpnJXHMegQdxiceuU1WutAAnNdCJ` با
  [generated URL](https://chinverse-nndh54sbt-death-stroke.vercel.app) و
  [stable branch URL](https://chinverse-git-codex-phase-6-mobile-ux-death-stroke.vercel.app)
  در Preview محافظت‌شده منتشر شده است.
- `/api/health` زنده همان SHA دقیق فاز شش را برگرداند؛ `/explore/hsk` empty-state
  سالم دارد و BFF پس از اصلاح حفظ trailing slash پاسخ `200` می‌دهد.
- health و readiness Hugging Face هر دو سبزند و backend طبق انتظار همچنان release
  فاز پنج را گزارش می‌کند؛ فاز شش frontend-only بوده و backend بی‌دلیل redeploy نشد.
- Vercel Share موقت با تأیید مالک برای smoke فعال و پس از آن revoke شد. درخواست
  ناشناس HTTPS پس از revoke با `302` به Vercel SSO هدایت می‌شود.

## شواهد BrowserStack و مرز ادعا

این دستگاه‌های واقعی در BrowserStack واقعاً launch شدند:

- iPhone 15 با iOS 17.4؛
- iPhone 15 Plus با iOS 17.1؛
- iPhone 13 Pro با iOS 15.6؛
- iPhone 16e با iOS 18.3؛
- Samsung Galaxy S24 با Android 14 و Chrome واقعی؛
- Samsung Galaxy S25 با Android 15 و Chrome واقعی.

روی iPhone 16e بازشدن keyboard و focus واقعی Safari با شاهد تصویری تأیید شد. با
این حال محدودیت یک‌دقیقه‌ای Trial و زمان onboarding/boot باعث شد ChinVerse پیش از
قطع session روی دستگاه واقعی قابل مشاهده و journeyهای app قابل تکمیل نباشند. بنابراین
launchشدن دستگاه یا شاهد keyboard سیستم معادل تست ChinVerse روی آن دستگاه نیست.

## موارد مانده برای ادعای تکمیل سخت‌افزاری فاز

- مشاهده و اجرای journeyهای اصلی خود ChinVerse روی Android Chrome و iOS Safari؛
- edge-back/gesture، rotation، fullscreen و notch/safe-area داخل خود اپ؛
- نصب PWA، update و offline روی دستگاه واقعی؛
- keyboard/focus فرم‌های خود اپ، browser zoom و اندازه target روی سخت‌افزار؛
- تست دستی VoiceOver/TalkBack یا screen reader معادل و keyboard خارجی.

فاز شش از نظر پیاده‌سازی، تست خودکار، browser emulation، CI و Preview کامل است؛
تا ثبت شواهد بالا، عبارت «فاز شش کاملاً روی سخت‌افزار واقعی تأیید شد» نادرست است.
