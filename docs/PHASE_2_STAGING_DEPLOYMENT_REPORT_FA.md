# گزارش اجرای مرحلهٔ ۲ برنامهٔ آمادگی انتشار — staging با SHA دقیق

**آخرین به‌روزرسانی:** ۲۰۲۶-۰۸-۲۶ ۰۱:۳۰ UTC / ۲۰۲۶-۰۸-۲۶ ۰۵:۰۰ Asia/Tehran
**شاخه:** `codex/phase-8-beta-release`  
**SHA والد هنگام شروع:** `70f649ef563e7b320e5980451c19bab44eb6b965`  
**release SHA نهایی این snapshot:** `f3a17a7fac12bb63481a9d648d57e264c0d78e86`
**وضعیت:** 🔶 شواهد staging و smoke فنی سبز؛ پذیرش کامل به‌دلیل health داخلی frontend و نبود lesson منتشرشده هنوز بسته نشده است

## نتیجهٔ کوتاه

در snapshot نهایی، Quality Gates، Vercel deployment status و HF Space برای SHA
`f3a17a7fac12bb63481a9d648d57e264c0d78e86` سبز هستند. backend زنده همین SHA را
گزارش می‌کند و readiness واقعیِ هدف Neon، PostgreSQL و storage متصل به `/data`
را `ok` برمی‌گرداند. smoke exact-SHA نیز با موفقیت تمام شده است.

پیش‌نمایش Vercel همچنان عمداً پشت SSO است و anonymous=`302` با
`X-Robots-Tag: noindex` می‌دهد. چون `VERCEL_AUTOMATION_BYPASS_SECRET` در GitHub
تعریف نشده، workflow health داخلی frontend را دور نمی‌زند و آن را **مشاهده‌نشده**
ثبت می‌کند؛ این محدودیت به‌عنوان blocker پذیرش باقی مانده، نه اینکه با تضعیف
حفاظت حل شود.

پیش از retry، یک guard fail-closed به backend اضافه شد: runtime staging در حالت
release فقط وقتی بالا می‌آید که `DATABASE_URL` به endpoint غیرمحرمانه و pinشدهٔ
Neon staging اشاره کند. `/health/ready` نیز نتیجهٔ این کنترل را با
`database_target=ok` گزارش می‌کند. به این ترتیب migration آغاز startup نمی‌تواند
بی‌صدا روی endpoint دیگری اجرا شود.

## گزارش مرحله‌ای

| گام | وضعیت | شاهد |
|---|---|---|
| ۲.۱ ممیزی SHA و providerها | ✅ | remote و providerها روی SHA نهایی؛ Quality Gates run `32901266092` سبز |
| ۲.۲ ایمن‌سازی target دیتابیس | ✅ | config guard، readiness contract و live `database_target=ok` |
| ۲.۳ smoke خودکار staging | ✅ | smoke run `32901266161` موفق؛ group بر اساس release SHA ایزوله است |
| ۲.۴ تنظیم Trusted Publisher و متغیرهای Space | ✅ | با تأیید صاحب پروژه، publisher دقیق و endpoint guard غیرمحرمانه ثبت شد |
| ۲.۵ deploy backend/frontend SHA نهایی | ✅ | HF deploy run `32901266138` موفق؛ Vercel deployment status در smoke تأیید شد |
| ۲.۶ smoke زنده و cleanup | ✅ فنی / 🔶 رسانه | synthetic auth/chat/RBAC و cleanup سبز؛ catalog خالی و frontend runtime پشت SSO |

## هویت immutable release مشاهده‌شده

| مورد | provider/URL | run/deployment | SHA گزارش‌شده | نتیجه |
|---|---|---|---|---|
| Git remote | `origin/codex/phase-8-beta-release` | branch head | `f3a17a7fac12bb63481a9d648d57e264c0d78e86` | ✅ |
| Quality Gates | GitHub Actions | run `32901266092` | `f3a17a7fac12bb63481a9d648d57e264c0d78e86` | ✅ |
| frontend deployment metadata | GitHub deployment status → Vercel | smoke run `32901266161` | source SHA=`f3a17a7...`; status=`success` | ✅؛ URL از `status.target_url` resolve شد |
| frontend branch URL | `chinverse-git-codex-phase-8-beta-release-death-stroke.vercel.app` | Vercel Git integration | protected preview | ✅ anonymous=`302` و `X-Robots-Tag: noindex` |
| backend deploy | GitHub Actions → HF Space | run `32901266138` | `f3a17a7fac12bb63481a9d648d57e264c0d78e86` | ✅ |
| backend live | `moamin9-chinverse-api.hf.space/health` | Space فعلی | `f3a17a7fac12bb63481a9d648d57e264c0d78e86` | ✅ |

Alias عمومی `chinverse.vercel.app` نیز هنگام ممیزی SHA قدیمی
`bd7b016edede215885f495370b1976a230d3a996` را گزارش می‌کرد و target مرحلهٔ ۲
نیست. در این مرحله production domain یا `main` promote نمی‌شود.

## جداسازی محیط و provider

