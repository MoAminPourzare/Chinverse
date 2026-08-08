# گزارش فاز ۳: امنیت و اعتماد

تاریخ تکمیل و بازبینی نهایی: ۱۷ مرداد ۱۴۰۵، برابر با ۸ اوت ۲۰۲۶

## معیار پذیرش

- تأیید ایمیل و موبایل، reset و change password قابل استفاده باشد.
- نشست امن، rotation و revoke واقعی در دیتابیس پیاده شود.
- نقش‌ها از دیتابیس و دسترسی ادمین فقط با MFA معتبر اعمال شود.
- rate limit بین replicaها مشترک و Turnstile سمت سرور اجباری باشد.
- CSP nonce، CSRF protection، no-store و headerهای امنیتی فعال باشد.
- فایل از نظر محتوا، حجم و metadata کنترل شود.
- report، block، moderation، appeal و اسناد حقوقی مسیر کامل داشته باشند.
- threat model نوشته و اسکن نهایی بدون مورد Critical/High باشد.

## تغییرات فنی

### هویت و رمز

- هش جدید با Argon2 و ارتقای خودکار hash قدیمی پس از ورود موفق
- passphrase بین ۱۵ تا ۱۲۸ کاراکتر، بدون اجبار ترکیب مصنوعی
- رد رمزهای رایج و رمز شامل ایمیل یا موبایل
- پاسخ عمومی و یکسان برای درخواست بازیابی حساب
- challenge کوتاه‌عمر، تک‌مصرف، هش‌شده و دارای سقف تلاش
- تأیید مستقل ایمیل و موبایل و محدودشدن حساب تأییدنشده
- ثبت نسخه پذیرش شرایط استفاده، حریم خصوصی و قوانین جامعه

### نشست، RBAC و MFA

- access token ده دقیقه‌ای با `exp/iat/nbf/jti/sid/type`
- access token فقط در حافظه JavaScript
- refresh token opaque، چرخشی، هش‌شده و داخل cookie `HttpOnly`
- فهرست و revoke نشست، خروج جاری و خروج از همه دستگاه‌ها
- revoke همه نشست‌ها پس از تغییر/reset رمز، نقش، وضعیت یا MFA
- حذف دائمی حساب فقط با رمز فعلی و تأیید صریح، پاک‌کردن cookie و ثبت audit
- نقش‌های `user/moderator/admin` داخل دیتابیس و حذف کامل `ADMIN_EMAILS`
- MFA اجباری endpointهای ادمین، TOTP ضد replay و backup code یک‌بارمصرف
- ابزار آفلاین reset اضطراری MFA با تأیید دوباره و audit

### لایه HTTP و سوءاستفاده

- rate limit اتمیک PostgreSQL و fail closed
- کلید جدا برای IP و حساب در login/reset
- اعتماد به XFF فقط از CIDR reverse proxy و تعداد hop مشخص
- Turnstile Siteverify با token، action و hostname
- reset ویجت پس از تلاش ناموفق برای رعایت تک‌مصرف‌بودن token
- BFF هم‌مبدأ با بررسی Origin/Referer و Fetch Metadata روی mutation
- CSP nonce مستقل برای هر پاسخ، `strict-dynamic` و frame protection
- `no-store` روی همه پاسخ‌های API و BFF
- noindex روی staging و fail-fast تنظیمات ناامن production
- body limiter برای `Content-Length` و streamهای chunked

### فایل و حریم خصوصی

- سقف مستقل JSON، import، تصویر و ویدئو
- allowlist پسوند و MIME همراه با بررسی محتوای واقعی
- سقف ۴۰ میلیون پیکسل و جلوگیری از image bomb
- re-encode تصویر به JPEG/WebP و حذف EXIF
- بررسی markerهای WebM و boxهای MP4/MOV
- جلوگیری از ثبت مستقیم avatar خارجی و tracking image در cover مقاله جدید
- UUID برای نام فایل و حذف امن فایل در rollback دیتابیس
- bucket خصوصی و mounted برای فایل‌های staging، با جداسازی اجباری از S3 تولید

### اعتماد و moderation

