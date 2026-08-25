# برنامهٔ تکمیل آمادگی انتشار پس از فاز ۸

> این فایل «صفحهٔ ادامهٔ کار» پروژه است. هر نشست جدید باید ابتدا این فایل را بخواند،
> آخرین SHA و وضعیت تیک‌ها را بررسی کند و بعد فقط روی اولین کار بازشده کار کند.

**آخرین snapshot ثبت‌شده:** ۲۰۲۶-۰۸-۲۵
**شاخهٔ محلی:** `codex/phase-8-beta-release`
**commit پایهٔ پیش از اصلاحات این مرحله:** `158c686333b398d144af457ed5253080df4b8c62`
**نتیجهٔ فعلی:** مرحلهٔ ۲ از نظر deploy و smoke فنی سبز است؛ release candidate هنوز برای production عمومی آماده نیست.
**مسئول تصمیم‌های provider و دسترسی‌های بیرونی:** صاحب پروژه

## تصمیم دامنهٔ این برنامه دربارهٔ محتوا

طبق تصمیم صاحب پروژه، بررسی مالکیت و مجوز محتوای رسانه‌ای فعلاً در مسیر بحرانی
رفع blockerها قرار نمی‌گیرد و نباید باعث توقف کارهای فنی این فایل شود.

این تصمیم به‌معنای تأیید حقوقی، مجازبودن انتشار، یا تأیید شرایط providerها نیست.
محتوای تأییدنشده باید در گزارش‌ها با برچسب `deferred-by-owner` بماند و نباید
به‌عنوان «دارای مجوز» گزارش شود. اگر تصمیم صاحب پروژه تغییر کرد، audit سخت‌گیرانهٔ
فاز ۵ باید دوباره اجرا شود.

## وضعیت فعلی در یک نگاه

| حوزه | وضعیت | توضیح کوتاه |
|---|---|---|
| تست محلی | ✅ | backend non-integration: `179 passed`، frontend baseline: `84 passed`، typecheck/lint/build موفق |
| شاخه و CI | ✅ مرحلهٔ ۲ | Quality Gates نهایی run `32902615699` سبز؛ branch=`codex/phase-8-beta-release` |
| دیتابیس | 🔶 | migration/restore ایزوله روی `f8a1b2c3d4e5` سبز است؛ DB محلی `chinverse_db` و branchهای Neon هنوز جداگانه باید ثبت شوند |
| staging با همین SHA | 🔶 | backend/HF و Vercel deployment metadata روی `98918b6...` سبز؛ frontend runtime پشت SSO و catalog رسانه خالی |
| عملیات | 🔶 | load/soak، Sentry، alert/recovery، rollback و Neon restore واقعی pending است |
| موبایل واقعی | 🔶 | Android Chrome/iOS Safari، PWA واقعی و assistive technology کامل اثبات نشده‌اند |
| بتای واقعی | ⛔ | cohort، رضایت، owner بازخورد و رکورد دعوت واقعی ثبت نشده‌اند |
| پرداخت | ⏸️ | تا نصب adapter واقعی، checkout و entitlement باید خاموش بماند |
| مجوز محتوا | ⏸️ | طبق تصمیم صاحب پروژه از مسیر بحرانی این برنامه خارج شده؛ وضعیت حقوقی تأیید نشده است |

صفرهای P0/P1 در `PHASE_8_RELEASE_BLOCKERS.json` فقط یک declaration محلی هستند،
نه query زنده از issue tracker یا production. بنابراین تا وقتی evidence واقعی
ثبت نشده، «صفر» را معادل «آمادهٔ انتشار» ندانید.

## روش اجرای مرحله‌ای

این برنامه عمداً به مرحله‌های مستقل تقسیم شده است. در هر نشست فقط یک مرحله را
اجرا کن؛ پس از پایان آن، تست‌ها و evidence همان مرحله را ثبت کن و متوقف شو.
مرحلهٔ بعدی فقط وقتی شروع می‌شود که معیار پذیرش مرحلهٔ قبلی سبز باشد.

برای درخواست ادامهٔ کار، کافی است یکی از عبارت‌های زیر را بفرستی:

- «مرحلهٔ ۰ را انجام بده» — تثبیت SHA و CI/deploy
- «مرحلهٔ ۱ را انجام بده» — migration، backup و restore دیتابیس
- «مرحلهٔ ۲ را انجام بده» — deploy staging با همان SHA
- «مرحلهٔ ۳ را انجام بده» — عملیات، مانیتورینگ و rollback
- «مرحلهٔ ۴ را انجام بده» — تست واقعی موبایل و دسترس‌پذیری
- «مرحلهٔ ۵ را انجام بده» — بتای بسته و پشتیبانی
- «مرحلهٔ ۶ را انجام بده» — پرداخت و entitlement (فقط برای لانچ پولی)
- «مرحلهٔ ۷ را انجام بده» — gate نهایی و rollout مرحله‌ای

اگر گفتی «ادامه بده» بدون شماره، از **اولین مرحلهٔ تکمیل‌نشده** شروع شود.
هر مرحله باید در پایان این چهار مورد را گزارش کند: کارهای انجام‌شده، تست‌ها،
فایل‌های evidence و اولین blocker باقی‌مانده.

| مرحله | عنوان | وضعیت فعلی | پیش‌نیاز | خروجی اجباری |
|---|---|---|---|---|
| ۰ | نسخه و CI/deploy | 🔶 history/refs انجام شد؛ CI و promotion باز | دسترسی GitHub/provider | SHA remote، pipeline سبز و deploy همان SHA |
| ۱ | دیتابیس و restore | 🔶 | مرحلهٔ ۰ | local schema/restore سبز؛ Neon branch و retention مالک‌محور |
| ۲ | staging | 🔶 evidence فنی سبز؛ دو blocker باز | مرحلهٔ ۱ | health/readiness و smoke با SHA یکسان |
| ۳ | عملیات | 🔶 evidence ناقص | مرحلهٔ ۲ | Sentry، load/soak، alert و rollback evidence |
| ۴ | موبایل/دسترس‌پذیری | 🔶 evidence ناقص | مرحلهٔ ۲ | ماتریس دستگاه و journeyهای واقعی |
| ۵ | بتای بسته | ⛔ شروع نشده | مرحله‌های ۲ تا ۴ | cohort، consent و feedback cycle |
| ۶ | پرداخت | ⏸️ اختیاری | مرحلهٔ ۵؛ فقط در لانچ پولی | checkout و entitlement قابل‌ردیابی |
| ۷ | rollout | ⛔ قفل | همهٔ موارد لازم | rollout مرحله‌ای و approval نهایی |

## ترتیب اجرای مرحله‌ها

### مرحلهٔ ۰ — تثبیت نسخه و اتصال CI/deploy

- [ ] worktree، branch و SHA نهایی را ثبت و clean بودن worktree را تأیید کن.
- [ ] شاخهٔ release را به remote push کن و در صورت تأیید صاحب پروژه به مسیر
  محافظت‌شدهٔ `main`/release merge کن.
- [ ] `.github/workflows/deploy-hf-space.yml` را از guard فاز ۷ جدا کن تا فقط
  SHA تأییدشدهٔ فاز ۸ را deploy کند.
- [ ] workflowهای quality gate، migration و release gate را روی همان SHA اجرا کن.
- [ ] `docs/PROJECT_HANDOFF_FA.md` را با branch، SHA و URLهای واقعی به‌روزرسانی کن.

**معیار پذیرش:** SHA در remote قابل مشاهده است، CI همان SHA سبز است، ancestry
و branch protection قابل مشاهده است و هیچ workflowای به commit قدیمی اشاره نمی‌کند.

**فرمان درخواست این مرحله:** `مرحلهٔ ۰ را انجام بده`

#### گزارش اولیهٔ اجرای مرحلهٔ ۰ — ۲۰۲۶-۰۸-۲۴ (پیش از rewrite)

- [x] guard privacy/release روی tree فعلی اجرا شد و tracked upload، env خصوصی،
  artifact دیتابیس و secret pattern شناخته‌شده پیدا نشد.
- [!] strict history guard عمداً fail شد: دو commit قابل‌دسترسی هنوز محتوای
  migration قدیمی `DISPLAY_NAME_UPDATES` را دارند و قبل از release باید rewrite شوند.
- [x] قراردادهای source برای staging default، robots/noindex، health و پنهان‌سازی
  featureهای ناقص به guard اضافه شد.
