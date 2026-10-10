# گزارش فاز ۲: دیتابیس و ذخیره‌سازی پایدار

تاریخ اجرا: ۲۹ ژوئیه ۲۰۲۶

## هدف

این فاز برای حذف تغییرات runtime در schema، قابل‌ساخت‌بودن دیتابیس از صفر،
قابل‌اعتمادکردن backup/restore و خارج‌کردن فایل‌های کاربران از دیسک موقت
Hugging Face طراحی شد.

معیارهای پذیرش:

- تمام DDLها فقط از مسیر Alembic اجرا شوند.
- مدل‌ها و جدول‌های legacy بدون از دست‌رفتن داده‌ی فعال حذف شوند.
- چرخه‌ی `base -> head -> base -> head` روی PostgreSQL هم‌نسخه‌ی production
  موفق باشد.
- staging دیتابیس از production جدا باشد.
- backup دارای checksum روی مقصد ایزوله restore و از نظر schema و داده تأیید شود.
- upload جدید مستقیماً در object storage قرار بگیرد و پس از restart/redeploy
  باقی بماند.
- ارجاع فایل‌های قدیمی به object storage منتقل شود.

## تغییرات schema

### حذف DDL در زمان درخواست

۱۹ دستور `CREATE TABLE`، `ALTER TABLE` و `CREATE INDEX` از مسیرهای زیر حذف شد:

- subscription
- referral
- notification
- daily activity
- saved courses

از این پس اگر migration اجرا نشده باشد، برنامه به‌جای دست‌کاری خودکار schema
fail می‌شود. این رفتار خطای deployment را زود و قابل‌مشاهده می‌کند و از
ناهمگونی replicaها جلوگیری می‌کند.

یک guard مبتنی بر AST نیز به تست‌ها اضافه شد:

- وجود DDL در `backend/app` را رد می‌کند.
- SQL علیه جدول‌های حذف‌شده را رد می‌کند.
- تک‌بودن head زنجیره Alembic را بررسی می‌کند.

### مدل‌های فعال

مدل‌های بزرگ و مخلوط legacy حذف و مدل‌های فعال به مالکیت درست منتقل شدند:

- `StudySession` به `app.models.activity`
- `SubscriptionPlan` و `UserSubscription` به `app.models.subscription`

مدل‌های حذف‌شده:

- `BusinessService`
- `ConsultationRequest`
- `LeitnerCard`
- `UserStreak`
- `CourseReview`

جدول‌های حذف‌شده:

- `services`
- `consultation_requests`
- `leitner_cards`
- `user_streaks`
- `course_reviews`

جایگزین‌های فعال:

- `user_services`
- `user_flashcards`
- streak مشتق‌شده از `study_sessions`

### migration داده

revision جدید:

`c8f1e2a4d6b9_remove_legacy_models_and_runtime_schema`

در upgrade:

- serviceهای فعال legacy بدون ایجاد رکورد تکراری به `user_services` منتقل
  می‌شوند.
- وضعیت Leitner legacy با constraint یکتا در `user_flashcards` merge می‌شود.
- شماره‌ی جعبه در محدوده ۱ تا ۵ نگه داشته می‌شود.
- سپس پنج جدول legacy حذف می‌شوند.

در downgrade:

- پنج جدول و تمام indexهایی که revisionهای قدیمی انتظار دارند بازسازی می‌شوند.
- این موضوع با اجرای واقعی rollback تا `base` کنترل شده است.

در production فعلی، شمارش جدول‌های legacy پیش از migration:

- `services`: صفر
- `consultation_requests`: صفر
- `leitner_cards`: صفر
- `course_reviews`: صفر
- `user_streaks`: دو

دو streak قدیمی هر دو از `study_sessions` قابل محاسبه‌اند. مقدار longest
محاسبه‌شده با داده قدیمی یکسان بود؛ مقدار current قدیمی stale بود و با زمان
فعلی سازگار نبود. نوشتن مجدد در `user_streaks` حذف شد و streak اکنون فقط از
فعالیت واقعی محاسبه می‌شود.

## سازگاری Neon و asyncpg

در اولین اجرای migration روی Neon مشخص شد URL رسمی provider شامل
`sslmode=require` است، در حالی که asyncpg پارامتر `ssl` را می‌پذیرد.

نرمال‌سازی ساختاریافته URL اضافه شد:

- driver به `postgresql+asyncpg` تبدیل می‌شود.
- `sslmode` به `ssl` ترجمه می‌شود.
- پارامترهای libpq که asyncpg پشتیبانی نمی‌کند حذف می‌شوند.
- رمز URL-encoded بدون خراب‌شدن حفظ می‌شود.

برای این رفتار تست regression وجود دارد.

## Neon staging

یک branch دائمی با نام `staging` از branch پیش‌فرض `production` ساخته شد:

- parent: `production`
- data and schema: clone کامل
- compute: read/write مستقل
- auto-delete: خاموش
- PostgreSQL: 18

migration فقط روی `staging` اجرا شد و production دست‌نخورده باقی ماند.

نتیجه روی Neon staging:

- revision قبل: `e6b9c2d4a7f0`
- revision بعد: `c8f1e2a4d6b9`
- `alembic check`: بدون drift
- جدول‌های legacy: حذف‌شده
- جدول‌های الزامی و سه plan پیش‌فرض: موجود

## backup و restore

دو اسکریپت عملیاتی اضافه شد:

- `scripts/backup-database.ps1`
- `scripts/restore-database.ps1`

ویژگی‌های backup:

- فرمت custom از `pg_dump`
- فشرده‌سازی level 9
- schema عمومی
- بدون owner و ACL
- metadata شامل زمان، منبع، نسخه client، release SHA، اندازه و SHA-256
- عدم ثبت connection string یا رمز در metadata

ویژگی‌های restore:

- نیاز اجباری به `-ConfirmIsolatedTarget`
- جلوگیری از restore روی source
- جلوگیری از مقصد هم‌host مگر با تأیید جداگانه
- بررسی checksum پیش از restore
- `--clean --if-exists --single-transaction --exit-on-error`
- اجرای `ANALYZE`
- بررسی revision Alembic پس از restore

client هر دو اسکریپت روی image دقیق زیر pin شده است:

`postgres:18.4-alpine3.24`

### آزمون محلی

backup دیتابیس fixture روی دیتابیس ایزوله restore شد و sentinelهای service و
flashcard پس از restore وجود داشتند.

### آزمون Neon

backup واقعی staging:

- مسیر محلی و خارج از Git:
  `.backups/phase2-neon/chinverse-20260729T131249Z.dump`
- SHA-256:
  `ae506c638f8bfa0baf2dfc5ac9abb759eacdeb8030c784c6f3986e6c9ce5b39c`

یک branch موقت restore ساخته شد. پیش از restore، نام plan شماره ۱۰۰۱ عمداً
به مقدار probe تغییر کرد. پس از restore:

- revision برابر `c8f1e2a4d6b9` بود.
- invariantهای schema موفق بودند.
- مقدار probe حذف و نام اصلی plan بازگشت.

branch موقت پس از تأیید حذف شد.

## ذخیره‌سازی پایدار فایل

لایه storage از حالت local-only به adapter عمومی و دوحالته تبدیل شد:

- `local` برای توسعه محلی
- `s3` برای staging و production

این adapter به یک vendor خاص وابسته نیست و با endpoint، bucket و credential
محیط تنظیم می‌شود. پس از ردشدن فعال‌سازی Cloudflare، provider این release به
**Hugging Face Storage Buckets** تغییر کرد. این سرویس API سازگار با S3 دارد و
برای حساب رایگان سهمیه ذخیره‌سازی ارائه می‌کند.

تنظیمات boto3 برای الزامات gateway هاگینگ‌فیس صریح است:

- endpoint در namespace مالک bucket
- addressing style برابر `path`
- region برابر `us-east-1`
- checksum request/response فقط در حالت required
- retry استاندارد SDK

رفتار upload در حالت S3:

1. فایل ابتدا در staging محلی با محدودیت حجم و نوع نوشته می‌شود.
2. تصویر واقعاً با Pillow اعتبارسنجی می‌شود.
3. فرمت‌های HEIC/HEIF/BMP/TIFF در صورت نیاز به JPEG تبدیل می‌شوند.
4. upload از thread جدا و با retry استاندارد S3 انجام می‌شود.
5. `Content-Type` و cache immutable ثبت می‌شود.
6. فایل staging فقط پس از موفقیت upload حذف می‌شود.
7. URL عمومی object در دیتابیس ثبت می‌شود.

رفتار delete:

- URL فقط وقتی به key تبدیل می‌شود که scheme، host و path آن دقیقاً با
  `OBJECT_STORAGE_PUBLIC_BASE_URL` هم‌خوان باشد.
- traversal و host مشابه جعلی رد می‌شود.
- حذف رکورد دیتابیس پیش از حذف object commit می‌شود تا خرابی storage تراکنش
  داده را نیمه‌کاره نگذارد.
- شکست حذف object لاگ می‌شود و می‌تواند بعداً با cleanup job جمع‌آوری شود.

production اکنون fail-closed است و بدون این متغیرها بالا نمی‌آید:

