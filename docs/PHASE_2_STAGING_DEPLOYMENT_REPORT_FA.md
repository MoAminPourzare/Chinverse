# گزارش اجرای مرحلهٔ ۲ برنامهٔ آمادگی انتشار — staging با SHA دقیق

**آخرین به‌روزرسانی:** ۲۰۲۶-۰۹-۰۸ (پس از cleanup نهایی fixture و بازآزمایی live)
**شاخه:** `codex/phase-8-beta-release`  
**SHA والد هنگام شروع:** `70f649ef563e7b320e5980451c19bab44eb6b965`  
**release SHA اجرایی:** `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`
**وضعیت فعلی:** ✅ مرحلهٔ ۲ بسته شد؛ deploy هم‌SHA، health/readiness، smoke رسانه و cleanup نهایی تأیید شده‌اند

**آخرین release functional:** `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`
 (deploy و smoke روی همین SHA). این به‌روزرسانی گزارش docs-only است و release اجرایی
 را عوض نمی‌کند.

## نتیجهٔ کوتاه

در snapshot نهایی، Quality Gates، Vercel deployment status و HF Space برای SHA
`98918b607fd67b3e6c3f6d08de354fbcb86e1759` سبز هستند. backend زنده همین SHA را
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
| ۲.۱ ممیزی SHA و providerها | ✅ | remote و providerها روی SHA نهایی؛ Quality Gates run `32902615699` سبز |
| ۲.۲ ایمن‌سازی target دیتابیس | ✅ | config guard، readiness contract و live `database_target=ok` |
| ۲.۳ smoke خودکار staging | ✅ | smoke run `32902615687` موفق؛ group بر اساس release SHA ایزوله است |
| ۲.۴ تنظیم Trusted Publisher و متغیرهای Space | ✅ | با تأیید صاحب پروژه، publisher دقیق و endpoint guard غیرمحرمانه ثبت شد |
| ۲.۵ deploy backend/frontend SHA نهایی | ✅ | HF deploy run `32902615713` موفق؛ Vercel deployment status در smoke تأیید شد |
| ۲.۶ smoke زنده و cleanup | ✅ | synthetic auth/chat/RBAC، signed playback/entitlement و cleanup fixture سبز |

## هویت immutable release مشاهده‌شده

| مورد | provider/URL | run/deployment | SHA گزارش‌شده | نتیجه |
|---|---|---|---|---|
| Git remote | `origin/codex/phase-8-beta-release` | branch head at deploy | `98918b607fd67b3e6c3f6d08de354fbcb86e1759` | ✅ |
| Quality Gates | GitHub Actions | run `32902615699` | `98918b607fd67b3e6c3f6d08de354fbcb86e1759` | ✅ |
| frontend deployment metadata | GitHub deployment status → Vercel | smoke run `32902615687` | source SHA=`98918b6...`; status=`success` | ✅؛ URL از `status.target_url` resolve شد |
| frontend branch URL | `chinverse-git-codex-phase-8-beta-release-death-stroke.vercel.app` | Vercel Git integration | protected preview | ✅ anonymous=`302` و `X-Robots-Tag: noindex` |
| backend deploy | GitHub Actions → HF Space | run `32902615713` | `98918b607fd67b3e6c3f6d08de354fbcb86e1759` | ✅ |
| backend live | `moamin9-chinverse-api.hf.space/health` | Space فعلی | `98918b607fd67b3e6c3f6d08de354fbcb86e1759` | ✅ |

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
| ۲۰۲۶-۰۸-۲۶ UTC | backend `/health` | `200`, tier=`staging`, indexable=`false`, release=`98918b6...` | ✅ |
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
- HF deploy/restart: run `32902615713` موفق؛ readiness live سبز؛
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
- load smoke نهایی (read-only): `15` درخواست، `0` خطا، `p95=430.243ms` و
  `rps=1.035`.

## معیار پذیرش و حکم snapshot پیش از cleanup (تاریخی)

- [x] backend و Vercel deployment metadata برای SHA دقیق یکسان‌اند؛ frontend runtime
  health به‌دلیل SSO و نبود bypass secret مشاهده نشد.
- [x] readiness زنده `database_target`, `database` و `storage` را `ok` گزارش می‌کند.
- [x] Vercel preview ناشناس محافظت‌شده و noindex است.
- [x] DB target guard و smoke contract محلی تست شده‌اند.
- [x] synthetic journeyهای auth/account/chat/RBAC اجرا و cleanup تأیید شد؛ fixtureهای
  نقش‌دار Phase 4 به secretهای owner وابسته و skipped هستند.
- [ ] signed playback روی یک lesson رایگان منتشرشده live اثبات شود یا نبود داده
  به‌عنوان تصمیم صریح acceptance ثبت شود.

