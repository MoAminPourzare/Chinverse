# فاز چهار چین‌ورس: تست بخش‌به‌بخش و جریان‌های کاربر

تاریخ تکمیل این گزارش: **۹ اوت ۲۰۲۶ / ۱۸ مرداد ۱۴۰۵**

این فاز قراردادهای اصلی API و رفتار قابل مشاهده‌ی رابط کاربری را در مسیرهای
واقعی کاربر بررسی می‌کند. integrationهای خودکار روی PostgreSQL موقت و با داده‌های
منحصربه‌فرد اجرا می‌شوند. release candidate کد deploy شده است، اما smoke داده‌ساز
روی staging تا اصلاح اتصال دیتابیس به‌عنوان گیت مستقل باز می‌ماند.

## نتیجه کوتاه

برای قابلیت‌هایی که در staging فعال هستند، baseline فاز چهار ساخته و اجرا شد:

- `backend/tests/integration/test_phase4_user_journeys.py`: چهار سناریوی بزرگ HTTP
  برای پروفایل، شبکه، گالری، خدمات، feed، تعاملات، تالار، مقاله، پشتیبانی، چت،
  اعلان، دوره، دیکشنری، لایتنر، فعالیت روزانه و race duplicate request.
- تست‌های backend: **۶۶ از ۶۶ unit** و **۱۴ از ۱۴ integration سبز**.
- suite کامل Playwright روی build تولیدی: **۸۷ از ۸۷ سبز** در desktop Chromium، Android-sized
  Chromium و iPhone WebKit.
- production build فرانت: **۶۳ route موفق**.
- ۳۰ تست Vitest، ESLint، TypeScript، Ruff، compileall، Bandit، `alembic check` و
  verifierهای schema فازهای ۲ تا ۴: سبز.