- [x] backend `/health` اکنون `indexable` را صریحاً گزارش می‌کند.
- [x] deploy workflow از guard ثابت فاز ۷ جدا شد، `release_ref` و ancestry همان
  branch را بررسی می‌کند و tier/indexable staging را قبل از readiness می‌سنجد.
- [x] monitor workflow شرط `indexable=false` را برای frontend و backend بررسی می‌کند.
- [x] تست backend غیر integration: `174 passed, 28 deselected`، پوشش `60.34%`.
- [x] frontend lint، typecheck، unit (`25` فایل و `84` تست) و build (`66` route) موفق.
- [x] smoke مرورگر برای health/noindex و routeهای ناقص در سه پروژهٔ مرورگر موفق شد؛
  فرآیند web server محلی در این محیط دستی متوقف شد و این را به‌عنوان live deploy ثبت نمی‌کنیم.
- [ ] commit/branch فاز ۸ روی remote و `main` نیست؛ `origin/main` هنوز روی baseline قدیمی است.
- [ ] ruleset/required checks برای `main` در GitHub ایجاد/اثبات نشده است.
- [ ] history قابل‌دسترسی هنوز commit قدیمی `3cb7282` و migration دارای
  `DISPLAY_NAME_UPDATES` را دارد؛ حذف قطعی آن نیازمند history rewrite و تأیید صریح
  برای force-push است.
- [ ] deploy و health/readiness با SHA فعلی فاز ۸ انجام نشده؛ URLهای زنده فعلی
  releaseهای قدیمی‌تر را گزارش می‌کنند.

این گزارش اولیه عمداً وضعیت قبل از دریافت مجوز rewrite را نگه می‌دارد. نتیجهٔ
اجرایی جدید در الحاقیهٔ زیر ثبت شده است.

#### الحاقیهٔ پس از مجوز history rewrite — ۲۰۲۶-۰۸-۲۴

- [x] تاریخچهٔ تمام شاخه‌های publishable با حفظ migration به‌صورت no-op بازنویسی
  شد؛ محتوای personal-data migration در refهای قابل‌دسترسی پیدا نمی‌شود.
- [x] شاخه‌های phase 2 تا phase 8، `codex/release-phase-0` و `main` با
  `--force-with-lease` و leaseهای دقیق روی GitHub push شدند. HEAD فعلی شاخهٔ
  `codex/phase-8-beta-release` پس از این گزارش‌های docs-only است؛ مقدار دقیق آن را
  با `git rev-parse HEAD` بخوانید. آخرین SHA کد/CI-tested برابر
  `7238566467d821bd9acce70a6bf7441a06a2cd16` و `main` روی
  `bd7b016edede215885f495370b1976a230d3a996` است؛ tag قابل‌انتشار وجود ندارد.
- [x] قبل از rewrite یک bundle بازیابی محلی در
  `.backups/phase0-history-rewrite-20260824/before.bundle` نگه داشته شد؛ این فایل
  عمداً به remote push نشده است.
- [ ] ruleset و required checks شاخهٔ `main` هنوز از GitHub قابل‌اثبات نیست؛
  endpoint عمومی ruleset آرایهٔ خالی برگرداند و classic protection نیازمند بررسی
  صاحب repository است.
- [ ] staging هنوز با همان SHA نهایی phase 8 promote نشده است: frontend فعلی
  `bd7b016...` و backend فعلی `3b3a918...` را گزارش می‌کنند.
- [x] دو نقص CI اصلاح شد: parser عددی `verify-phase8-release.ps1` با
  PowerShell 7/Linux سازگار شد، pip در lockfile به `26.2.1` رفت و guard قدیمی
  فاز ۷ در `verify_phase7_operations.py` با refهای release هماهنگ شد.
