# گزارش اجرای مرحلهٔ ۴ آمادگی لانچ — موبایل و دسترس‌پذیری

> این فایل checkpoint زندهٔ مرحلهٔ ۴ است. پس از هر گام معنادار به‌روزرسانی
> می‌شود تا ادامهٔ کار به نشست یا حساب فعلی وابسته نباشد.

## وضعیت جاری

- **وضعیت:** 🔶 خودکار و staging سبز؛ evidence دستگاه واقعی باقی است
- **شروع:** ۲۰۲۶-۰۹-۱۵، ساعت ۱۸:۲۱ به وقت تهران
- **شاخه:** `codex/phase-8-beta-release`
- **HEAD شاخه (پس از یک commit مستنداتی):** `49d5d9c3386c88ca361d6381070f4191655ab1e7`
- **release اجرایی staging:** `3db95ad80335f293b92a4773c843008a60513fa0`
- **محیط هدف:** staging محافظت‌شده و `noindex`
- **مرحلهٔ پیشین:** مرحلهٔ ۳ بسته و سبز

## معیار بسته‌شدن مرحله

مسیرهای اصلی ورود، آموزش، چت و پرداخت/اشتراک روی حداقل یک Android Chrome
واقعی و یک iOS Safari واقعی کامل شوند؛ PWA، keyboard، safe area، چرخش، back
gesture، zoom ۲۰۰٪، fullscreen، focus، contrast، خطاهای فرم و VoiceOver/TalkBack
ثبت شوند و هیچ مانع P1 باز باقی نماند.

## گام‌ها

| گام | موضوع | وضعیت | نتیجه / اقدام بعدی |
|---|---|---|---|
| ۴.۱ | ممیزی و baseline خودکار release فعلی | ✅ | lint/typecheck/unit/build و suite کامل mobile/WCAG/PWA سبز |
| ۴.۲ | سخت‌سازی پوشش خودکار مسیرهای اصلی | ✅ | gate آموزش/ورود/اشتراک `6/6` و authenticated journeyها `18/18` سبز؛ CI همان SHA سبز |
| ۴.۳ | Android Chrome واقعی + TalkBack | ⏳ | نیازمند دستگاه واقعی صاحب پروژه |
| ۴.۴ | iOS Safari واقعی + VoiceOver | ⏳ | نیازمند دستگاه واقعی صاحب پروژه |
| ۴.۵ | PWA نصب/آپدیت/offline و media fullscreen | 🔶 | قرارداد production worker و fullscreen خودکار سبز؛ تأیید کوتاه روی دستگاه مانده |
| ۴.۶ | جمع‌بندی evidence و P1 sign-off | ⏳ | فقط پس از کامل‌شدن دو ماتریس دستگاه |

## checkpoint ۴.۱ — ممیزی اولیه

- فایل‌های موجود `phase6-mobile-ux.spec.ts`، `phase6-accessibility.spec.ts` و
  `phase6-pwa.spec.ts` به‌ترتیب viewport/orientation/zoom/target/keyboard/back،
  axe WCAG 2.2 A/AA و قرارداد install/update/offline را پوشش می‌دهند.
- Playwright برای Chromium موبایل (Pixel 5) و WebKit موبایل (iPhone 13) تنظیم
  شده است؛ این‌ها شبیه‌سازی‌اند و جای evidence دستگاه واقعی را نمی‌گیرند.
- پیاده‌سازی‌های safe-area، `visualViewport`، back امن، fullscreen با fallback
  iOS، dark mode و PWA از فاز اصلی ۶ وجود دارند؛ اعتبار آن‌ها باید روی release
  فعلی دوباره آزموده شود.
- **اولین کار باز:** build production و اجرای suiteهای موبایل/WCAG/PWA روی HEAD.

## ماتریس evidence دستگاه واقعی

برای جلوگیری از اطلاعات شخصی، screenshot/video فقط باید محیط staging و دادهٔ
مصنوعی را نشان دهد. کد MFA، رمز عبور، ایمیل/شمارهٔ شخصی و cookie نباید ثبت شود.

| دستگاه | OS | مرورگر | زمان | release SHA | ورود | آموزش/fullscreen | چت | اشتراک خاموش | keyboard/safe-area/rotation/back/zoom | PWA install/update/offline | screen reader | نتیجه | evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Android واقعی | ثبت نشده | Chrome ثبت نشده | — | — | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | TalkBack ⏳ | ⏳ | — |
| iPhone واقعی | ثبت نشده | Safari ثبت نشده | — | — | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | VoiceOver ⏳ | ⏳ | — |

