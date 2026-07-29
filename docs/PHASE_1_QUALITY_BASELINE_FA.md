# گزارش فاز ۱: خط مبنای کیفیت و انتشار

## هدف فاز

هدف این فاز ساختن یک خط مبنای قابل تکرار بود؛ یعنی هر تغییر بعدی قبل از
دیپلوی با یک مجموعه کنترل ثابت بررسی شود و نتیجه فقط به شرایط سیستم توسعه
وابسته نباشد.

این فاز عمداً با دیتابیس PostgreSQL ایزوله انجام شده و هیچ داده‌ای در Neon
حذف یا بازنویسی نشده است.

## کارهای انجام‌شده

### محیط و نصب قابل تکرار

- نسخه Node، Python، Poetry و PostgreSQL پین شد.
- `package-lock.json` و `poetry.lock` مرجع نصب CI و سرور شدند.
- Dockerfile بک‌اند با Python 3.11.15 و Poetry 2.4.1 بازنویسی شد.
- قواعد line ending و EditorConfig برای Windows و Linux یکسان شد.
- فایل‌های cache، گزارش تست و uploadهای جدید از Git خارج شدند.

### امنیت dependencyها

- Next.js، React و Axios به نسخه‌های patch‌شده ارتقا یافتند.
- dependency قدیمی `next-pwa` حذف شد. manifest و نصب وب‌اپ باقی است، اما
  offline service worker تا زمان پیاده‌سازی با یک ابزار نگهداری‌شده فعال نیست.
- dependencyهای غیرمستقیم production شامل `form-data`، `postcss` و `sharp`
  به نسخه‌های امن override شدند و build واقعی آن‌ها را تایید کرد.
- FastAPI، Starlette، Pillow، pillow-heif و python-multipart ارتقا یافتند.
- `python-jose` و زنجیره رمزنگاری قدیمی آن با PyJWT جایگزین شد.
- audit کامل محیط production فرانت‌اند و audit محیط Python بدون vulnerability
  شناخته‌شده عبور می‌کند.

### سخت‌سازی ورودی و HTTP

- هدرهای `nosniff`، جلوگیری از iframe، Referrer Policy، Permissions Policy و
  HSTS روی فرانت‌اند تنظیم شدند؛ بک‌اند نیز هدرهای متناظر را با تنظیم محیطی
  اعمال می‌کند.
- فایل تصویر فقط بر اساس پسوند یا MIME پذیرفته نمی‌شود؛ محتوای واقعی با
  Pillow باز و verify می‌شود و فایل جعلی حذف می‌گردد.
- سقف ۴۰ میلیون پیکسل برای جلوگیری از تصویرهای فشرده ولی بسیار بزرگ اضافه شد.
- فرمت‌های رایج HEIC/HEIF/BMP/TIFF پشتیبانی و در صورت نیاز به JPEG تبدیل
  می‌شوند.
- rate limiter به‌صورت پیش‌فرض هدر قابل‌جعل `X-Forwarded-For` را نادیده می‌گیرد
  و فقط با فعال‌سازی صریح اعتماد به proxy از آن استفاده می‌کند.

### دیتابیس و migration

- پنج جدول عملیاتی که فقط با SQL خام ساخته می‌شدند وارد metadata رسمی
  SQLAlchemy شدند.
- indexها، unique constraintها و foreign keyهای مدل و PostgreSQL همگام شدند.
- `alembic check` دیگر دستور حذف اشتباه جدول‌های معتبر پیشنهاد نمی‌کند.
- downgrade تکراری اعلان‌ها اصلاح شد.
- چرخه کامل `base -> head -> base -> head` روی PostgreSQL واقعی تست شد.

### تست و CI

- unit test و coverage برای helperهای حساس فرانت‌اند اضافه شد.
- integration test واقعی ثبت‌نام، ورود، JWT، پروفایل و readiness اضافه شد.
- چرخه ساخت، ویرایش و حذف سوال همراه با پاسخ والد و فرزند روی PostgreSQL واقعی
  تست شد.
- تست آپلود، محدودیت حجم/type و تبدیل BMP به JPEG اضافه شد.
- Playwright برای Chrome دسکتاپ، نمای Android و WebKit نمای iPhone اضافه شد.
- GitHub Actions برای audit، lint، typecheck، coverage، build، migration،
  integration، browser و Docker ساخته شد.
- اسکریپت `scripts/check.ps1` همان کنترل‌ها را محلی اجرا می‌کند و exit code
  تمام فرمان‌های native را صریح بررسی می‌کند.

### پایداری رابط کاربری

- locator تست نمایش/مخفی‌کردن رمز پایدار و دسترس‌پذیر شد.
- مشکل عمومی modalهای fixed داخل RouteTransition رفع شد. علت، باقی‌ماندن
  transform و filter انیمیشن روی ancestor بود که viewport را اشتباه محاسبه
  می‌کرد.
- پنل تنظیمات ظاهر اکنون در viewport موبایل می‌ماند و محتوای بلند داخل خود
  پنل اسکرول می‌شود.