- `FILE_STORAGE_MODE=s3`
- `OBJECT_STORAGE_ENDPOINT_URL`
- `OBJECT_STORAGE_BUCKET_NAME`
- `OBJECT_STORAGE_ACCESS_KEY_ID`
- `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- `OBJECT_STORAGE_PUBLIC_BASE_URL`
- `OBJECT_STORAGE_REGION`
- `OBJECT_STORAGE_ADDRESSING_STYLE`

ابزارهای عملیاتی:

- `backend/scripts/migrate_uploads_to_object_storage.py`
- `backend/scripts/verify_object_storage.py`

migration فایل‌ها به‌صورت پیش‌فرض dry-run است و فقط با `--apply` تغییر می‌دهد.
فایل source stream می‌شود، محدودیت حجم دارد، object با `HEAD` کنترل می‌شود و
URLهای دیتابیس داخل transaction تغییر می‌کنند. manifest خارج از Git نوشته
می‌شود.

dry-run روی Neon staging:

- URL reference بررسی‌شده: ۲۰۶
- object یکتای نیازمند migration: ۲

### اصلاح provider هنگام انتشار فاز ۳

در ۸ اوت ۲۰۲۶ مشخص شد محصول فعلی Hugging Face Storage Buckets در Space
رایگان، bucket را مستقیماً به‌صورت volume پایدار mount می‌کند و credential
سازگار با S3 در تنظیمات این Space ارائه نشده است. برای جلوگیری از ادعای نادرست
و نگه‌داشتن staging روی زیرساخت رایگان، bucket خصوصی
`MoAmin9/chinverse-api-storage` با دسترسی read/write در `/data` mount شد.

لایه storage اکنون سه حالت صریح دارد:

- `local` فقط برای توسعه
- `mounted` برای volume پایدار staging؛ فایل‌ها از `/uploads/...` سرو می‌شوند
- `s3` برای production عمومی و provider دارای endpoint و credential مستقل

حالت `mounted` فقط در release tier استیجینگ پذیرفته می‌شود. tier تولید همچنان
fail-closed است و فقط `s3` را قبول می‌کند. مسیرهای گالری و پوستر خدمات نیز از
دایرکتوری قدیمی `static/uploads` به root مشترک و پایدار uploads منتقل شدند تا
مسیر فایل و URL عمومی دقیقاً منطبق باشند.

## تست‌ها

نتایج ثبت‌شده تا پیش از اتصال نهایی bucket:

- Frontend lint: موفق
- Frontend typecheck: موفق
- Frontend unit: ۲۷ از ۲۷
- Frontend coverage: statement 93.39%، branch 80.70%، function 98.50%،
  line 94.20%
- Frontend build: موفق، ۵۵ صفحه static
- Playwright: ۲۷ از ۲۷ روی desktop Chromium، Android-sized Chromium و
  iPhone WebKit
- Backend unit: ۳۲ تست non-integration پس از guard جدید
- Backend integration: ۲ از ۲، شامل مسیر streak بعد از حذف جدول legacy
- Backend coverage: حداقل gate برابر ۵۰٪ و نتیجه ثبت‌شده 57.13%
- Ruff: موفق
- compileall: موفق
- pip check: موفق
- pip-audit: بدون آسیب‌پذیری شناخته‌شده
- npm production audit: بدون آسیب‌پذیری شناخته‌شده
- Poetry lock check: موفق
- fresh upgrade روی PostgreSQL 18.4: موفق
- downgrade تا base: موفق
- rebuild تا head: موفق
- Alembic model/schema parity: موفق
- Neon staging migration: موفق
- Docker production build: موفق
- container user: UID 1000
- boto3 داخل image: 1.43.58

PostgreSQL تست محلی و CI از 16.14 به `18.4-alpine3.24` ارتقا یافت تا با Neon
هم‌نسخه باشد. mount داده Docker نیز مطابق ساختار جدید PostgreSQL 18 به
`/var/lib/postgresql` منتقل شد.

## rollback

برای rollback کد:

1. release قبلی deploy شود.
2. اگر schema باید برگردد، ابتدا backup تازه گرفته شود.
3. downgrade فقط روی branch staging یا clone ایزوله تمرین شود.
4. سپس revision هدف با Alembic اجرا شود.

برای rollback فایل:

- URLهای قدیمی تا پایان verification حذف نمی‌شوند.
- manifest migration نگه داشته می‌شود.
- objectهای bucket بعد از deploy قبلی نیز مستقل از lifecycle کانتینر می‌مانند.
- حذف source قدیمی فقط پس از تأیید checksum و نمایش صحیح در اپ مجاز است.

## موارد بعدی

- bucket production باید در زمان انتشار عمومی از staging جدا شود.
- برای production بهتر است یک دامنه asset مستقل جلوی endpoint storage باشد.
- credential هر محیط باید فقط به bucket همان محیط دسترسی read/write داشته
  باشد.
- lifecycle برای probeها و orphanها در فاز عملیات تنظیم شود.
- ویدیوهای پولی در فاز رسانه باید URL امضاشده و entitlement واقعی داشته باشند.