## نتایج تست خودکار

### baseline production — ۲۰۲۶-۰۹-۱۵

- `npm run lint`: exit `0`، بدون error؛ دو warning موجود دربارهٔ navigation
  داخلی ثبت شد و blocker این مرحله نیست.
- `npm run typecheck`: exit `0`.
- تست‌های واحد `mobileUx`، `pwaAssets` و `learningPreferences`: تعداد
  `14 passed` در سه فایل.
- `npm run build`: exit `0`، build production و تولید ۶۶ route موفق.
- Playwright روی build production با پروژه‌های desktop Chromium، Pixel 5
  Chromium، iPhone 13 WebKit و دو پروفایل PWA: `63 passed`, `2 skipped`,
  exit `0` در `1.1m`. دو skip وابسته به مرورگر و مورد انتظارند: event نصب
  Chromium روی WebKit و راهنمای نصب Safari روی Chromium.
- اجرای اول تست‌ها تمام assertionها را سبز کرد اما web server داخلی Playwright
  روی Windows پس از اتمام suite خارج نشد؛ برای evidence معتبر، server production
  به‌صورت مستقل روی loopback اجرا و suite با `PLAYWRIGHT_BASE_URL` تکرار شد و
  این بار exit `0` ثبت شد. پردازهٔ موقت پس از تست متوقف شد.

این baseline شبیه‌سازی مرورگر است و به‌تنهایی معیار دستگاه واقعی را برآورده
نمی‌کند.

## checkpoint ۴.۲ — سخت‌سازی خودکار

- gate جدید `frontend/e2e/phase4-launch-mobile.spec.ts` برای Pixel 5 Chromium و
  iPhone 13 WebKit اضافه شد: خطای فرم ورود و ارتباط آن با فیلد، lesson منتشرشده،
  signed playback، subtitle، چرخش، zoom ۲۰۰٪، fullscreen جایگزین iOS، back و
  خاموش‌بودن مسیر اشتراک staging را مستقیم بررسی می‌کند.
- فرم‌های ورود و ثبت‌نام اکنون `id`/`htmlFor`، `aria-invalid`،
  `aria-describedby`، autocomplete مناسب و alert زندهٔ معتبر دارند.
- دو کنتراست ناکافی متن زیرنویس/اطلاعات درس که axe در gate جدید پیدا کرد اصلاح
  شدند.
- اجرای نخست gate یک عیب واقعی Safari/WebKit را آشکار کرد: اگر تاریخ انقضای
  لینک پخش بیشتر از سقف `setTimeout` مرورگر بود، زمان‌سنج سرریز و لینک پخش در
  حلقه refresh می‌شد (در trace آزمون ۱۱۹ درخواست playback ثبت شد). scheduler
  هر دو پلیر `/watch/...` و `/lessons/...` اکنون زمان‌های طولانی را قطعه‌بندی
  می‌کند و پیش از موعد شبکه را refresh نمی‌کند.
- build مجدد پس از اصلاحات: exit `0` و ۶۶ route تولید شد. lint و typecheck نیز
  exit `0` هستند؛ همان دو warning قدیمی navigation باقی‌اند و error وجود ندارد.
- unit regression مرتبط: چهار فایل و `21 passed`.
- gate جدید روی `mobile-chromium` و `mobile-webkit`: `6 passed`، exit `0`؛
  شمار playback در هر journey برابر `1` شد.
- مسیرهای authenticated شامل support، admin MFA، چت با fallback polling و
  حالت retry، امنیت نشست و moderation روی هر دو پروفایل: `18 passed`، exit `0`.
- suite کامل WCAG/mobile/PWA روی build production: `61 passed`, `4 skipped`,
  exit `0`. دو تست production-worker به‌علت اجرای server خارجی در این فرمان
  skip شدند؛ همان دو تست جداگانه با `PLAYWRIGHT_SERVER_MODE=production` روی
  Chromium و WebKit اجرا و سبز شدند (`6 passed`, `2` browser-specific skip).
- **نتیجهٔ خودکار:** شکاف کدی شناخته‌شده یا P1 باز باقی نمانده است. تنها gate
  مانده evidence سخت‌افزار واقعی در گام‌های ۴.۳، ۴.۴ و بخش دستی ۴.۵ است.

