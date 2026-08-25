# گزارش اجرای مرحلهٔ ۲ برنامهٔ آمادگی انتشار — staging با SHA دقیق

**آخرین به‌روزرسانی:** ۲۰۲۶-۰۸-۲۴ ۲۱:۰۵ UTC / ۲۰۲۶-۰۸-۲۵ ۰۰:۳۵ Asia/Tehran  
**شاخه:** `codex/phase-8-beta-release`  
**SHA والد هنگام شروع:** `70f649ef563e7b320e5980451c19bab44eb6b965`  
**release SHA نهایی:** پس از commit/push و promotion ثبت می‌شود  
**وضعیت:** 🔶 در حال اجرا؛ هنوز معیار پذیرش کامل نشده است

## نتیجهٔ کوتاه

فرانت‌اندِ SHA والد روی Vercel ساخته شده، ولی backend زنده هنوز release قدیمی را
گزارش می‌کند؛ بنابراین در این snapshot ادعای same-SHA staging نداریم. blocker
mirror در Hugging Face به Trusted Publisher شاخهٔ فاز ۸ محدود شد و فرم آن آماده
است، اما چون این تغییر دسترسی دائمی CI می‌سازد تا تأیید لحظه‌ای صاحب Space submit
نشده است.

پیش از retry، یک guard fail-closed به backend اضافه شد: runtime staging در حالت
release فقط وقتی بالا می‌آید که `DATABASE_URL` به endpoint غیرمحرمانه و pinشدهٔ
Neon staging اشاره کند. `/health/ready` نیز نتیجهٔ این کنترل را با
`database_target=ok` گزارش می‌کند. به این ترتیب migration آغاز startup نمی‌تواند
بی‌صدا روی endpoint دیگری اجرا شود.

## گزارش مرحله‌ای

| گام | وضعیت | شاهد |
|---|---|---|
| ۲.۱ ممیزی SHA و providerها | ✅ | remote و local روی SHA والد؛ Quality Gates run `32774924447` سبز |
| ۲.۲ ایمن‌سازی target دیتابیس | ✅ محلی | config guard، readiness contract و ۴۳ تست هدفمند سبز |
| ۲.۳ smoke خودکار staging | ✅ آمادهٔ اجرا | workflow جدید exact-SHA با hostهای ثابت و secret audience محدود |
| ۲.۴ تنظیم Trusted Publisher و متغیرهای Space | ✅ | با تأیید صاحب پروژه، publisher دقیق و endpoint guard غیرمحرمانه ثبت شد |
| ۲.۵ deploy backend/frontend SHA نهایی | ⏳ | پس از ۲.۴ و push SHA نهایی |
| ۲.۶ smoke زنده و cleanup | ⏳ | preflight خودکار؛ stateful با GitHub Environment=`staging` |

## هویت immutable release مشاهده‌شده

| مورد | provider/URL | run/deployment | SHA گزارش‌شده | نتیجه |
|---|---|---|---|---|
| Git remote | `origin/codex/phase-8-beta-release` | branch head | `70f649ef563e7b320e5980451c19bab44eb6b965` | ✅ هنگام شروع |
| Quality Gates | GitHub Actions | run `32774924447` | `70f649ef563e7b320e5980451c19bab44eb6b965` | ✅ |
| frontend preview | Vercel generated preview | deployment `H6RbsY5vD4HYAaNXcp1M5HmSGfyG` | commit والد | ✅ build؛ health داخلی پشت SSO |
| frontend branch URL | `chinverse-git-codex-phase-8-beta-release-death-stroke.vercel.app` | Vercel Git integration | commit والد | ✅ anonymous=`302` و `X-Robots-Tag: noindex` |
| backend deploy | GitHub Actions → HF Space | run `32774924457` | target=commit والد | ⛔ mirror شکست خورد |
| backend live | `moamin9-chinverse-api.hf.space/health` | Space فعلی | `3b3a918a66ea7df875965130ff86c7d1a1227576` | ⛔ قدیمی |

Alias عمومی `chinverse.vercel.app` نیز هنگام ممیزی SHA قدیمی
`bd7b016edede215885f495370b1976a230d3a996` را گزارش می‌کرد و target مرحلهٔ ۲
نیست. در این مرحله production domain یا `main` promote نمی‌شود.

## جداسازی محیط و provider

| کنترل | شاهد فعلی | نتیجه |
|---|---|---|
| Neon staging | سابقهٔ ثبت‌شده: branch=`br-shiny-darkness-at6obb2e`، endpoint=`ep-wild-band-atse2yoq`؛ مقدار secret جاری قابل مشاهده نیست | 🔶 guard جدید باید در deploy زنده همین endpoint را اثبات کند |
| جلوگیری از migration روی DB اشتباه | `STAGING_DATABASE_ENDPOINT_ID` برای release staging اجباری و host مستقیم/pooler Neon دقیقاً match می‌شود | ✅ محلی؛ live pending |
| storage staging | bucket متصل `MoAmin9/chinverse-api-storage`، دسترسی Read & Write، mount=`/data` | ✅ تنظیم provider مشاهده شد |
| storage mode | public variableهای Space: `FILE_STORAGE_MODE=mounted` و `MOUNTED_STORAGE_ROOT=/data` | ✅ مشاهده شد |
| probe واقعی storage | نسخهٔ جدید readiness write/read/delete واقعی انجام می‌دهد | ⏳ deploy pending |
| production isolation | production runtime/DB/storage در این نشست لمس نشد | ✅ عدم mutation؛ inventory provider production هنوز مرحلهٔ مالک‌محور است |

هیچ DSN، password، token، cookie یا bypass secret در این گزارش یا artifact ثبت
نشده است.

