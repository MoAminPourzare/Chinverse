# گزارش زندهٔ مرحلهٔ ۷ آمادگی لانچ — gate نهایی و rollout

**وضعیت:** 🔶 در حال اجرا؛ staging/CI سبز و rollout عمومی تا تکمیل provider gateها قفل است.

**تاریخ شروع:** ۲۰۲۶-۰۹-۱۹

**شاخه:** `codex/phase-8-beta-release`

**SHA شروع:** `e89386ddf3fa7c91aed7cff4f1312fa931b965b8`

## ۱. مرز ایمنی

- این مرحله اجازهٔ ضمنی برای merge به `main`، تغییر production، DNS/WAF یا rollout
  عمومی ۱۰۰٪ نیست.
- `confirm_public=true` فقط پس از سبزشدن همهٔ gateها و تأیید نهایی جداگانهٔ owner
  مجاز است.
- لانچ فعلی رایگان است؛ payment gate با `SKIPPED-FREE-BETA` waived و همهٔ فلگ‌های
  اشتراک/checkout خاموش‌اند.

## ۲. inventory زندهٔ شروع

خواندن read-only از GitHub REST در ۲۰۲۶-۰۹-۱۹:

- issue باز: `0`
- issue باز با labelهای `P0`، `P1`، `Critical` یا `High`: `0`
- repository ruleset عمومی: `0`
- environmentهای موجود: `Preview`، `Production` و `staging`
- protection rule قابل مشاهده برای هر سه environment: `0`
- SHA شروع ancestor شاخهٔ `origin/main`: خیر
- provider gateها: پنج مورد pending و payment رایگان یک مورد waived

نبود issue بحرانی شرط لازم است، اما به‌تنهایی آمادگی production را ثابت نمی‌کند.

## ۳. Quality Gates

Run شروع:

- URL: <https://github.com/MoAminPourzare/Chinverse/actions/runs/35466551590>
- Release baseline: موفق
- Backend: شکست در `Static checks`
- علت: verifier عملیاتی ترتیب قدیمی schema را انتظار داشت و local gate verifier
  مرحلهٔ ۶ را اجرا نمی‌کرد.
- اصلاح: ترتیب `Phase 5 → 6 → 7 → 8` در verifier، local gate و migration graph
  همسان شد.
- evidence محلی پس از اصلاح: Ruff سبز و
  `verify_phase7_operations.py --repo-root ..` سبز.
- اجرای بعدی Backend از Static checks عبور کرد و در تست timestamp webhook شکست
  خورد؛ fixture تست به قرارداد عدد صحیح تابع اصلاح شد. نتیجهٔ محلی نهایی:
  `186 passed, 32 deselected`، مجموعهٔ هدف `17 passed`، Ruff و هر دو verifier سبز.
- اجرای Quality روی `8a9d3e2` تا migration و schema parity سبز بود و فقط integration
  fixture مرحلهٔ ۴ شکست خورد. علت hardcode شدن Alembic head قدیمی در ابزار fixture
  بود؛ safety contract اکنون head یکتای migration graph را در زمان اجرا می‌خواند و
  تست regression دارد.
- اجرای بعدی روی `d76ce32` تمام integrationها را با `32 passed` عبور داد، اما
  downgrade تا base روی plan پیش‌فرضی که subscription به آن ارجاع داشت شکست خورد.
  migration قدیمی اکنون plan وابسته را بدون حذف تاریخچهٔ اشتراک حفظ می‌کند؛ حذف
  نهایی tableها در ادامهٔ downgrade کامل همچنان انجام می‌شود.
- release candidate عملیاتی: `54973b82341924f5056ba1d8d3cbb108c5c166ab`
- Quality Gates نهایی: <https://github.com/MoAminPourzare/Chinverse/actions/runs/35468137066>
  — هر سه job `Backend`، `Frontend` و `Release baseline` موفق؛ backend شامل
  `32 passed` integration و چرخهٔ کامل downgrade/rebuild است.
- deploy staging backend: <https://github.com/MoAminPourzare/Chinverse/actions/runs/35468137203>
  — موفق و health/readiness همان SHA را گزارش کرد.
- exact-SHA staging smoke: <https://github.com/MoAminPourzare/Chinverse/actions/runs/35468137100>
  — موفق؛ frontend/backend، protection/noindex و fail-closed routeها تأیید شدند.

## ۳.۲ حفاظت GitHub

- ruleset فعال `Protect main release` با شناسهٔ `23709505` روی default branch ایجاد
  شد.
- حذف شاخه، force-push و history غیرخطی بسته است؛ تغییر `main` فقط از PR و پس از
  موفقیت checkهای `Backend`، `Frontend` و `Release baseline` ممکن است.
- محیط `Production` فقط شاخهٔ محافظت‌شده را می‌پذیرد و approval کاربر
  `MoAminPourzare` را پیش از job production لازم دارد؛ self-review عمداً برای
  repository تک‌مالک مجاز است.