- block با قطع follow دوطرفه و جلوگیری از پیام جدید
- گزارش حساب، پست، نظر، سؤال، پاسخ، مقاله، گالری، خدمت و پیام مرتبط
- unique report فعال و جلوگیری از self-report
- صف `open/reviewing/resolved/dismissed`، claim و row lock
- رتبه نقش برای جلوگیری از اقدام moderator علیه حساب بالاتر
- هشدار، حذف محتوا، تعلیق کاربر، revoke نشست و notification
- restore حساب توسط ادمین دارای MFA برای مسیر بازبینی
- ماندگاری report و action پس از حذف حساب گزارش‌دهنده یا moderator
- صفحه moderation و کنترل‌های report/block در رابط کاربری

### اسناد حقوقی

- سه سند نسخه‌دار و لینک‌شده از ثبت‌نام و بخش درباره چین‌ورس
- ثبت رضایت صریح و نسخه سند در دیتابیس
- پوشش حساب، محتوای کاربر، خدمات، رفتار ممنوع، حذف و بازبینی
- پوشش داده عمومی/خصوصی، provider، cookie، نگهداری، حقوق کاربر و کاربران کم‌سن
- توضیح روشن report، block، فرایند moderation و درخواست بازبینی

## migration

revision فاز ۳:

`d3a7f9c2e5b1_add_security_trust_foundation`

این revision ستون‌های امنیتی user و جدول‌های زیر را ایجاد می‌کند:

- `auth_sessions`
- `auth_challenges`
- `mfa_backup_codes`
- `rate_limit_buckets`
- `security_audit_events`
- `legal_acceptances`
- `user_blocks`
- `content_reports`
- `moderation_actions`

اسکریپت `verify_phase3_schema.py` جدول‌ها، ستون‌ها و indexهای حیاتی را مستقل از
ORM کنترل می‌کند. CI چرخه `head -> base -> head` و parity مدل را اجرا می‌کند.

## تست و اسکن

فرمان‌های اجباری این فاز:

```text
frontend: npm audit, ESLint, TypeScript, Vitest coverage, Next production build, Playwright Chromium/WebKit
backend: pip-audit, Ruff, compileall, Bandit, Pytest unit/integration و coverage
database: alembic upgrade/check/downgrade/rebuild و verifierهای فاز ۲ و ۳
release: secret/privacy baseline guard و بررسی فایل‌های track‌شده
```

نتیجه آخرین اجرای کامل در ۸ اوت ۲۰۲۶:

| دروازه | نتیجه |
| --- | --- |
| frontend lint و TypeScript | پاس، بدون خطا |
| frontend unit | ۳۰ تست پاس در ۸ فایل |
| frontend coverage | statements: ۹۳٫۴۸٪، branches: ۸۰٫۷۰٪، functions: ۹۸٫۵۰٪، lines: ۹۴٫۲۸٪ |
| Next.js production build | پاس، ۶۲ صفحه تولید شد |
| Playwright | ۳۶ سناریو پاس روی Chromium دسکتاپ، Chromium موبایل و WebKit/iPhone |
| backend unit | ۵۸ تست پاس، ۹ integration از این اجرا جدا شد |
| backend integration | ۹ تست پاس روی PostgreSQL 18 ایزوله |
| backend coverage | ۵۶٫۵۱٪، بالاتر از gate فعلی ۵۰٪ |
| migration | `head -> check -> base -> head -> check` پاس |
| schema verifier | فاز ۲ و ۳ پاس؛ ۹ جدول، ۱۰ ستون امنیتی و ۴ index حیاتی فاز ۳ تأیید شد |
| npm audit | صفر vulnerability در dependencyهای production |
| pip-audit | صفر vulnerability شناخته‌شده |
| Bandit | صفر finding با شدت Medium یا High |
| secret scan | صفر الگوی پرریسک در فایل‌های فعلی و کل تاریخچه Git |
| release baseline | پاس |

اجرای مرجع CI روی commit `01a862d4e0ea1866c40222ba499066ebc83f194b`:

- [GitHub Actions، اجرای 31264739698](https://github.com/MoAminPourzare/Chinverse/actions/runs/31264739698): سه job مربوط به release baseline، frontend و backend موفق
- [Vercel Preview](https://chinverse-84nsvtlxg-death-stroke.vercel.app): deployment موفق برای همان commit
- [Hugging Face staging](https://moamin9-chinverse-api.hf.space): وضعیت `RUNNING` و release برابر همان commit
- `GET /health/ready`: پاسخ ۲۰۰ و `database: ok` پس از اجرای migration روی Neon staging
- `/docs`: پاسخ ۴۰۴، مسیر محافظت‌شده بدون token: پاسخ ۴۰۱، Origin نامعتبر: پاسخ ۴۰۳
- CSP، HSTS، noindex staging، deployment tier و `Cache-Control: no-store` روی پاسخ API تأیید شد
- bucket خصوصی `MoAmin9/chinverse-api-storage` با دسترسی read/write در `/data` mount شد؛ شروع موفق برنامه ایجاد مسیرهای runtime روی mount را تأیید می‌کند

نتیجه امنیتی این فاز: در ابزارهای خودکار و تست‌های نوشته‌شده مورد باز
`Critical` یا `High` باقی نمانده است. این نتیجه معادل تضمین نبود مطلق آسیب‌پذیری
نیست؛ تست نفوذ مستقل و آزمون providerهای واقعی همچنان gate انتشار عمومی‌اند.

معیار توقف:

- هر vulnerability با شدت Critical یا High
- هر Bandit High یا Medium بدون تحلیل و توجیه ثبت‌شده
- هر شکست migration، integration، build یا browser test
- هر secret واقعی یا فایل محیطی خصوصی در Git

## تنظیمات لازم پیش از production

مالک محصول باید این موارد را در secret manager محیط واقعی تنظیم و نتیجه را ثبت کند:

- `SECRET_KEY` و `MFA_ENCRYPTION_KEY` مستقل و حداقل ۳۲ کاراکتر
- `DATABASE_URL` حساب production با کمترین دسترسی
- storage endpoint، bucket، access key و public base URL مجزا
- `AUTH_DELIVERY_WEBHOOK_URL/SECRET` همراه آزمون ایمیل و SMS واقعی
- `TURNSTILE_SECRET_KEY` و site key مجزا برای staging و production
- `TURNSTILE_EXPECTED_HOSTNAMES` دقیق
- `TRUSTED_PROXY_NETWORKS` و `TRUSTED_PROXY_COUNT` مطابق مسیر واقعی edge
- CORS و `ALLOWED_HOSTS` فقط برای دامنه‌های production
- cookie با نام دارای `__Host-`، Secure و SameSite Strict
- خاموش‌بودن debug token و API docs و روشن‌بودن HSTS

سپس باید:

1. ادمین اولیه با `bootstrap_admin.py` ساخته شود.
2. ادمین MFA را فعال و backup codeها را خارج از دستگاه روزمره نگهداری کند.
3. backup و restore production روی مقصد ایزوله آزموده شود.
4. delivery، reset، verify و Turnstile از شبکه موبایل واقعی smoke test شوند.
5. هویت حقوقی، راه تماس، حوزه قضایی، retention و پاسخ moderation با مشاور حقوقی نهایی شود.
6. تست نفوذ مستقل پیش از جذب تعداد زیاد کاربر برنامه‌ریزی شود.

## rollback و بازیابی ادمین

در قفل‌شدن ادمین پس از ازدست‌رفتن authenticator و backup code، اپراتوری که
دسترسی مستقیم و ثبت‌شده دیتابیس دارد می‌تواند اجرا کند:

```powershell
poetry run python scripts/reset_admin_mfa.py `
  --email admin@example.com `
  --confirm-email admin@example.com `
  --confirm RESET-ADMIN-MFA
```

این فرمان secret و backup codeها را حذف، همه نشست‌ها را revoke و event
`auth.mfa_reset_by_operator` را ثبت می‌کند. پس از آن ادمین باید رمز خود را
تأیید، MFA تازه فعال و کلیدهای بازیابی جدید را نگهداری کند.

## وضعیت فعلی

کد، migration، تست‌های خودکار و deployment محیط staging کامل‌اند. خطای checkout
تمیز مربوط به نبود پوشه خالی `static` در Linux نیز بازتولید شد، ساخت صریح ریشه
runtime و تست رگرسیون برای آن اضافه شد و gate نهایی CI سبز است. backend روی
Hugging Face با Neon staging و storage خصوصی mounted در حال اجراست و frontend
preview نیز deploy شده است.

عبارت «آماده انتشار عمومی production» فقط پس از اعمال تنظیمات عملیاتی بالا،
smoke test واقعی providerهای ایمیل/SMS و Turnstile، انتخاب storage سازگار با
S3 برای tier عمومی، تست نفوذ مستقل و نهایی‌شدن متن‌های حقوقی معتبر است. این‌ها
gateهای بهره‌برداری و حقوقی‌اند؛ در دامنه کد و اسکن خودکار فاز ۳ مورد باز
Critical یا High وجود ندارد.
