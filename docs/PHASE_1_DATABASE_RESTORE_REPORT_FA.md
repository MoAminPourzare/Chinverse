# گزارش اجرای فاز ۱ — migration، backup و restore ایزوله

**تاریخ ثبت:** ۲۵ اوت ۲۰۲۶ (آزمایش‌های DB در UTC روز ۲۴ اوت ثبت شده‌اند)
**شاخه:** `codex/phase-8-beta-release`
**head مورد انتظار:** `f8a1b2c3d4e5`
**commit ثبت‌کننده:** `f39a8d56b69a136d7cfe333711a9996985cc8964`

## نتیجهٔ کوتاه

بخش فنی و محلی فاز ۱ با یک PostgreSQL کاملاً جدا از دیتابیس پروژه اجرا شد:

- چرخهٔ fresh upgrade، downgrade تا `base` و upgrade مجدد تا head موفق بود.
- backup سفارشی PostgreSQL و restore روی یک دیتابیس مستقل موفق بود و sentinel
  مصنوعی پس از restore قابل‌خواندن بود.
- `alembic check` و verifierهای schema فازهای ۲، ۳، ۴، ۵، ۷ و ۸ روی source و
  target سبز شدند.
- تست integration واقعی روی DB PostgreSQL اجرا شد؛ بعد از اصلاح یک خطای واقعی
  در مسیر retry وبهوک پرداخت، کل suite برابر `30 passed` شد.
- دیتابیس موجود `chinverse_db` و هر دیتابیس production در این آزمایش استفاده یا
  تغییر داده نشد.

وضعیت کلی فاز هنوز **🔶** است، چون ساخت/تأیید branchهای Neon و retention/restore
در provider به دسترسی مالک نیاز دارد و در این نشست انجام نشده است.

## محیط ایزوله

| مورد | مقدار |
|---|---|
| PostgreSQL | native PostgreSQL 18.1 روی `127.0.0.1:55432` |
| data directory | `E:\Chinverse\phase1-postgres-20260824-233956` (موقت) |
| source database | `chinverse_phase1` |
| integration database | `chinverse_test` |
| restore database | `chinverse_phase1_restore` |
| head نهایی | `f8a1b2c3d4e5` |
| تعداد جدول‌های public در head | ۶۱ |

Docker Desktop در زمان اجرای اولیه daemon نداشت (`npipe docker_engine` در
دسترس نبود). برای قابل‌تکرار ماندن مسیر، wrapperهای repository به‌صورت اختیاری
حالت `-PostgresClientDirectory` دارند و همان binaryهای رسمی PostgreSQL
(`pg_dump`, `pg_restore`, `psql`) را مستقیم اجرا می‌کنند؛ مسیر Docker پیش‌فرض
همچنان حفظ شده است.

## migration evidence

در source ایزوله، `alembic upgrade head` تا `f8a1b2c3d4e5` رسید. سپس چرخهٔ زیر
اجرا شد:

| عملیات | نتیجه |
|---|---|
| `alembic downgrade base` | exit 0، حدود ۳۴۳۱ ms |
| بررسی پس از downgrade | هیچ revisionی باقی نماند؛ فقط `alembic_version` باقی بود |
| `alembic upgrade head` | exit 0، حدود ۴۴۸۵ ms |
| `alembic check` پس از rebuild | exit 0، `No new upgrade operations detected` |

یک harness مستقل روی PostgreSQL native نیز همین ترتیب را با زمان‌های UTC زیر
تکرار کرد: fresh upgrade از `20:10:19.616Z` تا `20:10:23.192Z`، downgrade از
`20:11:07.832Z` تا `20:11:12.343Z` و re-upgrade از `20:11:15.872Z` تا
`20:11:21.276Z`؛ هر سه exit 0 بودند.

## backup و restore evidence

backup با format سفارشی و بدون owner/ACL ساخته شد و به target مستقل restore شد.
برای اثبات قابل‌ردیابی بودن restore، یک subscription plan مصنوعی با نام
`phase1-restore-sentinel` پیش از dump درج و پس از restore خوانده شد؛ این داده
پس از آزمایش پاک‌سازی شد و بخشی از دادهٔ کاربر نیست.

| مورد | نتیجه |
|---|---|
| dump | `C:\Users\Asus\AppData\Local\Temp\chinverse-phase1-native-20260824.dump` |
| شروع backup (UTC) | `2026-08-24T20:24:09.0446906Z` |
| پایان backup (UTC) | `2026-08-24T20:24:09.4866293Z` |
| exit backup | 0 |
| اندازه | ۲۵۴٬۷۲۱ bytes |
| SHA-256 | `4ca794d54ce393e4143cde3b79f4a2b5c985e4ec302624f22045bb088aa6ba15` |
| شروع restore (UTC) | `2026-08-24T20:24:10.0661533Z` |
| پایان restore (UTC) | `2026-08-24T20:24:11.4377554Z` |
| exit restore / ANALYZE | 0 / 0 |
| نتیجهٔ target | head=`f8a1b2c3d4e5`، جدول‌ها=۶۱، sentinel پیدا شد |

