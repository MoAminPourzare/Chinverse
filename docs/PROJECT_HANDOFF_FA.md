# ChinVerse | راهنمای کامل انتقال پروژه

> این فایل برای شروع یک چت یا یک Codex جدید نوشته شده است. قبل از هر تغییر، وضعیت Git و فایل‌های همین repository را دوباره بررسی کن؛ این سند snapshot وضعیت پروژه در **۹ اوت ۲۰۲۶ / ۱۸ مرداد ۱۴۰۵** است و جایگزین خواندن کد نیست.

## ۱. خلاصه فوری

**ChinVerse** یک وب‌اپلیکیشن فارسی‌محور برای یادگیری زبان چینی است که هم‌زمان
قابلیت‌های شبکه حرفه‌ای، پروفایل عمومی، گالری، خدمات، جامعه، چت و پشتیبانی دارد.

وضعیت فعلی:

- فازهای صفر تا سه انجام شده‌اند؛ دامنه automated/local فاز چهار نیز بدون P0/P1 باز تکمیل شده است.
- شاخه فعلی `codex/phase-4-user-journeys` است.
- release code فاز چهار `92ae2c40a29afb9a15b8fcb8d4500213ef27b253` است؛ commitهای بعدی شاخه فقط workflow دیپلوی را اضافه و سخت‌سازی کرده‌اند.
- commit مبنای شاخه پیش از تغییرات فاز چهار: `3f63addf1e6b9f3c79f83044545f2d7a375f08db`
- وضعیت دقیق commit/worktree را با Git بررسی کن؛ چند Codex روی پروژه کار می‌کنند و این سند را نباید جایگزین Git دانست.
- GitHub Actions فاز چهار سبز و release code روی Vercel و Hugging Face deploy شده است.
- backend با tier=`staging` روی Hugging Face اجرا می‌شود، اما در audit دیپلوی مشخص شد secret دیتابیس آن هنوز به Neon production اشاره دارد؛ این اتصال باید پیش از live smoke اصلاح شود.
- frontend release candidate روی Vercel Preview deploy شده است.
- **روی `main` merge نشده‌ایم.** قبل از merge به main باید تصمیم انتشار و گیت‌های باقی‌مانده با مالک پروژه تأیید شوند.

گزارش کامل اجرای فعلی در `docs/PHASE_4_USER_JOURNEYS_FA.md` است. پس از اصلاح اتصال
DB، migration شاخه واقعی staging و smoke دسترسی‌دار، فاز بعدی منطقی فاز پنج آموزش
و رسانه است.

## ۲. قانون کار برای Codex بعدی

1. ابتدا `git status`, branch، آخرین commit و همین فایل را بخوان.
2. secret، token، password، connection string یا فایل `.env` را در چت، Git یا گزارش ثبت نکن.
3. تغییرات کاربران و کارهای Codex دیگر را revert نکن؛ با آن‌ها کار کن.
4. برای تغییرات دستی از `apply_patch` استفاده کن.
5. قبل از commit، lint/typecheck/test/build و در صورت ارتباط migration را اجرا کن.
6. هر فاز باید commit، push، CI و deploy قابل ردیابی داشته باشد؛ مگر مالک پروژه صریحاً بگوید commit نکن.
7. force push فقط با `--force-with-lease` و SHA فعلی remote انجام شود.
8. تغییرات backend و frontend باید با یک release SHA قابل تطبیق باشند.
9. هیچ قابلیت ناقصی را صرفاً با ظاهر UI فعال نکن؛ feature flag، API، entitlement و تست کامل لازم است.

## ۳. محصول و دامنه محصول

محصول برای فارسی‌زبانانی طراحی شده که می‌خواهند چینی یاد بگیرند و در یک شبکه
اجتماعی/حرفه‌ای چینی‌محور فعالیت کنند.

ماژول‌های محصول:

- ثبت‌نام، ورود، تأیید حساب، بازیابی و تغییر رمز
- پروفایل شخصی، درباره من، رزومه، شبکه‌های اجتماعی، وب‌سایت‌ها و showcase عمومی
- گالری شخصی و خدمات پولی با پوستر تبلیغاتی
- کاوش دوره‌ها و دسته‌بندی‌های آموزش چینی
- درس ویدئویی، HLS، زیرنویس چینی/فارسی/Pinyin و dictionary popup
- دیکشنری HSK1، HSK2 و HSK3 با معنی، مثال و collocation
- Leitner flashcards، مرور واژه و هدف/فعالیت روزانه
- feed، پست، لایک و نظر
- تالار گفتگو، سؤال، پاسخ، مقاله، نظر و پشتیبانی
- پیام مستقیم، اعلان و شبکه دنبال‌کردن
- تنظیمات ظاهر، اندازه متن فارسی/چینی، اطلاعات حساب و امنیت
- پنل مدیریت برای کاربران، فرهنگ لغت، دوره‌ها، درس‌ها، زیرنویس و moderation

۲۹ تغییر طراحی/محصولی اولیه در فاز صفر ثبت شده‌اند؛ از جمله اصلاح پوستر
خدمات، نمایش کامل تصویر، ویرایش خدمت، جایگاه پشتیبانی، متن‌های خالی پیام/اعلان،
ویرایش و حذف سؤال، تنظیمات متن، dictionary modal و مسیر ویدئوی تلفظ.
فهرست دقیق آن‌ها در [گزارش فاز صفر](./PHASE_0_RELEASE_BASELINE_FA.md) است.

## ۴. معماری فنی

### Frontend

- Next.js `16.2.12` با App Router و webpack
- React `19.2.8`
- TypeScript و Tailwind CSS 4
- `axios` برای API و interceptor احراز هویت
- `hls.js` برای پخش HLS در مرورگرهای غیر Safari
- `lucide-react` و Headless UI برای کنترل‌های رابط
- Vitest/Testing Library برای unit و Playwright برای E2E
- مسیر BFF/proxy: `frontend/src/app/api/backend/[...path]/route.ts`
- تنظیمات امنیتی و CSP: `frontend/src/proxy.ts`

### Backend

- FastAPI
- SQLAlchemy async و `asyncpg`
- Alembic برای تمام schema changes
- PostgreSQL/Neon
- PyJWT، Argon2، PyOTP، Pillow و pillow-heif
- boto3 adapter برای S3-compatible storage
- Docker با Python `3.11.15`، Poetry `2.4.1` و کاربر non-root

### زیرساخت فعلی