### مانیتورینگ دیپلوی

- `GET /api/health` برای فرانت‌اند اضافه شد و commit دیپلوی Vercel را برمی‌گرداند.
- `GET /health` برای liveness بک‌اند باقی ماند.
- `GET /health/ready` اتصال واقعی PostgreSQL را بررسی می‌کند.
- Docker healthcheck از readiness واقعی استفاده می‌کند.

## معیارهای اجباری

| کنترل | معیار |
| --- | --- |
| Frontend production audit | صفر vulnerability |
| Python audit | صفر vulnerability |
| Frontend coverage | حداقل ۸۰٪ line/function/statement و ۷۰٪ branch |
| Backend coverage | حداقل ۵۰٪ |
| Alembic heads | دقیقاً یک head |
| Model/migration parity | بدون عملیات جدید |
| Browser overflow | حداکثر ۱px |
| Backend readiness | PostgreSQL با `SELECT 1` پاسخ دهد |

## نتیجه اجرای نهایی محلی

اجرای کامل زیر در ۲۹ ژوئیه ۲۰۲۶ با exit code صفر تمام شد:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1 -WithIntegration -WithE2E
```

| خروجی | نتیجه |
| --- | --- |
| Frontend unit tests | ۲۷ از ۲۷ پاس |
| Frontend coverage | statement: ۹۳٫۳۹٪، branch: ۸۰٫۷۰٪، function: ۹۸٫۵۰٪، line: ۹۴٫۲۰٪ |
| Next.js production build | موفق؛ ۵۴ صفحه static تولید شد |
| Playwright | ۲۴ از ۲۴ روی Chromium دسکتاپ، Android و WebKit آیفون |
| Backend unit tests | ۲۱ از ۲۱ پاس |
| Backend integration | ۲ از ۲؛ جریان احراز هویت/پروفایل و CRUD کامل سوال پاس |
| Backend coverage | ۵۶٫۰۷٪ |
| Dependency audit | production npm و Python هر دو صفر vulnerability شناخته‌شده |
| Migration | upgrade، parity، downgrade تا base و rebuild کامل پاس |
| Docker | image تولیدی دومرحله‌ای با کاربر non-root با موفقیت build شد |

## نکات باقیمانده و شفاف

1. audit کامل npm برای ابزارهای توسعه، advisory مربوط به
   `brace-expansion/minimatch@3` را از زنجیره ESLint گزارش می‌کند. این کد وارد
   bundle production نمی‌شود و ورودی glob آن فقط توسط توسعه‌دهنده کنترل می‌شود.
   override نسخه جدید API را شکست و عمداً نگه داشته نشد. CI audit production
   را با صفر vulnerability اجباری می‌کند و این مورد باید با انتشار نسخه سازگار
   pluginهای ESLint حذف شود.
2. تعداد ۲۸ فایل upload قدیمی از قبل در Git track شده‌اند. ignore جدید جلوی
   اضافه‌شدن فایل تازه را می‌گیرد، اما حذف تاریخچه یا انتقال این فایل‌ها بدون
   تصمیم مالک داده انجام نشد. این مورد قبل از عمومی‌شدن repository و اپ باید
   بررسی شود.
3. پوشش ۵۰٪ بک‌اند خط مبناست، نه پایان تست. endpointهای business مانند خدمات،
   community، chat و پرداخت هنوز به تست‌های رفتاری بیشتری نیاز دارند.
4. WebKit خودکار جای تست نهایی روی Safari و iPhone واقعی را نمی‌گیرد. تست دستگاه
   واقعی در فاز سازگاری مرورگر و موبایل انجام می‌شود.
5. فعال‌سازی دوباره PWA/offline باید همراه با تست cache invalidation و update
   service worker باشد تا کاربر نسخه قدیمی اپ را دریافت نکند.
6. rate limiter فعلی در حافظه همان process نگهداری می‌شود. برای چند replica یا
   ترافیک عمومی باید در فاز زیرساخت به backend مشترک مانند Redis منتقل شود.

## کار موردنیاز مالک پروژه

پس از سبز شدن اولین اجرای GitHub Actions، روی branch اصلی یک Ruleset بسازید و
دو check با نام‌های `Frontend` و `Backend` را برای merge اجباری کنید. این تنظیم
به دسترسی مدیریتی GitHub نیاز دارد.

پیش از انتشار عمومی، متغیرهای production بک‌اند باید حداقل شامل secret قوی،
دامنه دقیق CORS، host دقیق API، مستندات خاموش و HSTS روشن باشند. مقدارهای نمونه
نباید روی سرور production استفاده شوند.

در Hugging Face مقدار `TRUST_PROXY_HEADERS=true` فقط بعد از بررسی زنجیره واقعی
proxy تنظیم شود و `TRUSTED_PROXY_COUNT` برابر تعداد hopهای مورداعتماد باشد؛
فعال‌سازی حدسی آن می‌تواند rate limit را قابل دورزدن کند.