- staging بدون reviewer دستی باقی ماند تا monitor و exact-SHA smoke خودکار متوقف
  نشوند.

## ۳.۳ load/soak و سلامت پس از بار

runner ممیزی‌شدهٔ GET-only روی backend staging و release دقیق
`54973b82341924f5056ba1d8d3cbb108c5c166ab` اجرا شد:

| profile | مدت | درخواست | خطا | p95 | throughput | verdict |
|---|---:|---:|---:|---:|---:|---|
| smoke | ۱۵ ثانیه | ۱۵ | ۰ | `409.402ms` | `1.047 req/s` | ✅ |
| load | ۱۸۰ ثانیه | ۸۶۲ | ۰ | `308.293ms` | `4.785 req/s` | ✅ |
| soak | ۹۰۰ ثانیه | ۱۷۶۷ | ۰ | `361.932ms` | `1.963 req/s` | ✅ |

- threshold smoke: error=`0` و p95 حداکثر `2500ms`؛ پاس شد.
- threshold load/soak: error حداکثر `1%` و p95 حداکثر `2500ms`؛ هر دو پاس شدند.
- پس از soak، `/health` برابر `status=ok`، tier=`staging`،
  `indexable=false` و همان release SHA بود.
- `/health/ready` پس از soak برابر `database_target=ok`، `database=ok` و
  `storage=ok` بود.
- gate `phase7-live-promotion` با اتکا به این شواهد و alert/recovery ثبت‌شدهٔ فاز
  هفت به `verified` تبدیل شد.
- JSON پایدار evidence: `docs/LAUNCH_READINESS_STAGE_7_LOAD_EVIDENCE.json`.

## ۳.۱ سخت‌سازی rollout gate

- پلهٔ `internal` پیش از ۵٪ اضافه شد.
- `rollback_sha` سالم و متفاوت برای هر اجرا اجباری شد.
- هر پله به attestation موفق پلهٔ قبلی با همان release/rollback SHA وابسته است.
- URL evidence مربوط به promotion provider اجباری و HTTPS است.
- health/readiness در window واقعی ۱۵، ۳۰ یا ۶۰ دقیقه تکرار می‌شود.
- attestation هر پله ۹۰ روز نگه‌داری می‌شود.
- workflow فقط promotion انجام‌شده را validate می‌کند و provider/DNS را تغییر
  نمی‌دهد.
- triggerهای deploy و exact-SHA smoke برای `backend/tests/**` همسان شدند تا smoke
  منتظر SHAای نماند که backend هرگز deploy نکرده است.

## ۴. gateهای باقی‌مانده

| gate | وضعیت | شرط خروج |
|---|---|---|
| Quality Gates SHA نهایی | ✅ | run `35468137066` برای `54973b8...` سبز |
| exact-SHA staging | ✅ | deploy `35468137203` و smoke `35468137100` سبز |
| GitHub protection | ✅ | ruleset `23709505` و approval محیط Production فعال |
| staging operations | ✅ | smoke/load/soak و health/readiness پس از بار سبز |
| production Neon/storage | ⛔ | جداسازی و restore evidence واقعی |
| domain/DNS/TLS/WAF | ⛔ | دامنهٔ مالک و probe بیرونی |
| email/SMS delivery | ⛔ | provider و smoke واقعی |
| legal/beta consent | ⛔ | تأیید owner و evidence لینک‌های production |
| payment | ✅ waived | فقط تا وقتی لانچ رایگان و فلگ‌ها خاموش‌اند |
| `main` ancestry | ⛔ | SHA تأییدشده از مسیر محافظت‌شده وارد `main` شود |
| rollout | ⛔ | internal سپس ۵/۲۵/۵۰/۱۰۰ با observation و rollback |

## ۵. checklist زنده

- [x] inventory issueها از GitHub زنده بازسازی شد.
- [x] وضعیت ruleset، environment و ancestry بررسی شد.
- [x] اولین شکست Quality Gates ریشه‌یابی و اصلاح شد.
- [x] قرارداد rollout ترتیبی، rollback SHA، observation و attestation سخت‌سازی شد.
- [x] Quality Gates نهایی و migration/integration همان SHA سبز شد.
- [x] SHA نهایی روی staging frontend/backend deploy و exact-SHA smoke سبز شد.
- [ ] provider gateهای لازم verified یا waiver محدود و موجه داشته باشند.
- [x] branch/environment protection واقعی تنظیم شد.
- [ ] merge محافظت‌شده به `main` انجام شود.
- [ ] rollout internal و سپس ۵٪، ۲۵٪ و ۵۰٪ با observation ثبت شود.
- [ ] فقط با approval نهایی owner، rollout ۱۰۰٪ و `confirm_public=true` اجرا شود.

## ۶. اولین blocker

اولین blocker باقی‌مانده providerهای production است: Neon/storage مستقل، دامنه و
WAF، delivery تراکنشی و تأیید نسخهٔ production اسناد/consent. تا زمان ثبت این
evidenceها، merge به `main` و rollout عمومی عمداً انجام نمی‌شود.