**نتیجهٔ آن snapshot:** 🔶. استقرار same-SHA و smoke فنی تکمیل و قابل تکرار است؛
دو blocker صریح باقی است: (۱) مشاهدهٔ frontend `/api/health` نیازمند افزودن
`VERCEL_AUTOMATION_BYPASS_SECRET` به GitHub Environment، بدون تغییر protection؛
(۲) catalog staging خالی است، بنابراین signed playback/entitlement روی lesson
منتشرشده قابل اثبات نیست. تا رفع این دو مورد، این مرحله از نظر فنی آمادهٔ ادامه
است اما به‌عنوان ✅ نهایی اعلام نمی‌شود.

برای دستورهای دقیق مالک و ادامهٔ امن پس از قطع نشست، به
[چک‌لیست بستن مرحلهٔ ۲](E:/Chinverse/docs/PHASE_2_CLOSEOUT_CHECKLIST_FA.md) مراجعه
کن.

## checkpoint زنده — ۲۰۲۶-۰۹-۰۸

این بخش جایگزین وضعیت قدیمی «catalog خالی» در گزارش بالاست؛ مرحله هنوز 🔶 است.

- release مشاهده‌شده: `2990678545200f76e4724fb1e46f047d0381dc56`، فقط staging.
- سه run موفق: Quality `34212336448`، HF `34212336438` و smoke `34212336460`.
- `/health/ready`: database_target/database/storage همگی `ok`.
- دورهٔ مصنوعی 69 با slug `phase2-closeout-bf4059d` واقعاً published است؛ section 69، lesson 205، video asset 1، cover asset 2 و subtitle track 1.
- GET عمومی playback درس 205: entitlement.granted=true، reason=free_lesson؛ زیرنویس fa نسخهٔ 1 published است.
- دریافت واقعی URL امضاشده با Range: HTTP 206، video/mp4، `bytes 0-31/96139` و 32 بایت؛ توکن در گزارش ذخیره نشده است. این شاهد MP4 است، نه HLS.
- پیام خطای انتشار کاور در پنل به معنی شکست انتشار نبود: وضعیت DB پس از آن published بود. پاسخ publish/archive دوره، رابطهٔ sections/lessons را eager-load نمی‌کرد؛ اصلاح شد و 8 تست media publish محلی پاس شد.
- نشست مرورگر قبلی اکنون `Browser is not available: 1` می‌دهد؛ ورود admin/MFA قبلاً توسط مالک انجام شده، اما دسترسی همان نشست در این checkpoint قابل استفاده نیست.
- هنوز لازم است: deploy اصلاح پاسخ انتشار، مشاهدهٔ frontend health داخلی برای SHA نهایی، smoke کاربر عادی و cleanup دقیق fixture فوق و بررسی catalog/playback پس از cleanup. سبز بودن workflow به‌تنهایی اثبات اجرای همهٔ stepهای اختیاری نیست.
- فایل‌های HF مختص fixture: `phase2-closeout-cover.png` و `phase2-closeout-video.mp4`. فعلاً حذف نشده‌اند؛ دوره یا asset تکراری نسازید. production و main تغییر نکرده‌اند.

### checkpoint پنل ادمین — ۲۰۲۶-۰۹-۰۸

- ورود admin با MFA روی staging توسط مالک انجام و پنل زنده مشاهده شد.
- پنل سه کاربر را لود کرد، اما course/dictionary collectionها صفر و هشدار partial-load نشان دادند.
- علت در BFF frontend بود: Node fetch بدنهٔ gzip/br را decode می‌کرد ولی `Content-Length` فشردهٔ upstream بدون `Content-Encoding` به مرورگر forward می‌شد؛ پاسخ‌های JSON بزرگ ناقص می‌شدند.
- BFF اکنون برای بدنهٔ decodeشده آن طول stale را حذف می‌کند؛ ۱۰ تست proxy، lint و typecheck محلی موفق‌اند. پس از deploy باید همان نشست refresh و course 69/lesson 205 در پنل مشاهده شود.
- بازآزمایی زنده موفق بود: هشدار partial-load حذف شد و پنل 69 دوره، 205 درس، 300 کلمه و دورهٔ `phase2-closeout-bf4059d` را نشان داد.
- frontend داخلی `/api/health` در نشست SSO با `status=ok`، tier=`staging`، `indexable=false` و SHA `474d33306e7c0f4fe986650e946f32a9a3587c8d` مشاهده شد.
- چون deploy HF قبلاً frontend-only commitها را نادیده می‌گرفت، exact-SHA smoke برای `474d333...` بدون backend هم‌SHA معطل می‌ماند. مسیر `frontend/**` به trigger deploy staging اضافه شد تا نامزدهای release همیشه روی هر دو provider یک SHA داشته باشند.

### checkpoint آمادهٔ cleanup — ۲۰۲۶-۰۹-۰۸

