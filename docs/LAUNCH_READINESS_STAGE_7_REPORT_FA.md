# گزارش زندهٔ مرحلهٔ ۷ آمادگی لانچ — gate نهایی و rollout

**وضعیت:** 🔶 در حال اجرا؛ staging/CI در حال تثبیت و rollout عمومی قفل است.

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

## ۴. gateهای باقی‌مانده

| gate | وضعیت | شرط خروج |
|---|---|---|
| Quality Gates SHA نهایی | 🔶 | اجرای کامل موفق شامل migration و integration |
| exact-SHA staging | 🔶 | frontend/backend همان SHA و health/readiness سبز |
| GitHub protection | ⛔ | ruleset/required checks و approval محیط production |
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
- [ ] Quality Gates نهایی و migration/integration همان SHA سبز شود.
- [ ] SHA نهایی روی staging frontend/backend deploy و exact-SHA smoke سبز شود.
- [ ] provider gateهای لازم verified یا waiver محدود و موجه داشته باشند.
- [ ] branch/environment protection واقعی تنظیم شود.
- [ ] merge محافظت‌شده به `main` انجام شود.
- [ ] rollout internal و سپس ۵٪، ۲۵٪ و ۵۰٪ با observation ثبت شود.
- [ ] فقط با approval نهایی owner، rollout ۱۰۰٪ و `confirm_public=true` اجرا شود.

## ۶. اولین blocker

در حال حاضر اولین blocker خودکار، سبزشدن Quality Gates پس از اصلاح verifier است.
پس از آن، protection و providerهای production نخستین blocker بیرونی خواهند بود.