| بخش | محیط/وضعیت |
| --- | --- |
| GitHub | `https://github.com/MoAminPourzare/Chinverse` |
| branch کاری | `codex/phase-4-user-journeys` |
| frontend staging/preview | [Vercel Preview](https://chinverse-nwhvuwf7k-death-stroke.vercel.app) |
| frontend alias قبلی | `https://chinverse.vercel.app`؛ تا merge به main مرجع فاز سه نیست |
| backend staging | [Hugging Face Space](https://moamin9-chinverse-api.hf.space) |
| database target | Neon branch دائمی `staging` جداست، اما HF فعلاً اشتباهاً به branch `production` وصل است؛ اصلاح در حال انجام است |
| فایل staging | bucket خصوصی `MoAmin9/chinverse-api-storage` با mount در `/data` |
| ویدئو | Arvan VOD/HLS برای نمونه‌های فعلی |
| Cloudflare | فقط Cloudflare Turnstile در کد؛ Cloudflare CDN/R2 در این release استفاده نمی‌شود |

اطلاعات ورود و secretها عمداً در این سند نیستند. برای دسترسی مدیریتی از
داشبورد provider یا secret manager استفاده شود.

### مسیرهای اصلی Frontend

صفحه‌های مهم در `frontend/src/app`:

- `/`, `/landing`, `/login`, `/signup`, `/forgot-password`, `/verify-account`
- `/profile`, `/profile/network`, `/users/[id]`, `/showcase`, `/account`
- `/account/security`, `/settings`, `/settings/about`, `/settings/appearance`, `/settings/daily`
- `/gallery` و بخش‌های داخل profile، `/services/[id]`
- `/explore`, دسته‌های HSK، pronunciation، grammar، movies، series، cartoons و غیره
- `/watch/[domain]/[courseId]`, `/lessons/[id]`
- `/leitner`, `/leitner/review`
- `/community`, `/posts/[id]`, `/chat`, `/chat/[userId]`, `/notifications`, `/support`
- `/moderation`, `/admin`, `/admin/content`
- `/legal/terms`, `/legal/privacy`, `/legal/community-guidelines`

### گروه‌های اصلی API

همه APIها معمولاً زیر `/api/v1` هستند و routerها در
`backend/app/api/v1/api.py` ثبت می‌شوند:

- auth و sessions: login، signup، refresh، logout، verification، password، MFA
- users: profile، avatar، showcase، follow/network و حذف حساب
- gallery و services: محتوای شخصی، پوستر خدمت و ویرایش/حذف
- courses و course-admin: taxonomy، دوره، section، lesson، save و subtitles
- vocabulary و leitner: جست‌وجوی واژه، match، flashcard و review
- feed و engagements: پست، لایک و کامنت
- community: سؤال، پاسخ، مقاله، نظر و support ticket
- chat: conversation، پیام، read و WebSocket
- notifications و daily-activity
- trust: block، report، moderation و appeal
- admin: overview، users، dictionary، lessons/subtitles و کنترل‌های مدیریتی
- subscriptions/referrals فقط وقتی feature flag مربوطه روشن باشد

## ۵. مدل داده و migration

مدل‌های فعال در `backend/app/models` شامل این گروه‌ها هستند:

- `user`, `UserProfile`, `UserSocialLink`, `UserGalleryItem`
- `Course`, `CourseSection`, `Lesson`, `LessonSubtitle`, `LessonWordMap`, `Content`
- `DictionaryWord`, `WordDefinition`, `WordExample`, `WordCollocation`
- `StudySession`, `UserFlashcard`, `UserLessonWatchProgress`
- social/feed/forum/article/message/support
- `UserService`, subscription و referral
- notification و operational tables
- `AuthSession`, `AuthChallenge`, `MfaBackupCode`, `RateLimitBucket`, audit و legal
- `UserBlock`, `ContentReport`, `ModerationAction`

اصلاحات مهم فاز دو:

- DDL زمان درخواست از endpointها حذف شد.
- مدل‌های legacy و جدول‌های `services`, `consultation_requests`,
  `leitner_cards`, `user_streaks`, `course_reviews` حذف/مهاجرت داده شدند.
- تنها یک Alembic head وجود دارد.
- چرخه `base -> head -> base -> head` و parity مدل/DB تست شده است.
- migration امنیت فاز سه:
  `d3a7f9c2e5b1_add_security_trust_foundation`
- migration workflow پشتیبانی فاز چهار:
  `a2c4e6f8b1d3_add_support_ticket_workflow`
- migration حذف legacy و runtime schema:
  `c8f1e2a4d6b9_remove_legacy_models_and_runtime_schema`

فرمان‌های پایه:

```powershell
cd backend
poetry run alembic upgrade head
poetry run alembic check
poetry run python scripts/verify_phase2_schema.py
poetry run python scripts/verify_phase3_schema.py
poetry run python scripts/verify_phase4_schema.py
```

هیچ endpointی نباید `CREATE TABLE`, `ALTER TABLE` یا `CREATE INDEX` اجرا کند.

## ۶. دیکشنری و داده آموزشی

فایل‌های canonical در `backend/data/dictionary`:

- `hsk1_words_dictionary.csv`
- `hsk2_words_dictionary.csv`
- `hsk3_words_dictionary.csv`

فرمت sense-based از `word_id`, `chinese_word`, `pinyin`, سطح HSK، معنی‌ها،
collocation و مثال پشتیبانی می‌کند. import گروهی:

```powershell
cd backend
poetry run python import_dictionary.py --all-hsk
```

بازسازی کامل فقط روی دیتابیس staging/ایزوله:

```powershell
poetry run python import_dictionary.py --all-hsk --reset
```

داده دیکشنری در repository هست، اما completeness، صحت همه senseها، audio
و ممیزی محتوایی باید در فاز رسانه/داده دوباره انجام شود؛ وجود CSV به‌تنهایی
به معنی آماده‌بودن محتوای production نیست.

## ۷. وضعیت ویدئو و زیرنویس

ویدئوی فعلی نمونه‌ی اول از Arvan HLS می‌آید و player در
`frontend/src/app/watch/[domain]/[courseId]/page.tsx` با native HLS یا hls.js
آن را پخش می‌کند.

در snapshot فعلی:

- fallback عمومی اول به HLS موجود در `frontend/src/data/firstVideoTranscript.ts`
  اشاره می‌کند.
- `pronunciation/7` به‌صورت ویژه از
  `frontend/src/data/firstPronunciationLessonTranscript.ts` استفاده می‌کند.
- HLS فعلی fallback عمومی در source:
  `https://chinverse-test.arvanvod.ir/wYPdKwd32N/2AVeEG8bo0/h_,144_200,240_206,360_206,480_206,720_206,k.mp4.list/master.m3u8`
- HLS فعلی `pronunciation/7` در source:
  `https://chinverse-test.arvanvod.ir/wYPdKwd32N/DdMY469Pz0/h_,144_200,240_319,360_319,480_319,720_319,k.mp4.list/master.m3u8`
- مالک پروژه در یکی از پیام‌های قبلی HLS دیگری با شناسه‌ی `loOzQ48d7B`
  فرستاده بود؛ در snapshot فعلی `rg` آن شناسه را در source پیدا نمی‌کند. پیش از
  تغییر ویدئوی `pronunciation/7` باید مشخص شود کدام URL مرجع نهایی است.
- subtitleهای چینی/فارسی/Pinyin نمونه در source داده شده‌اند.
- فایل‌های محلی نمونه در `firstVideo/` و ویدئوی دوم و subtitleهایش در
  `secondVideo/` هستند.

**ریسک مهم برای فاز پنج:** هنوز در player منطق fallback و شرط ویژه‌ی
`domain === "pronunciation" && courseId === "7"` وجود دارد و بخشی از درس‌ها
ممکن است URL placeholder داشته باشند. باید ویدئو، subtitle و entitlement هر
درس در DB/مدیریت محتوا ذخیره و از hardcode خارج شود. همچنین HLS تازه‌ای که
مالک پروژه در چت‌های قبلی فرستاده بود باید با URLهای فعلی source تطبیق داده شود؛
به URL قدیمی بدون بررسی اعتماد نکن.

## ۸. امنیت و اعتماد فاز سه

پیاده‌سازی فعلی شامل این موارد است:

- password policy، Argon2 و upgrade hash قدیمی
- پاسخ یکنواخت reset، challenge کوتاه‌عمر/تک‌مصرف و محدودیت تلاش
- تأیید مستقل email/mobile و الزام verified login در production در صورت فعال‌سازی
- access token کوتاه‌عمر در حافظه JS، refresh token opaque چرخشی در HttpOnly cookie
- session list، revoke جاری/all و invalidate پس از تغییر رمز/نقش/MFA
- نقش‌های DB-based: `user`, `moderator`, `admin`
- TOTP ضد replay و backup code یک‌بارمصرف برای ادمین
- reset اضطراری MFA با `backend/scripts/reset_admin_mfa.py` و audit
- rate limit اتمیک PostgreSQL با proxy trust صریح
- Turnstile Siteverify سمت backend با action/hostname
- same-origin BFF، Origin/Referer و Fetch Metadata برای mutation
- CSP nonce، HSTS، frame protection، Permissions Policy، no-store و noindex
- محدودیت body حتی برای chunked upload
- بررسی واقعی image/video، MIME/extension allowlist، pixel limit، re-encode و EXIF removal
- block، report، moderation queue، claim/row lock، appeal و restore حساب با MFA
- acceptance نسخه‌دار Terms/Privacy/Community Guidelines
- حذف دائمی حساب با password و confirmation

نتیجه ابزارهای خودکار و تست‌های فاز سه مورد باز Critical/High ندارد؛ این
نتیجه جایگزین penetration test مستقل یا بررسی providerهای واقعی نیست.

## ۹. کارهای انجام‌شده بر اساس فاز

### فاز صفر: release baseline

- دامنه ۲۹ گروه تغییر محصولی ثبت شد.
- شاخه release ساخته و staging از production تفکیک شد.
- staging noindex و قابلیت‌های ناقص پنهان شدند.
- ۲۸ فایل runtime کاربر و داده خصوصی از Git/history پاک‌سازی شد.
- guard حریم خصوصی release به CI اضافه شد.
- baseline اصلی: `5a3c239`.

### فاز یک: quality baseline

- Node/Python/Poetry/PostgreSQL و lockfileها تثبیت شدند.
- GitHub Actions برای frontend/backend/database/browser/Docker ساخته شد.
- audit، lint، typecheck، build و integration gate اضافه شد.
- اعتبارسنجی فایل و health/readiness بهتر شد.

### فاز دو: database and storage

- DDL runtime حذف و migrationها رسمی شدند.
- legacy model/tableها حذف و داده فعال migrate شد.
- Neon staging branch و backup/restore با checksum ساخته و آزموده شد.
- adapter storage برای local/mounted/s3 ساخته شد.
- به‌علت در دسترس نبودن Cloudflare R2، staging فعلی از HF private bucket mount
  استفاده می‌کند.
- tier عمومی همچنان فقط S3 را می‌پذیرد و بدون تنظیمات آن fail closed است.
- baseline branch فاز دو: `6980813`.

### فاز سه: security and trust

- هسته امنیت در `399743d`، dependency fixes در `d8d1a66` و integration fix در
  `cbb62ed` ثبت شد.
- storage mounted و اصلاح pathها در `7651ac3` انجام شد.
- مشکل checkout تمیز Linux در `01a862d` رفع شد.
- گزارش نهایی در `3f63add` ثبت شد.
- CI نهایی: [run 31265206838](https://github.com/MoAminPourzare/Chinverse/actions/runs/31265206838).

### فاز چهار: user journeys و workflow پشتیبانی

- ماتریس پذیرش بخش‌به‌بخش در `docs/PHASE_4_USER_JOURNEYS_FA.md` ثبت شد.
- چهار سناریوی integration برای profile/network، gallery/services، feed،
  engagement، community، support، chat، notifications، courses، dictionary،
  Leitner و daily activity اضافه شد.
- follow/network، article/comment، ownership و race duplicate Leitner به‌صورت
  HTTP واقعی آزموده شدند.
- ۵۱ سناریوی E2E فاز چهار و در مجموع ۸۷ سناریوی E2E روی build تولیدی در سه
  پروژه مرورگر سبز شدند.
- shortcut پشتیبانی در صفحات متمرکز حذف شد؛ chat برای خطای شبکه retry، polling
  پایدار، latest-request-wins و fallback بدون crash در WebKit دارد.
- workflow کامل support شامل تاریخچه کاربر، صف RBAC+MFA ادمین، پاسخ، اعلان، audit
  و migration `a2c4e6f8b1d3` اضافه شد.
- صفحه `/admin/support` و تست نقش‌محور ادمین/کاربر در هر سه profile اضافه شد.
- handshake watchdog، polling فوری و merge امن history دیررس، race گم‌شدن پیام اول
  چت را بستند.
- WebSocket اکنون Origin، auth-first و frameهای object را اعتبارسنجی می‌کند؛ هشت
  تست route/manager و یک integration واقعی PostgreSQL/JWT/session revoke اضافه شد.
- release code `92ae2c40a29afb9a15b8fcb8d4500213ef27b253` است.
- referrals و subscriptions به‌دلیل feature flag خاموش، عمداً فقط در حالت
  disabled/redirect باقی مانده‌اند.

## ۱۰. تست و شواهد نهایی

CI کامل فاز چهار و شواهد release candidate زیر ثبت شده‌اند:

- Release baseline: success
- Frontend: success؛ lint، typecheck، unit/coverage، build و Playwright
- Backend: success؛ audit، Ruff، compileall، Bandit، unit، migration، integration، rollback/rebuild و Docker
- Backend unit محلی: `66 passed`, `14 deselected`
- Backend coverage با gate حداقل `50%`
- Backend integration: `14 passed`
- Frontend Vitest: `30 passed`
- Phase 4 E2E: `51 passed`؛ suite کامل production: `87 passed`
- production build: `63 route`
- Alembic head: `a2c4e6f8b1d3`؛ `alembic check` و verifierهای فازهای ۲، ۳ و ۴ سبز
- downgrade به `d3a7f9c2e5b1` و upgrade مجدد head فاز چهار: سبز
- npm production audit و pip-audit: صفر vulnerability شناخته‌شده
- CI release code: [run 31306622856](https://github.com/MoAminPourzare/Chinverse/actions/runs/31306622856)، موفق
- OIDC deploy سخت‌شده: [run 31310086979](https://github.com/MoAminPourzare/Chinverse/actions/runs/31310086979)، موفق
- Quality Gates workflow نهایی: [run 31310087005](https://github.com/MoAminPourzare/Chinverse/actions/runs/31310087005)، موفق
- Hugging Face Space commit: `526add1ee73c618f29142b55e720449080ead48f`
- tree همان Space دقیقاً برابر tree پوشه `backend` در release code است.

Smoke test زنده Hugging Face:

| مسیر | نتیجه |
| --- | --- |
| `/health` | ۲۰۰، `status=ok`، tier=`staging`، release=`92ae2c40...` |
| `/health/ready` | ۲۰۰، `database=ok` |
| `/docs` | ۴۰۴ |
| `/api/v1/users/me` بدون token | ۴۰۱ |
| GET واقعی با Origin نامعتبر | ۴۰۳؛ proxy HF ممکن است preflight را خودش ۲۰۰ پاسخ دهد، اما درخواست app رد می‌شود |
| CSP/HSTS/noindex/tier headers | تأیید شد |

هشدار زیرساختی فاز چهار: `DATABASE_URL` در Space به Neon production
`br-cold-salad-at44rvqh` اشاره داشت؛ startup migration آن branch را به
`a2c4e6f8b1d3` رساند، درحالی‌که staging دائمی `br-shiny-darkness-at6obb2e` هنوز
روی `c8f1e2a4d6b9` است. نقاط بازیابی زیر ساخته و بررسی شدند:

- staging snapshot: `phase4-predeploy-92ae2c4` / `br-misty-grass-atc88xt5`
- production point-in-time: `phase4-prod-pre-migration-92ae2c4` /
  `br-billowing-silence-atxtvddd` با revision `d3a7f9c2e5b1`

روی production rollback یا داده‌ی تستی اجرا نشد. پیش از live smoke باید secret HF
به staging منتقل و head همان branch دوباره تأیید شود.

## ۱۱. قابلیت‌های عمداً خاموش

این سه feature در staging و production به‌صورت پیش‌فرض خاموش‌اند:

- اشتراک: checkout هنوز `manual-placeholder` است و درگاه/ callback واقعی ندارد.
- دعوت دوستان: پاداش، ضدتقلب و settlement کامل نشده است.
- امتیازات: مدل و قرارداد محصول کامل نشده است.

فلگ‌ها:

```text
NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=false
NEXT_PUBLIC_FEATURE_REFERRALS=false
NEXT_PUBLIC_FEATURE_POINTS=false
FEATURE_SUBSCRIPTIONS_ENABLED=false
FEATURE_REFERRALS_ENABLED=false
FEATURE_POINTS_ENABLED=false
```

تا وقتی backend، frontend، payment entitlement، callback امن، ضدتقلب و تست
چرخه کامل آماده نیستند، این فلگ‌ها روشن نشوند.

## ۱۲. موارد باز و ریسک‌های انتشار عمومی

این پروژه برای staging سخت‌سازی شده، اما هنوز production عمومی نهایی نیست:

1. production database، storage S3 و asset domain مستقل باید ساخته و جدا از staging تنظیم شوند.
2. secretهای واقعی `SECRET_KEY`, `MFA_ENCRYPTION_KEY`, delivery و Turnstile باید در secret manager قرار گیرند.
3. provider واقعی email/SMS برای signup verification و reset باید وصل و از شبکه موبایل smoke test شود.
4. دامنه، CORS، ALLOWED_HOSTS، trusted proxy network/count و cookieهای `__Host-` باید برای مسیر واقعی edge تنظیم شوند.
5. backup/restore دوره‌ای production، retention، alert و runbook عملیاتی لازم است.
6. تست واقعی Android، iPhone Safari، keyboard، safe-area، orientation، back gesture، zoom 200% و WCAG باقی است.
7. load/soak test، timeout/retry/offline UX، logging ساختاریافته، error tracking، metrics و alerting باقی است.
8. HLS همه درس‌ها، subtitleها، مجوز محتوا، URL امضاشده، paywall و entitlement واقعی باید تکمیل شود.
9. support و moderation در حجم واقعی، چند اپراتور و SLA عملیاتی باید آزموده شوند؛ workflow پایه و مرز نقش‌ها در فاز چهار پوشش دارند.
10. GitHub Ruleset باید checkهای `Frontend` و `Backend` را برای merge به `main` اجباری کند.
11. تست نفوذ مستقل و نهایی‌سازی اسناد حقوقی پیش از جذب عمومی کاربر لازم است.
12. PWA/offline عمداً فعال نیست؛ فعال‌سازی مجدد بدون cache/update test ممنوع است.

## ۱۳. نقشه راه بعدی

### فاز چهار: تست بخش‌به‌بخش — دامنه محلی تکمیل، گیت زنده در حال بستن

حالت‌های موفق، خطا، خالی، مالکیت، دسترسی role، قطع شبکه، refresh، race، duplicate
submit، back browser و profileهای موبایل برای ماژول‌های فعال پوشش داده شدند:

- auth/account/security
- profile/showcase/network
- gallery/services
- feed/engagements
- community/articles/questions/support
- chat/notifications
- courses/lessons/subtitles
- dictionary/Leitner/daily activity
- settings/appearance
- admin/moderation

خروجی محلی: ماتریس پذیرش، bug list با P0-P3، contract/integration tests و build
تولیدی سبز. push، CI و deploy قابل مشاهده انجام شده‌اند. اصلاح اتصال DB و smoke
authenticated/role/WebSocket روی Preview محافظت‌شده باقی است.

### فاز پنج: آموزش و رسانه

- حذف hardcodeهای video و transcript
- مدل workflow پیش‌نویس/انتشار برای course/lesson/subtitle
- ثبت media asset و subtitle در DB
- HLS امضاشده و entitlement برای محتوای پولی
- کنترل کیفیت sync، fallback، poster و مجوز محتوا
- ممیزی کامل HSK1-3 و audio

### فاز شش: موبایل و UX

- Android Chrome و iOS Safari واقعی
- safe area، keyboard، fullscreen، orientation و gesture back
- زوم ۲۰۰٪، WCAG 2.2 AA، tap target حداقل ۴۴px
- رفع overflow و بررسی dark mode
- تصمیم آگاهانه برای PWA/install/offline

### فاز هفت: performance و operations

- timeout/retry/offline states
- query/polling و WebSocket در چند replica
- Redis یا backend مشترک برای rate limit و realtime در صورت scale
- CDN/image optimization و کاهش egress Neon
- load/soak test
- Sentry یا error tracking، request ID، structured logs، metrics، health واقعی storage و alert

### فاز هشت: beta و انتشار عمومی

- بتای بسته و جمع‌آوری feedback
- production Neon و storage جدا
- دامنه اصلی، DNS/WAF، email/SMS، Turnstile و درگاه واقعی
- legal approval، backup drill و incident runbook
- rollout مرحله‌ای و rollback آماده
- شرط انتشار: هیچ P0/P1 باز و هیچ Critical/High شناخته‌شده

## ۱۴. فرمان‌های روزمره

### Frontend

```powershell
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
```

### Backend

```powershell
cd backend
poetry check --lock
poetry sync --with dev --no-root
poetry run ruff check --no-cache app tests scripts
poetry run python -m compileall -q app tests scripts
poetry run bandit -q -r app scripts -x tests -lll
poetry run python -m pytest -m "not integration" --cov=app --cov-fail-under=50
poetry run python -m pytest -m integration
poetry run alembic check
poetry run python scripts/verify_phase2_schema.py
poetry run python scripts/verify_phase3_schema.py
poetry run python scripts/verify_phase4_schema.py
```

### Gate کامل

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1 -WithIntegration -WithE2E
```

### Backup/restore

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-database.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\restore-database.ps1 -ConfirmIsolatedTarget
```

restore فقط روی مقصد ایزوله انجام شود.

## ۱۵. فایل‌های مرجع مهم

- `README.md`: bootstrap و quality gates
- `docs/PHASE_0_RELEASE_BASELINE_FA.md`: دامنه ۲۹ تغییر و release policy
- `docs/PHASE_1_QUALITY_BASELINE_FA.md`: CI و quality baseline
- `docs/PHASE_2_DATA_STORAGE_FA.md`: migration، Neon، backup و storage
- `docs/PHASE_3_SECURITY_TRUST_FA.md`: گزارش امنیت و تست نهایی
- `docs/PHASE_3_THREAT_MODEL_FA.md`: مدل تهدید و فرض‌های امنیتی
- `docs/PHASE_4_USER_JOURNEYS_FA.md`: ماتریس پذیرش، bug list و شواهد تست فاز چهار
- `.github/workflows/quality-gates.yml`: pipeline اصلی
- `scripts/check.ps1`: gate محلی
- `scripts/check-release-baseline.ps1`: privacy/release guard
- `backend/app/core/config.py`: قرارداد تنظیمات و fail-closed production
- `backend/app/core/storage.py`, `backend/app/core/uploads.py`, `backend/app/core/paths.py`: فایل و storage
- `backend/app/api/v1/api.py`: ثبت routerهای API
- `backend/alembic/versions/`: تاریخچه schema
- `backend/scripts/verify_phase4_schema.py`: invariantهای workflow پشتیبانی
- `backend/data/dictionary/`: CSVهای canonical HSK
- `frontend/src/app/watch/[domain]/[courseId]/page.tsx`: player و وضعیت hardcode ویدئو

## ۱۶. نتیجه‌ای که باید به Codex جدید گفته شود

«این repository مربوط به ChinVerse است. فازهای صفر تا سه و دامنه automated/local
فاز چهار انجام شده‌اند. شاخه فعلی `codex/phase-4-user-journeys` و release code
`92ae2c40...` است؛ GitHub CI، Vercel Preview و Hugging Face deploy سبزند، اما audit
نشان داد secret دیتابیس HF به Neon production وصل است نه staging. production برای
بازیابی branch نقطه‌زمانی دارد و rollback نشده است. پیش از اعلام پایان فاز چهار،
اتصال را محرمانه به staging منتقل، migration همان branch و live smoke نقش‌ها/چت را
کامل کن. هنوز چیزی روی main merge نشده است. بعد از این گیت، کار منطقی فاز پنج
آموزش و رسانه، سپس موبایل واقعی، performance و گیت‌های production است. هیچ secretی
را در چت یا Git ثبت نکن و فقط از داشبورد provider/secret manager استفاده کن.»