- downgrade به head فاز سه و upgrade مجدد migration فاز چهار همراه verifier: سبز.
- GitHub Actions فاز چهار: [run 31306622856](https://github.com/MoAminPourzare/Chinverse/actions/runs/31306622856)، هر سه job سبز.

در جریان تست چند نقص واقعی اصلاح شد: چرخه پشتیبانی کاربر/ادمین کامل شد، fallback
چت در Safari/WebKit دیگر با CSP crash نمی‌کند، watchdog اتصال و polling فوری اضافه
شد، history خالی دیررس دیگر پیام اول را overwrite نمی‌کند، خطای شبکه از حالت خالی
جدا شد، polling inbox باعث spinner و stale overwrite نمی‌شود، pending نشست‌ها پس از
خطا آزاد می‌شود و shortcut پشتیبانی روی صفحات متمرکز مزاحم کنترل‌ها نیست.

## ماتریس پذیرش

| بخش | موفق | خطا/اعتبارسنجی | خالی | مالکیت/جداسازی | race یا بازگشت |
|---|---|---|---|---|---|
| ورود و حساب | signup، login، profile در تست‌های auth | legal، حساب تأییدنشده، حذف با رمز غلط | session و داده پایه | revoke، حذف حساب، refresh rotation | refresh replay در فاز سه |
| پروفایل و ویترین | ویرایش درباره من، website/social، public profile، showcase | URL خارجی avatar رد می‌شود | public gallery/service خالی | داده عمومی بدون email/phone | navigation و overflow در E2E |
| شبکه | follow، followers/following، unfollow | self-follow و blocked user | لیست‌های تازه خالی | فقط رابطه صاحب/طرف مربوط | notification follow در backend موجود |
| گالری | upload تصویر و caption، feed، public profile | فایل نامعتبر در upload gates | gallery تازه خالی | کاربر دیگر delete نمی‌تواند؛ صاحب می‌تواند | delete، likes/comments وابسته پاک می‌شوند |
| خدمات | create banner، public list، edit، delete | title/description خالی | service list تازه خالی | patch/delete صاحب‌محور؛ کاربر دیگر 404 | duplicate like و lifecycle تست شد |
| feed و تعاملات | like، unlike، comment، counts | comment خالی و parent نامربوط | feed بدون محتوا | target و حساب جدا | duplicate like idempotent |
| تالار | سؤال، پاسخ nested، ویرایش/حذف، مقاله و نظر | متن کوتاه/خالی | لیست سؤال/مقاله قابل نمایش | سؤال در تست‌های قبلی owner-scoped | حذف nested answer در تست قبلی |
| چت و اعلان | ارسال، history، conversation، read، notification، fallback polling، ready و ping/pong WebSocket | self-message، شبکه 503، Origin نامعتبر، auth/frame نامعتبر و CSP WebSocket | inbox و گفت‌وگوی تازه خالی | block، session revoke و دسترسی پیام | broadcast پیام/read receipt، اولین پیام بدون history، latest-request-wins و retry |
| پشتیبانی | ایجاد، فهرست کاربر، صف ادمین، پاسخ، بستن و اعلان | حداقل طول، retry و منع بستن بدون پاسخ | تاریخچه تازه خالی | جداسازی دو کاربر و RBAC+MFA ادمین | پاسخ در صفحه کاربر و اعلان همگام می‌شود |
| لایتنر و دیکشنری | lookup، add، dashboard، review | واژه unpublished و card نامعتبر | dashboard صفر | card و review فقط صاحب | دو درخواست هم‌زمان یک card می‌سازند |
| هدف روزانه | video progress و summary | محدوده ثانیه و lesson id | summary بدون فعالیت | user/date scoped | upsert روزانه در DB |
| تنظیمات | appearance و daily shell | مسیرهای محافظت‌شده redirect | state خالی | security tests فاز سه | back در E2E |
| دعوت | مسیرهای feature flag در E2E بررسی redirect | در staging خاموش است | قابل انتشار نیست | entitlement تست‌پذیر نیست | باید بعد از فعال‌سازی تست شود |
| اشتراک | مسیر ناقص عمداً فعال نیست | manual placeholder پشت flag | checkout عمومی نیست | entitlement واقعی هنوز وجود ندارد | خارج از baseline انتشار |
| ادمین | overview، role، MFA، moderation و support queue | MFA/role hierarchy/report boundary | لیست‌های خالی مستقل | RBAC، MFA و مالکیت با API واقعی | E2E نقش‌محور روی سه profile مرورگر |

## تست‌های اضافه‌شده

### Backend

فایل `backend/tests/integration/test_phase4_user_journeys.py` فیکسچرهای زیر را
از مسیر HTTP می‌سازد:

1. کاربر ثبت‌نام می‌کند، با تغییر وضعیت کنترل‌شده در دیتابیس تست تأیید می‌شود و
   token واقعی می‌گیرد.
2. کاربر دوم برای بررسی جداسازی مالکیت و interaction ساخته می‌شود.
3. category، course، section، lesson و dictionary word با definition واقعی
   ساخته می‌شوند.
4. فایل PNG کوچک از داخل تست upload می‌شود و در پایان lifecycle گالری/خدمت
   حذف می‌شود.

سناریوی اول پروفایل، follow، public profile، گالری، خدمت، feed، like تکراری،
comment، edit/delete مالک و رد دسترسی کاربر دوم را بررسی می‌کند. سناریوی دوم
تالار سؤال/پاسخ، مقاله/comment، support ticket، chat، notification read،
course save isolation، vocabulary، Leitner، daily activity و duplicate add
هم‌زمان را بررسی می‌کند. سناریوی سوم lifecycle نشست، تغییر رمز، reset و منع replay
را می‌سنجد. سناریوی چهارم مالکیت تیکت، منع دسترسی کاربر عادی به صف ادمین، MFA واقعی
مدیر، منع بستن بدون پاسخ و ثبت پاسخ/اعلان را از مسیر HTTP واقعی بررسی می‌کند.

فایل `backend/tests/test_chat_websocket.py` هشت تست route/manager برای Origin،
auth-first، payload غیر object، ready، ping/pong، revoke و broadcast پیام/read receipt
دارد. `backend/tests/integration/test_chat_websocket_flow.py` نیز handler واقعی را با
PostgreSQL، signup، login، JWT و revoke نشست اجرا می‌کند.

### Frontend

دو فایل `frontend/e2e/phase4-user-journeys.spec.ts` و
`frontend/e2e/phase4-authenticated-journeys.spec.ts` در سه پروژه Playwright اجرا
می‌شوند و این موارد را پوشش می‌دهند:

- render و نبود horizontal overflow در home، explore، showcase، community و
  support؛
- ثابت ماندن مختصات shortcut پشتیبانی در چند route؛
- نمایش پیام خطای قابل retry برای خطای شبکه `/chat/conversations`؛
- نمایش متن خالی اعلان‌ها با پاسخ mock شده‌ی خالی؛
- بازگشت مرورگر از showcase به explore؛
- fallback deterministic اولین پیام چت با WebSocket معلق، history خالی با تأخیر
  ۴٫۵ ثانیه، دریافت از polling، خطای history و retry؛
- revoke نشست و بازیابی UI پس از خطای logout-all؛
- صف moderation و اعلان moderation؛
- داشبورد MFA ادمین، فهرست/پاسخ تیکت و نمایش پاسخ برای کاربر.

## اصلاحات محصول

### جایگاه پشتیبانی

در `frontend/src/components/layout/AppShell.tsx` شرط نمایش از فقط
`pathname === "/community"` به یک فهرست مسیرهای مستثنی تغییر کرد. بنابراین در
صفحات اصلی shortcut در همان مختصات داخل قاب اپ می‌ماند و روی login، legal، admin
و خود support مزاحم نیست.

### خطای شبکه پیام‌ها

در `frontend/src/app/chat/page.tsx` وضعیت `error`، callback بارگذاری مجدد و
حالت خطای قابل مشاهده اضافه شد. خطای شبکه اکنون از حالت خالی inbox جداست و کاربر
می‌تواند بدون refresh کل صفحه دوباره درخواست را بفرستد.

### realtime چت و Safari

ساخت `WebSocket` اکنون داخل `try/catch` است، بنابراین ردشدن `ws:` توسط CSP در
WebKit به crash صفحه تبدیل نمی‌شود و polling ادامه می‌یابد. handshake watchdog پس از
۱۰ ثانیه fallback را فعال و polling را همان لحظه اجرا می‌کند. history دیررس با
`appendMessages` merge می‌شود و نمی‌تواند پیام تازه‌ی polling را پاک کند. درخواست‌های
inbox نیز شماره توالی دارند تا پاسخ قدیمی‌تر روی پاسخ تازه overwrite نشود و refresh
دوره‌ای spinner تمام‌صفحه نسازد. backend نیز Origin را برای WebSocket با همان allowlist
HTTP اعتبارسنجی و اتصال نامعتبر را با کد `1008` می‌بندد.

### چرخه کامل پشتیبانی

migration `a2c4e6f8b1d3` پاسخ ادمین، پاسخ‌دهنده و زمان پاسخ را به تیکت اضافه کرد.
کاربر فقط تاریخچه خودش را می‌بیند. صف ادمین پشت RBAC و MFA است، بستن بدون پاسخ رد
می‌شود، پاسخ audit و notification می‌سازد و در `/support` نمایش داده می‌شود. صفحه
`/admin/support` برای فیلتر، بررسی، پاسخ و بستن تیکت اضافه شد.

### امنیت حساب و CSP

خطای شبکه در logout-all دیگر UI را در حالت pending نگه نمی‌دارد. نوع اعلان
`moderation` در UI صریح شد. CSP توسعه برای fallback چت `ws:` و `font-src` برای فونت
واقعاً استفاده‌شده تنظیم شد؛ production همچنان WebSocket ناامن `ws:` را مجاز نمی‌کند.

## فهرست باگ بر اساس اولویت

- **P0 باز در دامنه automated/local: صفر.**
- **P1 باز در دامنه automated/local: صفر.** P1های بسته‌شده: crash چت WebKit تحت
  CSP، race پیام اول، نبود coverage handler WebSocket و نبود workflow پاسخ پشتیبانی
  ادمین. گیت خارجی اتصال دیتابیس و live smoke جداگانه در پایین ثبت شده است.
- **P2 باز: صفر در دامنه قابلیت‌های فعال فاز چهار.** P2های بسته‌شده: گم‌شدن اولین
  پیام polling، stale overwrite و spinner inbox، تمایز خطا/خالی، pending نشست‌ها و
  هم‌پوشانی shortcut پشتیبانی.
- **P3 باز:** دو هشدار بهینه‌سازی Next Image (نسبت ابعاد لوگو و eager/LCP تصویر خالی
  چت). این‌ها failure پذیرش نیستند و برای فاز شش/هفت ثبت می‌شوند.

## فرمان‌های بازتولید

از ریشه پروژه:

```powershell
docker-compose -f .\compose.test.yml up -d --wait
$env:CHINVERSE_TEST_DATABASE_URL = "postgresql://chinverse_test:chinverse_test@127.0.0.1:55432/chinverse_test"
$env:DATABASE_URL = $env:CHINVERSE_TEST_DATABASE_URL
$env:ENVIRONMENT = "test"
$env:SECRET_KEY = "test-secret-key-that-is-long-enough-for-automated-tests"
E:\Chinverse\backend\.venv\Scripts\python.exe -m alembic upgrade head
E:\Chinverse\backend\.venv\Scripts\python.exe -m pytest -p no:cacheprovider -m integration
E:\Chinverse\backend\.venv\Scripts\python.exe scripts/verify_phase4_schema.py
Set-Location .\frontend
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
$env:PLAYWRIGHT_SERVER_MODE = "production"
npm.cmd exec -- playwright test
```

## شواهد release candidate

- release code: `92ae2c40a29afb9a15b8fcb8d4500213ef27b253`
- CI کد: [run 31306622856](https://github.com/MoAminPourzare/Chinverse/actions/runs/31306622856)، موفق
- OIDC deploy سخت‌شده: [run 31310086979](https://github.com/MoAminPourzare/Chinverse/actions/runs/31310086979)، موفق
- Quality Gates پس از سخت‌سازی workflow: [run 31310087005](https://github.com/MoAminPourzare/Chinverse/actions/runs/31310087005)، موفق
- Vercel Preview: <https://chinverse-nwhvuwf7k-death-stroke.vercel.app>
- Hugging Face Space commit: `526add1ee73c618f29142b55e720449080ead48f`
- tree منتشرشده‌ی Space دقیقاً برابر tree پوشه `backend` در release code است.
- runtime: `RUNNING`؛ `/health` همان release code، `/health/ready` دیتابیس `ok` و
  `/docs` پاسخ `404` می‌دهد.

در همین deploy مشخص شد secret `DATABASE_URL` در Space به Neon production
`br-cold-salad-at44rvqh` اشاره داشته، نه شاخه دائمی staging. startup migration فاز
چهار production را از `d3a7f9c2e5b1` به `a2c4e6f8b1d3` برد؛ staging
`br-shiny-darkness-at6obb2e` همچنان روی `c8f1e2a4d6b9` است. برای بازیابی، snapshot
staging با نام `phase4-predeploy-92ae2c4` و branch نقطه‌زمانی production با نام
`phase4-prod-pre-migration-92ae2c4` ساخته شد؛ revision دومی `d3a7f9c2e5b1` است.

## محدودیت‌ها و کار باقی‌مانده

این baseline به معنی بسته‌شدن تمام تست‌های انتشار نیست. موارد زیر عمداً برای
فازهای بعدی یا نیازمند credential/داده‌ی واقعی باقی مانده‌اند:

- handler واقعی WebSocket در unit/integration پوشش دارد؛ smoke provider برای جریان
  A→B، read receipt، reconnect و revoke هنوز باید با session fixture زنده اجرا شود.
- اجرای واقعی روی دستگاه Android، iPhone و Safari با شبکه موبایل جایگزین
  کامل شبیه‌سازی Playwright نیست.
- referrals و subscriptions در staging با feature flag خاموش‌اند؛ checkout
  manual-placeholder نباید در release عمومی فعال شود.
- سناریوهای authenticated و role-based مرورگر با mock قراردادی پایدار پوشش داده
  شدند؛ smoke همان مسیرها روی staging زنده به حساب‌های seedشده و دسترسی Preview نیاز دارد.
- تست load، soak، CDN/HLS، restore بکاپ و خطاهای provider در فاز کارایی/عملیات
  اجرا می‌شود.

بنابراین فاز چهار برای **قابلیت‌های فعال و قابل تست در محیط محلی بسته است** و deploy
کد نیز قابل ردیابی و سبز است. اعلام پایان سراسری فاز چهار تا انتقال محرمانه‌ی اتصال HF
به Neon staging، اجرای migration روی همان branch و smoke authenticated/role/WebSocket
زنده معلق می‌ماند. محدودیت‌های رسانه، دستگاه واقعی و عملیات طبق نقشه راه فازهای بعدی‌اند.