### checkpoint CI همان-SHA

- اولین push با SHA `0f0665be749024c795ac7d18cf9e887e6ca2ae5e` تمام
  gateهای backend/build/unit را پاس کرد اما Browser tests را قرمز کرد و deploy
  طبق قرارداد متوقف شد.
- اجرای محلی دقیق شرایط CI (`164` تست، دو worker و production server) علت را
  بازتولید کرد: تست قدیمی password selector در لحظهٔ hydration دو نسخهٔ موقت
  route را می‌دید. selector به عنصر visible محدود شد.
- همان اجرای پرفشار یک مورد flaky کنتراست در فریم آغازین animation نوار پایین
  WebKit نشان داد؛ fade opacity حذف شد تا رنگ متن در تمام فریم‌ها نسبت ثابت
  WCAG داشته باشد، در حالی که حرکت transform حفظ شده است.
- targeted regression در شرایط CI با دو worker و سه تکرار روی Chromium/WebKit
  اجرا شد: `126 passed` در `3.9m`، بدون retry یا flaky. build production نیز
  پس از تغییر exit `0` داشت.
- **اقدام بعدی:** commit/push و انتظار برای سه workflow سبز روی SHA جایگزین.

### checkpoint CI تکرار کامل — ۲۰۲۶-۰۹-۱۷

- پس از اصلاح selector و animation، suite کامل دقیقاً با قرارداد CI دوباره روی
  production server loopback اجرا شد: `CI=true`، دو worker، تمام ۱۶۴ مورد
  Playwright و همهٔ پروفایل‌های desktop/mobile Chromium، mobile WebKit و PWA.
- نتیجه: `156 passed`، `8 skipped`، exit `0` در `3.4m`. skipها سناریوهای
  عمداً وابسته به staging live یا محدودیت ذاتی یک مرورگر هستند؛ شکست، retry و
  flaky ثبت نشد.
- این checkpoint مستنداتی برای trigger کردن CI و deploy staging تازه commit
  می‌شود. تا سبزشدن workflowها، هیچ ادعای deploy جدید یا sign-off نهایی ثبت
  نمی‌شود.

### checkpoint CI و staging نهایی — ۲۰۲۶-۰۹-۱۹

- خطای CI روی SHA قبلی در WebKit از تست بود، نه محصول: mock تست با
  `route.fulfill` پاسخ redirect با status `307` می‌ساخت و Playwright آن را رد
  می‌کرد. mock به پاسخ موفق و خالی `video/mp4` تغییر کرد؛ codec ویدیو در این
  تست عمداً mock است.
- typecheck پس از اصلاح سبز شد و commit نهایی روی همین شاخه به
  `3db95ad80335f293b92a4773c843008a60513fa0` رسید.
- هر سه workflow همان SHA سبز شدند:
  [Quality gates run 96](https://github.com/MoAminPourzare/Chinverse/actions/runs/35433046013)،
  [Deploy staging backend run 42](https://github.com/MoAminPourzare/Chinverse/actions/runs/35433045885)،
  [Phase 2 exact-SHA smoke run 33](https://github.com/MoAminPourzare/Chinverse/actions/runs/35433045959).
- smoke همان-SHA تأیید کرد: backend و frontend با SHA دقیق، tier=`staging` و
  `noindex`، readiness دیتابیس و storage سالم، preview ناشناس محافظت‌شده با
  `302` و مسیرهای اشتراک/پرداخت غیرفعال. catalog staging در این run خالی بود؛
  بنابراین این run شواهد lesson واقعی تولید نمی‌کند.
- نتیجهٔ اتوماتیک مرحله اکنون کامل و قابل تکرار است؛ وضعیت کلی عمداً تا ثبت
  Android Chrome و iOS Safari واقعی `🔶` باقی می‌ماند.

## blocker جاری

blocker کدی شناخته‌شده‌ای باقی نمانده است. سه workflow این checkpoint سبز
شده‌اند؛ blocker باقی‌مانده فقط evidence یک Android Chrome و یک iOS Safari
واقعی و بخش دستی PWA/screen-reader است. پس از اجرای چک‌لیست کوتاه دستگاه،
نتیجه و evidence بدون PII در همین فایل ثبت خواهد شد و می‌توان وضعیت را به ✅
تغییر داد.