| کنترل | شاهد فعلی | نتیجه |
|---|---|---|
| Neon staging | branch=`br-shiny-darkness-at6obb2e`، endpoint=`ep-wild-band-atse2yoq`؛ مقدار secret جاری مشاهده نشد | ✅ live guard در readiness=`ok` |
| جلوگیری از migration روی DB اشتباه | `STAGING_DATABASE_ENDPOINT_ID` برای release staging اجباری و host مستقیم/pooler Neon دقیقاً match می‌شود | ✅ live |
| storage staging | bucket متصل `MoAmin9/chinverse-api-storage`، دسترسی Read & Write، mount=`/data` | ✅ تنظیم provider مشاهده شد |
| storage mode | public variableهای Space: `FILE_STORAGE_MODE=mounted` و `MOUNTED_STORAGE_ROOT=/data` | ✅ مشاهده شد |
| probe واقعی storage | readiness live write/read/delete واقعی انجام می‌دهد | ✅ |
| production isolation | production runtime/DB/storage در این نشست لمس نشد | ✅ عدم mutation؛ inventory provider production هنوز مرحلهٔ مالک‌محور است |

هیچ DSN، password، token، cookie یا bypass secret در این گزارش یا artifact ثبت
نشده است.

## health و readiness

| زمان ممیزی | endpoint | HTTP/فیلدهای مشاهده‌شده | نتیجه |
|---|---|---|---|
| ۲۰۲۶-۰۸-۲۶ UTC | backend `/health` | `200`, tier=`staging`, indexable=`false`, release=`f3a17a7...` | ✅ |
| ۲۰۲۶-۰۸-۲۶ UTC | backend `/health/ready` | `200`, `database_target=ok`, `database=ok`, `storage=ok` | ✅ |
| ۲۰۲۶-۰۸-۲۶ UTC | protected Vercel preview | anonymous `302`, `X-Robots-Tag: noindex` | ✅ edge protection |
| ۲۰۲۶-۰۸-۲۶ UTC | frontend `/api/health` | bypass secret موجود نیست؛ preview SSO باقی است | 🔶 مشاهده‌نشده، بدون bypass |

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
| ورود و حساب | ✅ | `phase2_backend_live_smoke.py` با identity تصادفی؛ حذف و 401 نهایی |
| آموزش/رسانه | 🔶 empty-state | catalog زنده `200 []` است؛ empty-state معتبر است ولی signed playback live اثبات نشده |
| چت/WebSocket | ✅ | HTTP conversations و WebSocket `connection:ready`/`pong` سبز |
| feedback | ✅ | `/beta/status`: `enabled=false`, `eligible=false`, `reason=disabled` |
| admin/RBAC | ✅ محدود | normal user روی `/admin/users`، HTTP `403`؛ admin MFA fixture اجرا نشده |
| پاک‌سازی | ✅ | account deletion و درخواست بعدی `/users/me`، HTTP `401` |

stateful Phase 4 fixture همچنان فقط با Environment محافظت‌شدهٔ GitHub و secretهای
staging اجرا می‌شود و در این نشست به‌دلیل نبود secretها skipped است. برای پوشش
بدون secret، اسکریپت محدود `phase2_backend_live_smoke.py` با یک حساب تصادفی اجرا
شد؛ credential/token چاپ نشد و cleanup باطل‌شدن token را هم اثبات کرد.

## تغییرات خارجی و مرز ایمنی

تغییرهای خارجی تأییدشده در این snapshot:

- HF Trusted Publisher: repository=`MoAminPourzare/Chinverse`،
  branch=`codex/phase-8-beta-release` و workflow=`deploy-hf-space.yml` ثبت شد؛
- HF public variable: `STAGING_DATABASE_ENDPOINT_ID=ep-wild-band-atse2yoq`
  ثبت شد؛ هیچ secret مشاهده یا تغییر نکرد؛
- HF deploy/restart: run `32901266138` موفق؛ readiness live سبز؛
- Vercel configuration/bypass: تغییر نکرده؛
- Neon branch/schema/data: تغییر نکرده؛
- fixture/user/chat data: یک synthetic account موقت ساخته و با موفقیت حذف شد؛
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
- smoke backend نهایی: `passed=true`؛ checkهای health/readiness/signup/login/account/
  beta/chat HTTP/chat WebSocket/RBAC/cleanup همگی `true`.
- load smoke نهایی (read-only): `15` درخواست، `0` خطا، `p95=924.299ms` و
  `rps=1.034`.

## معیار پذیرش و حکم فعلی

- [x] backend و Vercel deployment metadata برای SHA دقیق یکسان‌اند؛ frontend runtime
  health به‌دلیل SSO و نبود bypass secret مشاهده نشد.
- [x] readiness زنده `database_target`, `database` و `storage` را `ok` گزارش می‌کند.
- [x] Vercel preview ناشناس محافظت‌شده و noindex است.
- [x] DB target guard و smoke contract محلی تست شده‌اند.
- [x] synthetic journeyهای auth/account/chat/RBAC اجرا و cleanup تأیید شد؛ fixtureهای
  نقش‌دار Phase 4 به secretهای owner وابسته و skipped هستند.
- [ ] signed playback روی یک lesson رایگان منتشرشده live اثبات شود یا نبود داده
  به‌عنوان تصمیم صریح acceptance ثبت شود.

**نتیجهٔ فعلی مرحلهٔ ۲:** 🔶. استقرار same-SHA و smoke فنی تکمیل و قابل تکرار است؛
دو blocker صریح باقی است: (۱) مشاهدهٔ frontend `/api/health` نیازمند افزودن
`VERCEL_AUTOMATION_BYPASS_SECRET` به GitHub Environment، بدون تغییر protection؛
(۲) catalog staging خالی است، بنابراین signed playback/entitlement روی lesson
منتشرشده قابل اثبات نیست. تا رفع این دو مورد، این مرحله از نظر فنی آمادهٔ ادامه
است اما به‌عنوان ✅ نهایی اعلام نمی‌شود.
