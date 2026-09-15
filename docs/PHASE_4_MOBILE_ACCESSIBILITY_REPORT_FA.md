# گزارش اجرای مرحلهٔ ۴ آمادگی لانچ — موبایل و دسترس‌پذیری

> این فایل checkpoint زندهٔ مرحلهٔ ۴ است. پس از هر گام معنادار به‌روزرسانی
> می‌شود تا ادامهٔ کار به نشست یا حساب فعلی وابسته نباشد.

## وضعیت جاری

- **وضعیت:** 🔶 در حال اجرا
- **شروع:** ۲۰۲۶-۰۹-۱۵، ساعت ۱۸:۲۱ به وقت تهران
- **شاخه:** `codex/phase-8-beta-release`
- **HEAD هنگام شروع:** `240a4c8ec920a3d25ff24a4949b24535d0e94708`
- **release اجرایی staging:** `42360d0160ea643183127e281fafe32f55faa044`
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
| ۴.۲ | سخت‌سازی پوشش خودکار مسیرهای اصلی | ✅ | gate آموزش/ورود/اشتراک `6/6` و authenticated journeyها `18/18` سبز |
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

## blocker جاری

blocker کدی شناخته‌شده‌ای باقی نمانده است. gate نهایی به evidence یک Android
Chrome و یک iOS Safari واقعی وابسته است. پس از deploy همین commit روی staging،
صاحب پروژه فقط چک‌لیست کوتاه دستگاه را اجرا می‌کند؛ نتیجه و evidence بدون PII
در همین فایل ثبت خواهد شد.