## health و readiness

| زمان ممیزی | endpoint | HTTP/فیلدهای مشاهده‌شده | نتیجه |
|---|---|---|---|
| ۲۰۲۶-۰۸-۲۴ UTC | backend `/health` | `200`, tier=`staging`, release=`3b3a918...` | ⛔ SHA قدیمی |
| ۲۰۲۶-۰۸-۲۴ UTC | backend `/health/ready` | `200`, `database=ok`؛ build قدیمی storage/target ندارد | ⛔ قرارداد جدید live نیست |
| ۲۰۲۶-۰۸-۲۴ UTC | protected Vercel preview | anonymous `302`, `X-Robots-Tag: noindex` | ✅ edge protection |
| پس از promotion | frontend `/api/health` + backend `/health` | باید release یکسان، tier=`staging`, indexable=`false` باشند | ⏳ |
| پس از promotion | backend `/health/ready` | باید target/database/storage همگی `ok` باشند | ⏳ |

## محافظت staging و feature flags

متغیرهای عمومی مشاهده‌شدهٔ Space عبارت‌اند از `ENVIRONMENT=production`،
`ENABLE_API_DOCS=false`، `FILE_STORAGE_MODE=mounted` و
`MOUNTED_STORAGE_ROOT=/data`. `DEPLOYMENT_TIER` ثبت نشده و مقدار fail-safe کد
`staging` است. feature flagهای اشتراک، referral، points و beta نیز در provider
ثبت نشده‌اند و مقدار پیش‌فرض همه `false` است؛ payment پیش‌فرض `disabled` است.

workflow جدید پس از deploy این قراردادها را live و فقط‌خواندنی assert می‌کند:

- preview ناشناس باید پشت SSO بماند و `noindex` بدهد؛
- frontend health و backend health باید SHA دقیق و یکسان داشته باشند؛
- `/docs` باید `404` و `/users/me` و `/beta/status` ناشناس باید `401` باشند؛
- routerهای subscription/payment/referral باید `404` باشند؛
- مسیرهای frontend اشتراک/referral/points باید به `/settings` برگردند؛
- catalog عمومی باید DTO محدودشده بدهد و field خام provider/storage نشت نکند.

## ماتریس smoke زنده

| journey | وضعیت فعلی | روش نهایی و cleanup |
|---|---|---|
| ورود و حساب | ⏳ | Phase 4 live harness با identity مصنوعی |
| آموزش/رسانه | 🔶 empty-state | catalog زنده `200 []` است؛ empty-state معتبر است ولی signed playback live اثبات نشده |
| چت/WebSocket | ⏳ | Phase 4 live harness، یک worker و بدون retry |
| feedback | ⏳ | کاربر fixture باید beta/feedback خاموش را از `/beta/status` ببیند |
| admin/RBAC/MFA | ⏳ | Phase 4 live harness با admin مصنوعی |
| پاک‌سازی | ⏳ | dry-run → apply cleanup → dry-run نهایی با `if: always()` |

stateful smoke فقط با Environment محافظت‌شدهٔ GitHub و secretهای staging اجرا
می‌شود. credentialهای لازم در محیط محلی موجود نیستند؛ workflow مقدار آن‌ها را
چاپ یا artifact نمی‌کند.

## تغییرات خارجی و مرز ایمنی

تغییرهای خارجی تأییدشده در این snapshot:

- HF Trusted Publisher: repository=`MoAminPourzare/Chinverse`،
  branch=`codex/phase-8-beta-release` و workflow=`deploy-hf-space.yml` ثبت شد؛
- HF public variable: `STAGING_DATABASE_ENDPOINT_ID=ep-wild-band-atse2yoq`
  ثبت شد؛ هیچ secret مشاهده یا تغییر نکرد؛
- HF deploy/restart: انجام نشده؛
- Vercel configuration/bypass: تغییر نکرده؛
- Neon branch/schema/data: تغییر نکرده؛
- fixture/user/chat data: ساخته نشده؛
- production DB/storage/domain و `main`: لمس نشده‌اند.

## evidence و نتایج تست

- `backend/tests/test_config.py` و `backend/tests/test_health.py`:
  `43 passed`؛ warningها فقط deprecation وابستگی و ناتوانی ساخت cache در sandbox.
- suite کامل backend بدون integration: `179 passed, 30 deselected`.
- `backend/scripts/verify_phase7_operations.py --repo-root ..`:
  `Phase 7 operational artifact verification passed`؛ syntax workflowهای YAML و
  pin بودن audience secret بررسی شد.
- workflow deployment اکنون بدون `database_target=ok` promotion را موفق اعلام
  نمی‌کند.
- workflow smoke جدید response body، token و credential را upload نمی‌کند و
  hostهای frontend/backend را از input نمی‌پذیرد.

## معیار پذیرش و حکم فعلی

- [ ] frontend و backend زنده یک release SHA گزارش کنند.
- [ ] readiness زنده `database_target`, `database` و `storage` را `ok` گزارش کند.
- [x] Vercel preview ناشناس محافظت‌شده و noindex است.
- [x] DB target guard و smoke contract محلی تست شده‌اند.
- [ ] stateful journeyها اجرا و fixtureها پاک شوند.
- [ ] signed playback روی یک lesson رایگان منتشرشده live اثبات شود یا نبود داده
  به‌عنوان تصمیم صریح acceptance ثبت شود.

**نتیجهٔ فعلی مرحلهٔ ۲:** 🔶. اولین کار باز، commit/push تغییرات و انتظار برای
deploy same-SHA و smoke خودکار است. مجوز publisher و database target guard در
provider ثبت شده‌اند.