- [x] Quality Gates روی SHA نهایی `7238566467d821bd9acce70a6bf7441a06a2cd16`
  در [run 32766872810](https://github.com/MoAminPourzare/Chinverse/actions/runs/32766872810)
  سبز شد (Release baseline، Backend، Frontend و browser tests).
- [x] پس از ثبت مستندات، Quality Gates روی HEAD مستندات `1db3633d67b758bd8167cffb5e447fc402e99e5a`
  در [run 32768637283](https://github.com/MoAminPourzare/Chinverse/actions/runs/32768637283)
  نیز سبز شد؛ این commit و commit‌های پس از آن docs-only هستند و SHA deployable کد
  همان `7238566467d821bd9acce70a6bf7441a06a2cd16` باقی می‌ماند.
- [x] Quality Gates روی snapshotهای docs-only بعدی در
  [run 32769302779](https://github.com/MoAminPourzare/Chinverse/actions/runs/32769302779) و
  [run 32770142297](https://github.com/MoAminPourzare/Chinverse/actions/runs/32770142297)
  نیز با هر سه job سبز پایان یافت؛ پس از SHA کد هیچ تغییر backend/frontend رخ نداده است.
- [ ] Deploy staging در [run 32766872815](https://github.com/MoAminPourzare/Chinverse/actions/runs/32766872815)
  در گام `Mirror backend to staging Space` شکست خورد؛ گام health اجرا نشد و
  هیچ ادعایی دربارهٔ deploy این SHA ثبت نمی‌کنیم.
- [ ] روی Hugging Face باید Trusted Publisher برای resource
  `spaces/MoAmin9/chinverse-api` با claimهای دقیق repository=`MoAminPourzare/Chinverse`،
  branch=`codex/phase-8-beta-release` و workflow=`deploy-hf-space.yml` ثبت شود؛
  بررسی خواندنی فعلی فقط publisherهای phase 4 و phase 5 را نشان می‌دهد؛ افزودن
  claim فاز ۸ نیازمند تأیید صاحب Space است و در این نشست تغییر داده نشد.
- [i] الگوی provider با runهای قبلی هم‌خوان است: phase 7 نیز در همان گام mirror
  شکست خورده، در حالی‌که runهای phase 4 و phase 5 موفق بوده‌اند؛ این قرینهٔ
  تشخیصی است و جایگزین log خصوصی provider نمی‌شود.

**نتیجهٔ فعلی مرحلهٔ ۰:** بخش history hygiene، branch refs و CI روی SHA نهایی
انجام شده است؛ خود مرحله هنوز به‌طور کامل بسته نیست. خروجی‌های باقی‌مانده:
Trusted Publisher/مجوز Space، promotion و health واقعی staging با همان SHA، و
ثبت ruleset/required checks توسط صاحب repository. تا ثبت این evidence، مرحلهٔ ۱
را روی production یا DB زنده شروع نکن.

فرمان‌های پایه (بدون secret):

```powershell
git status --short --branch
git rev-parse HEAD
powershell -ExecutionPolicy Bypass -File .\scripts\verify-phase8-release.ps1
```

> Push، merge و تنظیمات GitHub به credential و تأیید صاحب پروژه نیاز دارد؛ secret
> را هرگز در command line یا chat قرار نده.

### مرحلهٔ ۱ — migration، backup و restore ایزوله

- [x] یک PostgreSQL آزمایشی جدا روی native PostgreSQL 18.1 و port `55432` ایجاد
  شد؛ DB موجود `chinverse_db` لمس نشد. Docker daemon در این نشست در دسترس نبود.
- [x] `alembic upgrade head` تا `f8a1b2c3d4e5` اجرا شد و ۶۱ جدول public ساخته شد.
- [x] سناریوی fresh upgrade، downgrade تا `base` و upgrade مجدد ثبت شد؛ هر سه
  عملیات exit 0 داشتند.
- [x] backup سفارشی و restore روی `chinverse_phase1_restore` اجرا شد؛ SHA، زمان،
  revision و sentinel مصنوعی در گزارش مستقل ثبت شده‌اند. wrapperهای repository
  نیز با `-PostgresClientDirectory` و client native exit 0 شدند.
- [x] `alembic check` و verifierهای phase 2/3/4/5/7/8 و تست integration واقعی
  beta/feedback/payment روی DB ایزوله سبز شدند.
- [ ] Neon staging/prod branch جدا، retention و روش restore را مستند کن.

**معیار پذیرش:** schema verifier سبز، head دقیق فاز ۸، restore قابل‌بازسازی و
هیچ تغییر ناخواسته‌ای روی DB موجود.

#### گزارش اجرای مرحلهٔ ۱ — ۲۵ اوت ۲۰۲۶

جزئیات کامل در [گزارش migration و restore فاز ۱](E:/Chinverse/docs/PHASE_1_DATABASE_RESTORE_REPORT_FA.md)
ثبت شده است. خلاصهٔ evidence:

- تغییرات و evidence در commit `f39a8d56b69a136d7cfe333711a9996985cc8964` ثبت و
  روی `origin/codex/phase-8-beta-release` push شده‌اند.

- source ایزوله `chinverse_phase1` و target `chinverse_phase1_restore` هر دو
  head=`f8a1b2c3d4e5` و ۶۱ جدول public دارند.
- `alembic check` و شش verifier schema روی source و target exit 0 داشتند.
- backup native با اندازهٔ `254721` bytes و SHA-256 برابر
  `4ca794d54ce393e4143cde3b79f4a2b5c985e4ec302624f22045bb088aa6ba15` در
  `20:24:09Z` ساخته و در `20:24:10Z` با exit 0 restore شد؛ `ANALYZE` نیز 0 بود.
- suite integration پس از اصلاح idempotency پرداخت `30 passed` شد؛ تست جدید
  service/DB واقعی است و smoke HTTP روی staging هنوز جزو مرحلهٔ ۲ است.
- wrapperهای backup/restore با حفظ مسیر Docker، حالت native اختیاری دارند و در
  همین نشست با checksum/revision guard روی DB ایزوله exit 0 شدند؛ اجرای Docker
  در CI هنوز evidence جداگانهٔ provider است.

**نتیجهٔ فعلی مرحلهٔ ۱:** کنترل‌های local database، migration، schema و restore
سبز هستند؛ وضعیت مرحله به‌دلیل branch/retention/restore واقعی Neon و ثبت wrapper
در CI همچنان 🔶 است. اولین کار مالک پروژه، ثبت این evidence provider است؛ روی
production هیچ migration یا restore آزمایشی اجرا نشده است.

**فرمان درخواست این مرحله:** `مرحلهٔ ۱ را انجام بده`

### مرحلهٔ ۲ — استقرار staging با SHA دقیق

- [ ] backend و frontend را با یک SHA واحد روی staging محافظت‌شده deploy کن.
- [ ] URLهای health/readiness، version و release SHA را ثبت کن.
- [ ] DB و object storage staging از production جدا باشند؛ storage خصوصی و
  signed URLها فعال باشند.
- [ ] smoke journeyهای ورود، حساب، آموزش/رسانه، چت، feedback و admin را اجرا کن.
- [ ] `noindex`، auth gate و feature flagهای اشتراک/پرداخت را در staging بررسی کن.

**معیار پذیرش:** پاسخ health و readiness، SHA یکسان frontend/backend را نشان
می‌دهند؛ smoke بدون خطای blocker اجرا می‌شود؛ دادهٔ staging با production قاطی نیست.

#### گزارش اجرای مرحلهٔ ۲ — الحاقیهٔ نهایی ۲۶ اوت ۲۰۲۶

- **کارهای انجام‌شده:** guard fail-closed endpoint دیتابیس staging، check جدید
  `database_target`، workflow exact-SHA با host ثابت، metadata deployment status
  Vercel و smoke synthetic با cleanup اضافه و روی release SHA نهایی اجرا شد.
- **تست‌ها:** config/health برابر `43 passed` و suite غیر integration برابر
  `179 passed`؛ Quality Gates run `32902615699`، HF deploy run `32902615713` و
  smoke run `32902615687` همگی موفق. backend live smoke همهٔ checkهای
  auth/account/chat WebSocket/RBAC/cleanup را سبز کرد؛ load smoke `15` درخواست،
  `0` خطا، `p95=430.243ms` و `rps=1.035`. catalog زنده `200 []` است و فقط
  empty-state را ثابت می‌کند.
- **فایل‌های evidence:**
  [گزارش مستقل مرحلهٔ ۲](E:/Chinverse/docs/PHASE_2_STAGING_DEPLOYMENT_REPORT_FA.md)،
  `.github/workflows/phase2-staging-smoke.yml` و تغییرات deployment/readiness.
- **وضعیت provider:** Trusted Publisher دقیق فاز ۸ و
  `STAGING_DATABASE_ENDPOINT_ID=ep-wild-band-atse2yoq` ثبت شدند؛ HF readiness
  `database_target/database/storage=ok` است. هیچ secret مشاهده یا تغییر نکرد.
  پیش‌نمایش Vercel anonymous=`302` و `X-Robots-Tag: noindex` است.

**نتیجهٔ فعلی مرحلهٔ ۲:** 🔶. release SHA نهایی
`98918b607fd67b3e6c3f6d08de354fbcb86e1759` روی backend live است و source SHA
Vercel در smoke همان است. تنها دو مورد پذیرش باز هستند: health داخلی frontend
به‌دلیل نبود `VERCEL_AUTOMATION_BYPASS_SECRET` مشاهده نشده و catalog خالی است،
پس signed playback/entitlement روی lesson منتشرشده اثبات نشده است.

**فرمان درخواست این مرحله:** `مرحلهٔ ۲ را انجام بده`

### مرحلهٔ ۳ — شواهد عملیات و بازیابی

- [ ] Sentry production/staging را با DSN، release tag و environment درست فعال کن.
- [ ] لاگ ساختاریافتهٔ بدون secret و correlation/request id را بررسی کن.
- [ ] health واقعی DB، storage و dependencyهای ضروری را فعال و تست کن.
- [ ] smoke، load و soak را با JSON نتیجه، زمان، نرخ خطا، p95 و saturation ذخیره کن.
- [ ] یک alert عمدی ایجاد کن و دریافت، triage و recovery آن را ثبت کن.
- [ ] rollback به آخرین SHA سالم و restore از backup را در staging تمرین کن.
- [ ] [runbook فاز ۸](E:/Chinverse/docs/PHASE_8_RELEASE_RUNBOOK_FA.md) را با
  نام مسئول، آستانه‌ها و شماره/کانال escalation تکمیل کن.

**معیار پذیرش:** مانیتورینگ live قابل مشاهده، alert و recovery اثبات‌شده، و
rollback در زمان توافق‌شده انجام می‌شود.

**فرمان درخواست این مرحله:** `مرحلهٔ ۳ را انجام بده`

### مرحلهٔ ۴ — تست واقعی موبایل و دسترس‌پذیری

- [ ] Android Chrome واقعی: keyboard، safe-area، fullscreen، rotation، back
  gesture، zoom ۲۰۰٪، PWA install/update/offline.
- [ ] iOS Safari واقعی: همان journeyها، به‌خصوص keyboard، viewport، fullscreen
  و edge-back.
- [ ] VoiceOver و TalkBack را روی مسیرهای اصلی اجرا و نتیجه را ثبت کن.
- [ ] tap target حداقل ۴۴px، focus order، contrast و خطاهای فرم را دستی بررسی کن.
- [ ] برای هر دستگاه، OS/browser، زمان، SHA، نتیجه و screenshot/video evidence
  ثبت کن؛ اطلاعات شخصی را در evidence نگه ندار.

**معیار پذیرش:** مسیرهای اصلی روی حداقل یک دستگاه Android و یک دستگاه iOS کامل
می‌شوند و هیچ مانع P1 برای ورود، آموزش، چت و پرداخت/اشتراک وجود ندارد.

**فرمان درخواست این مرحله:** `مرحلهٔ ۴ را انجام بده`

### مرحلهٔ ۵ — بتای بسته و پشتیبانی

- [ ] تعداد cohort، معیار انتخاب، allowlist و تاریخ شروع/پایان beta را مشخص کن.
- [ ] consent، privacy notice، شرایط بازخورد و مسیر حذف کاربر را ثبت کن.
- [ ] owner بازخورد، SLA پاسخ، moderation و escalation incident را تعیین کن.
- [ ] invite/revoke/expiry و idempotency را روی DB واقعی staging تست کن.
- [ ] dashboard یا گزارش روزانهٔ خطا، retention، feedback و incident بساز.
- [ ] staging و beta را private و noindex نگه دار تا gate انتشار باز شود.

**معیار پذیرش:** cohort واقعی و owner مشخص است، حداقل یک چرخهٔ بازخورد و triage
ثبت شده، و هیچ incident P0/P1 باز باقی نمانده است.

**فرمان درخواست این مرحله:** `مرحلهٔ ۵ را انجام بده`

### مرحلهٔ ۶ — پرداخت و entitlement (فقط اگر لانچ پولی لازم است)

- [ ] provider و کشور/روش تسویه را انتخاب و owner آن را تأیید کن.
- [ ] checkout واقعی، webhook امضاشده، timestamp/replay protection و idempotency
  را با sandbox تست کن.
- [ ] entitlement را فقط از رویداد تأییدشده صادر کن؛ expiry، revoke، refund و
  chargeback را تست کن.
- [ ] reconciliation روزانه و audit ledger را ثبت کن.
- [ ] ابتدا با مبلغ آزمایشی live، سپس rollout محدود انجام بده.
- [ ] تا سبزشدن همهٔ موارد بالا، `FEATURE_SUBSCRIPTIONS_ENABLED` خاموش بماند.

**معیار پذیرش:** خرید، تمدید، لغو، refund و webhook تکراری در sandbox و live
قابل ردیابی‌اند و entitlement اشتباه یا دائمی ایجاد نمی‌شود.

**فرمان درخواست این مرحله:** `مرحلهٔ ۶ را انجام بده`

اگر لانچ فعلاً رایگان است، این مرحله را با تصمیم صریح صاحب پروژه
`SKIPPED-FREE-BETA` علامت بزن؛ اما feature flag اشتراک و checkout همچنان خاموش بماند.

### مرحلهٔ ۷ — gate نهایی و rollout مرحله‌ای

- [ ] blocker inventory را از issue tracker و evidence واقعی بازسازی کن؛ فقط به
  JSON دستی اکتفا نکن.
- [ ] quality gate و migration gate همان SHA را دوباره اجرا کن.
- [ ] همهٔ provider gateهای مورد نیاز را به `verified` با لینک evidence تبدیل کن.
- [ ] rollout محافظت‌شده را به‌ترتیب `internal → 5% → 25% → 50% → 100%` اجرا کن.
- [ ] بین مراحل observation window توافق‌شده داشته باش و thresholdهای 5xx، auth،
  payment، p95 و saturation را بررسی کن.
- [ ] در هر شکست threshold، rollout را متوقف و به SHA سالم rollback کن.
- [ ] `confirm_public=true` را فقط پس از approval نهایی صاحب پروژه فعال کن.

**معیار پذیرش:** هیچ P0/P1 حل‌نشده، evidence کامل providerها، health سبز و
rollback آزمایش‌شده وجود دارد؛ سپس و فقط سپس انتشار عمومی قابل اعلام است.

**فرمان درخواست این مرحله:** `مرحلهٔ ۷ را انجام بده`

## سخت‌سازی‌های P2 که بهتر است قبل از public انجام شوند

- [ ] پوشش integration مسیرهای beta invite، consent، feedback و payment webhook
  را با PostgreSQL واقعی اضافه کن.
- [ ] مسیر upload ویدئوی بزرگ در `course_admin` را با upload-specific rate limit
  و quota بررسی کن.
- [ ] coverage پایین endpointهای حساس را بازبینی و برای auth/admin/subscription
  تست منفی و race اضافه کن.
- [ ] snapshotهای قدیمی handoff و URLهای staging را با وضعیت فعلی همگام کن.
- [ ] قواعد branch protection و required checks را در GitHub اثبات و مستند کن.

## قالب ثبت پایان هر نشست

این بخش را بعد از هر جلسه تکمیل کن تا ادامهٔ کار مستقل از توکن و نشست باشد:

```text
تاریخ/ساعت:
SHA و branch:
کارهای تکمیل‌شده:
کار جاری:
اولین blocker:
فرمان یا اقدام بعدی:
فایل‌های evidence:
نتیجهٔ تست‌ها:
آیا تغییر خارجی انجام شد؟ (بله/خیر + شرح)
```

## منابع موجود

- [گزارش فاز ۷](E:/Chinverse/docs/PHASE_7_PERFORMANCE_OPERATIONS_FA.md)
- [گزارش فاز ۸](E:/Chinverse/docs/PHASE_8_BETA_RELEASE_FA.md)
- [گزارش موبایل و UX فاز ۶](E:/Chinverse/docs/PHASE_6_MOBILE_UX_FA.md)
- [ممیزی محتوای فاز ۵](E:/Chinverse/docs/PHASE_5_DATA_LICENSE_AUDIT_FA.md)
- [برگهٔ blockerهای فاز ۸](E:/Chinverse/docs/PHASE_8_RELEASE_BLOCKERS.json)
- [runbook انتشار](E:/Chinverse/docs/PHASE_8_RELEASE_RUNBOOK_FA.md)