- release کاربردی نهایی: `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`.
- [Quality Gates `34215969535`](https://github.com/MoAminPourzare/Chinverse/actions/runs/34215969535)، [HF deploy `34215969479`](https://github.com/MoAminPourzare/Chinverse/actions/runs/34215969479)، [exact-SHA smoke `34215969552`](https://github.com/MoAminPourzare/Chinverse/actions/runs/34215969552) و Vercel deployment همگی success هستند.
- backend `/health` و frontend `/api/health` هر دو همین SHA، tier=`staging` و `indexable=false` را گزارش کردند؛ readiness دیتابیس و storage نیز ok است.
- smoke جداگانه با یک حساب عادی تصادفی روی همین SHA تمام checkهای signup، normal-user، RBAC 403، catalog، lesson 205 playback، free entitlement، subtitle fa published، مخفی‌بودن provider URL و Range 206 را پاس کرد؛ حساب در finally حذف و 401 پس از حذف تأیید شد.
- آخرین کار باز فقط cleanup fixture دقیق است: course/section 69، lesson 205، subtitle track 1، media assets 1/2 و دو فایل `phase2-closeout-video.mp4` و `phase2-closeout-cover.png`. چون این حذف دائمی دادهٔ ابری است، پیش از اجرای آن تأیید صریح لحظهٔ حذف لازم است.
- مالک در ۲۰۲۶-۰۹-۰۸ حذف دقیق موارد بالا را تأیید کرد. اجرای UI قبل از هر mutation در صفحهٔ ورود Neon متوقف شد، چون پروفایل Chrome فعلی نشست Neon ندارد؛ کاربر باید فقط ورود را انجام دهد و تب SQL Editor شاخهٔ staging را باز بگذارد. هیچ داده‌ای تا این checkpoint حذف نشده است.

### checkpoint نهایی بسته‌شدن مرحلهٔ ۲ — ۲۰۲۶-۰۹-۰۸

- مقصد mutation با مشاهدهٔ UI تأیید شد: پروژهٔ Neon `twilight-unit-31615795`، branch=`staging`، branch ID=`br-shiny-darkness-at6obb2e` و endpoint=`ep-wild-band-atse2yoq`. production branch در این کار لمس نشد.
- تراکنش محافظت‌شدهٔ Neon با guardهای دقیقِ id، slug، title، رابطه‌ها و checksum اجرا و commit شد. نتیجهٔ query نهایی: `course_rows=0`، `section_rows=0`، `lesson_rows=0`، `subtitle_rows=0` و `media_rows=0`.
- فقط دو فایل fixture با نام‌های `phase2-closeout-cover.png` و `phase2-closeout-video.mp4` از bucket خصوصی `MoAmin9/chinverse-api-storage` حذف شدند؛ پس از refresh، UI مقدار `0 Bytes` و `0 files` را نشان داد. bucket و فایل دیگری حذف نشد.
- بازآزمایی عمومی backend روی release `8ba6fc1bba12589f2c2b5bd48ad5d93ea5a7be18`: `/health=200` با tier=`staging` و `indexable=false`؛ `/health/ready=200` با `database_target/database/storage=ok`؛ slug دورهٔ fixture و playback درس 205 هر دو `404` شدند.
- signed playback و entitlement پیش از cleanup روی lesson رایگان منتشرشده با Range `206` و subtitle فارسی ثبت شده بود؛ پس از cleanup، نبود course/playback و خالی بودن storage تأیید شد. این ترتیب هم قابلیت رسانه و هم پاک‌سازی را اثبات می‌کند.
- **حکم نهایی:** مرحلهٔ ۲ برنامهٔ آمادگی انتشار `✅` است. شرط‌های health/readiness، هم‌هویتی SHA، حفاظت/noindex، smoke سفرهای اصلی، اثبات رسانه و cleanup همگی ثبت شده‌اند. release هنوز برای production عمومی آماده اعلام نمی‌شود؛ مرحلهٔ بعدی برنامه، مرحلهٔ ۳ عملیات است.

## الحاقیهٔ پیگیری قدیمی — اصلاح workflow

- job اصلی `readonly-preflight` اکنون به GitHub Environment به نام `staging` متصل
  است؛ بنابراین اگر `VERCEL_AUTOMATION_BYPASS_SECRET` در همان Environment ثبت شود،
  health داخلی frontend واقعاً قابل مشاهده خواهد بود.
- resolve کردن deployment همچنان بر اساس metadata/status همان SHA انجام می‌شود و
  branch alias متحرک عمداً قابل‌قبول نیست.
- commit `88dbd6f` و Quality Gates آن سبز و push شده‌اند؛ هیچ secret، DB، storage یا
  production در این اصلاح لمس نشده است.
- اجرای live نهایی هنوز تا انجام دو اقدام مالک متوقف است: ثبت bypass secret و
  اجرای workflow دستی، و ساخت یک fixture رسانهٔ synthetic در Neon staging برای
  اثبات signed playback/entitlement (یا ثبت تصمیم صریح `accepted-empty-catalog`).