### اجرای wrapper با client native

پس از اضافه‌شدن حالت اختیاری native، خود wrapperها نیز روی همین کلاستر اجرا
شدند:

| مورد | نتیجه |
|---|---|
| backup wrapper | exit 0، `2026-08-24T20:30:08.5479335Z` تا `20:30:09.5172630Z` |
| restore wrapper | exit 0، `2026-08-24T20:30:09.5282662Z` تا `20:30:13.1246664Z` |
| revision metadata | `f8a1b2c3d4e5` |
| client mode metadata | `native` |
| SHA-256 wrapper dump | `b57e4c98f2fb1c6ace0cc37b22eb9583cf6f496916962054147a6ae09752f40f` |

نمونهٔ اجرای محلی:

```powershell
pwsh -File .\scripts\backup-database.ps1 `
  -DatabaseUrl $SOURCE_URL -OutputDirectory $TEMP_DIR `
  -PostgresClientDirectory 'D:\PostgreSQL\18\bin'

pwsh -File .\scripts\restore-database.ps1 -DumpPath $DUMP_PATH `
  -MetadataPath "$DUMP_PATH.json" -TargetDatabaseUrl $TARGET_URL `
  -ConfirmIsolatedTarget -AllowSameHost `
  -PostgresClientDirectory 'D:\PostgreSQL\18\bin'
```

فرمان‌های قابل‌بازسازی (با جایگزین‌کردن URLهای ایزوله و مسیر dump) عبارت‌اند از:

```powershell
pg_dump --dbname="$SOURCE_URL" --schema=public --format=custom --compress=9 `
  --no-owner --no-acl --file="$DUMP_PATH"

pg_restore --dbname="$TARGET_URL" --clean --if-exists --no-owner --no-acl `
  --exit-on-error --single-transaction "$DUMP_PATH"
psql "$TARGET_URL" -v ON_ERROR_STOP=1 -c "ANALYZE"
```

هر دو wrapper checksum، revision، جلوگیری از restore روی source، و الزام
`-ConfirmIsolatedTarget` را حفظ می‌کنند. اجرای Docker در CI هنوز باید در محیط
خود CI مشاهده شود؛ اما نبودن Docker محلی دیگر مانع اجرای reproducible native
نیست.

## schema و integration evidence

روی source و target، خروجی‌های زیر exit 0 داشتند:

- `alembic check`
- `scripts/verify_phase2_schema.py`
- `scripts/verify_phase3_schema.py`
- `scripts/verify_phase4_schema.py`
- `scripts/verify_phase5_schema.py`
- `scripts/verify_phase7_schema.py`
- `scripts/verify_phase8_schema.py`

تست‌ها:

| suite | نتیجه |
|---|---|
| `tests/integration/test_phase8_beta_payment_flow.py` | ۲ از ۲ پاس روی DB واقعی |
| کل تست‌های integration | `30 passed, 174 deselected` |
| migration graph و unitهای فاز ۸ | `15 passed` |
| Ruff برای service و تست جدید | pass با `--no-cache` |

تست جدید جریان invite → redeem → consent → feedback و idempotency وبهوک پرداخت
را با `AsyncSession` واقعی پوشش می‌دهد؛ این evidence در سطح service/DB است و
جایگزین smoke تست HTTP و احراز هویت روی staging نیست.

در مسیر duplicate وبهوک، کد قبلی پس از `rollback()` به `event.status` دسترسی
داشت و در SQLAlchemy async خطای `MissingGreenlet` می‌داد. مقدار status پیش از
rollback ذخیره شد و تست retry این regression را تثبیت می‌کند.

## cleanup و مرزهای ایمنی

- دیتابیس‌های موقت harness روی port 5432 پس از بررسی connection حذف شدند؛
  `chinverse_db` حذف یا تغییر نکرد.
- target و data directory روی port 55432 پس از پایان آزمایش متوقف و حذف شدند؛
  dumpهای native موقت نیز پس از ثبت SHA/metadata پاک شدند و binary به Git
  اضافه نشد.
- هیچ migration، restore یا write روی Neon/production انجام نشده است.

## اولین blocker باقی‌مانده

صاحب پروژه باید در provider:

1. branch جدا برای Neon staging و production بسازد یا وجود آن را با نام و SHA
   ثبت کند؛
2. retention، نقطهٔ restore و یک restore آزمایشی را ثبت کند؛
3. در صورت نیاز، یک اجرای wrapperهای Dockerی backup/restore را در CI نیز ثبت
   کند؛ این مورد برای local evidence مانع نیست.

تا ثبت این موارد، فاز ۱ از نظر local database سبز است اما از نظر release
evidence کامل بسته نمی‌شود و نباید به‌عنوان تأیید migration روی production
تفسیر شود.
