# ChinVerse | راهنمای کامل انتقال پروژه

> این فایل برای شروع یک چت یا یک Codex جدید نوشته شده است. قبل از هر تغییر، وضعیت Git و فایل‌های همین repository را دوباره بررسی کن؛ این سند snapshot وضعیت پروژه در **۲۱ اوت ۲۰۲۶ / ۳۰ مرداد ۱۴۰۵** است و جایگزین خواندن کد نیست.

## ۱. خلاصه فوری

**ChinVerse** یک وب‌اپلیکیشن فارسی‌محور برای یادگیری زبان چینی است که هم‌زمان
قابلیت‌های شبکه حرفه‌ای، پروفایل عمومی، گالری، خدمات، جامعه، چت و پشتیبانی دارد.

وضعیت فعلی:

- فازهای صفر تا شش برای دامنه خودکار تعریف‌شده انجام شده‌اند. فاز هفت از نظر کد،
  تست، migration، container، load/restore tooling و پذیرش محلی کامل است؛ promotion
  همان SHA به staging و شواهد provider در حال ثبت است. journey سخت‌افزار واقعی و
  assistive technology دستی فاز شش همچنان evidence gap هستند.
- شاخه فعلی `codex/phase-7-performance-operations` است؛ SHA نهایی release پس از
  promotion immutable در گزارش فاز هفت ثبت می‌شود.
- frontend زنده فاز شش همان SHA را گزارش می‌کند. backend زنده طبق انتظار روی
  release فاز پنج `3b3a918a66ea7df875965130ff86c7d1a1227576` باقی مانده است.
- release قبلی فاز چهار `92ae2c40a29afb9a15b8fcb8d4500213ef27b253` بود.
- commit مبنای شاخه پیش از تغییرات فاز چهار: `3f63addf1e6b9f3c79f83044545f2d7a375f08db`
- وضعیت دقیق commit/worktree را با Git بررسی کن؛ چند Codex روی پروژه کار می‌کنند و این سند را نباید جایگزین Git دانست.
- GitHub Quality Gates فاز شش در [run 32419922159](https://github.com/MoAminPourzare/Chinverse/actions/runs/32419922159)
  برای `Release baseline`، `Frontend` و `Backend` سبز است. deploy تاریخی Hugging
  Face فاز پنج در [run 31883881897](https://github.com/MoAminPourzare/Chinverse/actions/runs/31883881897) موفق است.
- backend با tier=`staging` روی Hugging Face اجرا می‌شود و به branch دائمی Neon
  staging با head فاز پنج `b5e7c9d1f3a2` متصل است؛ health/readiness زنده سبز است.
- frontend فاز شش روی Vercel Preview محافظت‌شده است. Share موقت smoke revoke شده
  و درخواست ناشناس HTTPS دوباره با `302` به SSO هدایت می‌شود.
- **روی `main` merge نشده‌ایم.** قبل از merge به main باید تصمیم انتشار و گیت‌های باقی‌مانده با مالک پروژه تأیید شوند.

گزارش فاز هفت در `docs/PHASE_7_PERFORMANCE_OPERATIONS_FA.md`، گزارش فاز شش در
`docs/PHASE_6_MOBILE_UX_FA.md` و گزارش فاز پنج در
`docs/PHASE_5_EDUCATION_MEDIA_FA.md` و گزارش فاز چهار در
`docs/PHASE_4_USER_JOURNEYS_FA.md` است. گام فعلی تکمیل journeyهای دستگاه واقعی و
assistive technology دستی است؛ ۳۵۰ بازبینی provenance انسانی پیش از انتشار عمومی محتوای موجود
همچنان باز است.

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
| branch کاری | `codex/phase-7-performance-operations`؛ release candidate محلی |
| frontend staging/preview | [stable branch URL فاز شش](https://chinverse-git-codex-phase-6-mobile-ux-death-stroke.vercel.app)؛ deployment=`FpnJXHMegQdxiceuU1WutAAnNdCJ` و [generated URL](https://chinverse-nndh54sbt-death-stroke.vercel.app)، محافظت‌شده با SSO |
| frontend alias قبلی | `https://chinverse.vercel.app`؛ تا merge به main مرجع فاز سه نیست |
| backend staging | [Hugging Face Space](https://moamin9-chinverse-api.hf.space) |
| database target | Neon staging؛ migration فاز پنج تا head=`b5e7c9d1f3a2` هنگام startup موفق و readiness دیتابیس `ok` است |
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
- migration آموزش و رسانه فاز پنج:
  `b5e7c9d1f3a2_add_phase5_education_media_workflow`
- migration performance/realtime فاز هفت:
  `e7c4a9b2d6f1_add_phase7_chat_operations`
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
poetry run python scripts/verify_phase5_schema.py
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
- backend fixture tool ایمن و opt-in live Playwright harness اضافه شدند تا چهار
  نقش synthetic را با identity قطعی بسازند، smoke کنند و با guardهای endpoint،
  schema، FK، storage و scope دقیق پاک کنند.
- اتصال HF به Neon staging اصلاح، password آن rotate، TLS دیتابیس و نام cookie
  سخت‌سازی و smoke کامل BFF/MFA/forum/report/support/chat/session/WebSocket اجرا شد.
- چهار fixture دقیقاً پاک و bypass موقت Vercel revoke شد؛ ممیزی نهایی هیچ fixture
  یا bypass معتبر باقی‌مانده نشان نداد.

## ۱۰. تست و شواهد نهایی

### فاز شش — release خودکار کامل؛ شواهد سخت‌افزاری ناقص

- زیرساخت `visualViewport`، safe-area چهارطرفه، keyboard inset، standalone و
  orientation پیاده شده است. keyboard فقط با focus قابل‌ویرایش و scale نزدیک ۱
  تشخیص داده می‌شود تا pinch zoom به‌اشتباه keyboard محسوب نشود.
- navigation داخلی path/query/hash را با marker همان session دنبال می‌کند؛ stack
  کهنه و ورود مستقیم fail-closed هستند و fallback خارجی پذیرفته نمی‌شود. تغییر
  pathname نیز live announcement و focus محافظه‌کارانه heading/main دارد.
- player دارای fullscreen استاندارد و fallback CSS برای iOS Safari، خروج با
  Escape/back، safe-area و lock/unlock اختیاری orientation است.
- dark mode پیش از hydration، حداقل tap target غیر-inline، focus visible،
  forced-colors، prefers-contrast و reduced-motion پوشش دارند. suite جداگانه
  `@axe-core/playwright` مسیرهای عمومی اصلی را با tagهای WCAG 2.2 A/AA و حالت‌های
  منتخب dark بررسی می‌کند؛ نتیجه خودکار جای تست دستی screen reader نیست.
- PWA اکنون فعال است: manifest installable، install prompt Chromium، راهنمای نصب
  Safari/iOS، update UX، offline HTML/CSS مستقل و service worker release-scoped.
  cache فقط shell و asset عمومی allowlistشده را می‌پذیرد و API/upload/media/private
  media را cache نمی‌کند؛ cacheهای release و legacy قبلی پاک می‌شوند.
- `npm run check` محلی سبز است: ۴۸ unit test، پوشش `93.48%` statement و
  `94.28%` line، lint/typecheck سبز و build تولیدی برابر ۶۵ route.
- اجرای نهایی محلی Phase 6 روی production build برابر `65 collected`، `63 passed`،
  دو skip مورد انتظار cross-engine و صفر failure در ۱٫۹ دقیقه است. skipها قرارداد
  install event اختصاصی Chromium و راهنمای اختصاصی Safari/WebKit هستند؛ سناریوی
  worker/update/cache Chromium نیز پس از اتصال worker قبلی به release authoritative
  `/api/health` جداگانه در ۸٫۱ ثانیه سبز شد.
- `npm audit` frontend صفر vulnerability شناخته‌شده گزارش کرد.
- release code=`1219342ce50139c1ac6a109ad7f1cb23ba2b7bab` و GitHub
  [Quality Gates run 32419922159](https://github.com/MoAminPourzare/Chinverse/actions/runs/32419922159)
  برای jobهای Backend، Release baseline و Frontend سبز است.
- Vercel deployment=`FpnJXHMegQdxiceuU1WutAAnNdCJ` با
  [stable branch URL](https://chinverse-git-codex-phase-6-mobile-ux-death-stroke.vercel.app)
  deploy شد. `/api/health` همان SHA دقیق، `/explore/hsk` empty-state سالم و BFF با
  trailing slash نهایی `200` را تأیید کردند.
- HF health/ready سبز است و backend طبق انتظار release فاز پنج را گزارش می‌کند.
  Share موقت Vercel پس از smoke revoke شد و anonymous HTTPS اکنون `302` به SSO است.
- BrowserStack دستگاه‌های واقعی iPhone 15/iOS 17.4، iPhone 15 Plus/iOS 17.1،
  iPhone 13 Pro/iOS 15.6، iPhone 16e/iOS 18.3، Galaxy S24/Android 14/Chrome و
  Galaxy S25/Android 15/Chrome را
  launch کرد. keyboard/focus واقعی Safari روی iPhone 16e شاهد تصویری دارد، اما
  Trial یک‌دقیقه‌ای و onboarding/boot اجازه نداد ChinVerse پیش از قطع session روی
  دستگاه دیده و journey آن کامل شود.
- بنابراین edge-back، rotation، fullscreen، PWA install/update/offline، journeyهای
  app روی دستگاه واقعی و VoiceOver/TalkBack هنوز evidence gap هستند. profileهای
  Pixel 5 و iPhone 13 در Playwright فقط emulation بوده‌اند.

### Release فاز پنج — deploy و smoke‌شده

- Backend unit: `127 passed` با پوشش `58.59%`.
- Backend integration: `25 passed` روی PostgreSQL ایزوله.
- Frontend unit: `36 passed` با پوشش `93.48%` statement؛ lint و typecheck سبز و production build برابر
  `63 route` است.
- چرخه migration واقعی `base -> head -> base -> head` تا
  `b5e7c9d1f3a2` سبز است؛ verifier فاز پنج و parity مدل/schema اجرا شده‌اند.
- پنل ادمین workflow ساخت course/section/lesson، ثبت و review/publish رسانه،
  ingest/validate/publish زیرنویس و publish درس/دوره را ارائه می‌دهد.
- public course/lesson DTO فقط metadata allowlistشده می‌دهد و هیچ `video_url`،
  `file_url`، `storage_key` یا provider URL خامی منتشر نمی‌کند. mount خام videos و
  thumbnails نیز حذف شده است.
- course media در S3 از bucket خصوصی مستقل استفاده می‌کند؛ تنظیم یکی‌بودن bucket
  عمومی/خصوصی fail-closed است. publish checksum و size واقعی و graph محدود HLS را
  برای playlistها و resourceهای referenced تأیید می‌کند.
- cover/poster عمومی URL پایدار و opaque در
  `/api/v1/media/public-images/{media_id}` دارد؛ revoke مجوز/انتشار آن را 404 می‌کند.
- audit دسترسی، issue و entitlement denial قابل‌اعتماد را نگه می‌دارد، اما token/
  شناسه جعلی و هر segment موفق را به DB یا log per-request نمی‌نویسد تا write
  amplification ایجاد نشود.
- registry شامل ۳۴۷ asset و سه CSV، در مجموع ۳۵۰ مورد `review_required` است. این
  blocker انتشار عمومی محتواست؛ فقط Preview محافظت‌شده پیش از تکمیل provenance مجاز است.
- release SHA=`3b3a918a66ea7df875965130ff86c7d1a1227576`؛ [Quality Gates run 31883881871](https://github.com/MoAminPourzare/Chinverse/actions/runs/31883881871) و [deploy run 31883881897](https://github.com/MoAminPourzare/Chinverse/actions/runs/31883881897) موفق‌اند.
- Hugging Face Space commit=`16ba7967240bc24ade18397697f9b56df233bac3` و runtime=`RUNNING` است؛ health همان release SHA و readiness دیتابیس `ok` را برمی‌گرداند. OpenAPI عمومی `404` است.
- [Vercel Preview فاز پنج](https://chinverse-git-codex-phase-5-education-media-death-stroke.vercel.app) محافظت‌شده است و درخواست ناشناس را به SSO هدایت می‌کند.

### شواهد release فاز چهار — تاریخی و محیط قبلی

CI کامل فاز چهار و شواهد release candidate زیر ثبت شده‌اند:

- Release baseline: success
- Frontend: success؛ lint، typecheck، unit/coverage، build و Playwright
- Backend: success؛ audit، Ruff، compileall، Bandit، unit، migration، integration، rollback/rebuild و Docker
- Backend unit روی release code: `66 passed`, `14 deselected`
- Backend coverage با gate حداقل `50%`
- Backend integration روی release code: `14 passed`
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
- verification نهایی ابزار fixture: `78 passed`, `15 deselected` برای unit و
  `15 passed` برای integration روی PostgreSQL ایزوله.
- live Playwright harness بدون opt-in به‌درستی discovery و `1 skipped` شد؛ اجرای
  stateful واقعی آن جداگانه روی staging با retry صفر و یک worker انجام شد.

Smoke test زنده Hugging Face:

| مسیر | نتیجه |
| --- | --- |
| `/health` | ۲۰۰، `status=ok`، tier=`staging`، release=`92ae2c40...` |
| `/health/ready` | ۲۰۰، `database=ok` |
| `/docs` | ۴۰۴ |
| `/api/v1/users/me` بدون token | ۴۰۱ |
| GET واقعی با Origin نامعتبر | ۴۰۳؛ proxy HF ممکن است preflight را خودش ۲۰۰ پاسخ دهد، اما درخواست app رد می‌شود |
| CSP/HSTS/noindex/tier headers | تأیید شد |

تنظیمات نهایی backend staging:

- branch Neon برابر `br-shiny-darkness-at6obb2e`، endpoint برابر
  `ep-wild-band-atse2yoq` و Alembic head برابر `a2c4e6f8b1d3` است.
- secret `DATABASE_URL` در HF به همین staging منتقل و password دیتابیس rotate شد.
- اتصال دیتابیس با `sslmode=verify-full` و مقدار عمومی
  `PGSSLROOTCERT=/etc/ssl/certs/ca-certificates.crt` certificate و hostname را
  بررسی می‌کند؛ fixture tool نیز SSLContext صریح با CA سیستم می‌سازد. DSN ارائه‌دهنده
  باید `channel_binding=require` داشته باشد، اما `asyncpg` فعلی این گزینه‌ی libpq را
  پشتیبانی نمی‌کند و کد آن را حذف می‌کند؛ channel binding اجرایی ادعا نمی‌شود.
- `REFRESH_COOKIE_NAME=__Host-chinverse_refresh` است؛ cookie واقعی `HttpOnly`،
  `Secure`، `SameSite=Strict`، `Path=/` و host-only تأیید شد.
- HF پس از restart در وضعیت `RUNNING` با یک replica بود و `/health` و
  `/health/ready` هر دو `200` پاسخ دادند.

smoke stateful کامل از Preview محافظت‌شده، BFF و HF staging این مسیرها را تأیید کرد:

- login چهار نقش، مرز user/moderator/admin، admin MFA setup/confirm، revoke نشست
  setup و دسترسی MFA-protected ادمین؛
- forum ownership، duplicate/self report، صف و claim/resolve moderation، اعلان‌ها
  و role hierarchy؛
- support ownership، صف فقط-admin، منع close بدون reply، ثبت reply/close و اعلان؛
- block دوطرفه‌ی chat و unblock؛
- WebSocket واقعی شامل رد Origin نامعتبر با `403`، الزام auth-first، ready،
  ping/pong، message broadcast، read receipt، reconnect و close code `1008` برای
  frame پیش از auth و پس از session revoke؛
- session ownership، revoke میان‌کاربری و همان‌کاربر، access token قدیمی/تازه؛
- refresh rotation در BFF، رد replay با `401` و رد mutation بدون Origin با `403`.

چهار حساب synthetic قطعی فقط روی staging ساخته شدند. cleanup transaction دقیقاً
همان چهار حساب و graph تست را حذف کرد و ممیزی نهایی برای user/report/action/message/
ticket/notification/session مقدار صفر داد. bypass موقت Vercel بلافاصله revoke و
نامعتبرشدن مقدار قبلی مستقلاً تأیید شد. هیچ secret یا هویت موقت در Git/سند ثبت نشد.

ابزارهای تکرار این گیت:

- `backend/scripts/phase4_staging_fixtures.py`
- `backend/tests/test_phase4_staging_fixtures.py`
- `backend/tests/integration/test_phase4_staging_fixtures_integration.py`
- `frontend/e2e/phase4-live-staging.spec.ts`
- `frontend/e2e/PHASE4_LIVE_STAGING.md`

fixture tool به‌صورت پیش‌فرض dry-run است و apply را فقط برای endpoint/head دقیق
staging، run id قطعی و scope cleanup اثبات‌شده می‌پذیرد. harness identity override،
retry و artifactهای حساس را غیرفعال می‌کند.

رخداد migration تولید: پیش از اصلاح secret، HF به Neon production
`br-cold-salad-at44rvqh` اشاره داشت و startup migration آن branch را از
`d3a7f9c2e5b1` به migration افزایشی `a2c4e6f8b1d3` رساند. نقاط بازیابی زیر ساخته
و بررسی شدند:

- staging snapshot: `phase4-predeploy-92ae2c4` / `br-misty-grass-atc88xt5`
- production point-in-time: `phase4-prod-pre-migration-92ae2c4` /
  `br-billowing-silence-atxtvddd` با revision `d3a7f9c2e5b1`

روی production rollback انجام نشد و هیچ داده یا fixture تستی وارد آن نشد؛ migration
افزایشی موجود باقی مانده و PIT branch مسیر recovery محفوظ است. live smoke فقط پس
از انتقال secret روی staging اجرا شد.

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
6. پیاده‌سازی و emulation خودکار موبایل/WCAG در فاز شش انجام شده، اما تست واقعی
   Android Chrome و iPhone Safari برای keyboard، safe-area/notch، orientation،
   fullscreen، back gesture، zoom 200%، install/update/offline و screen reader باقی است.
7. load/soak test، timeout/retry/offline UX، logging ساختاریافته، error tracking، metrics و alerting باقی است.
8. workflow فنی HLS/subtitle/URL امضاشده/entitlement در فاز پنج پیاده شده است؛
   ورود محتوای واقعی، تکمیل provenance ۳۵۰ مورد، پلن storage تولید و smoke همه درس‌ها
   پیش از انتشار عمومی باقی است.
9. support و moderation در حجم واقعی، چند اپراتور و SLA عملیاتی باید آزموده شوند؛ workflow پایه و مرز نقش‌ها در فاز چهار پوشش دارند.
10. GitHub Ruleset باید checkهای `Frontend` و `Backend` را برای merge به `main` اجباری کند.
11. تست نفوذ مستقل و نهایی‌سازی اسناد حقوقی پیش از جذب عمومی کاربر لازم است.
12. PWA با cache release-scoped و denylist داده خصوصی فعال است و gate محلی، CI،
    Preview و smoke آن سبزند؛ install/update/offline روی دستگاه واقعی و شواهد
    عمومی محتوا همچنان مانع ادعای آمادگی انتشار عمومی‌اند.

## ۱۳. نقشه راه بعدی

### فاز چهار: تست بخش‌به‌بخش — تکمیل‌شده

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

خروجی: ماتریس پذیرش، bug list با P0-P3، contract/integration tests، build تولیدی،
push/CI/deploy قابل مشاهده، اتصال صحیح Neon staging و smoke کامل
authenticated/role/WebSocket روی Preview محافظت‌شده. fixtureها پاک و bypass revoke
شده‌اند و برای قابلیت‌های فعال هیچ P0/P1 باز نیست. رسانه، موبایل واقعی، performance
و operations در فازهای پنج به بعد و خارج از scope این فاز هستند.

### فاز پنج: آموزش و رسانه — تکمیل و deploy محافظت‌شده

- hardcodeهای video/transcript و fallback شناسه‌ای از runtime player حذف شده‌اند.
- workflow `draft/published/archived` برای course/lesson/subtitle/media و پنل ادمین پیاده شده است.
- media asset و subtitle revisionدار در DB، HLS امضاشده، entitlement واقعی و Range پوشش دارند.
- raw mount و provider/storage metadata عمومی حذف شده و bucket خصوصی S3 قرارداد fail-closed دارد.
- checksum/size فایل، graph محدود HLS، sync زیرنویس و URL پایدار cover/poster کنترل می‌شوند.
- HSK1-3 از نظر ساختاری ممیزی شده؛ ۳۵۰ مورد provenance مانع انتشار عمومی است، نه Preview محافظت‌شده.
- release `3b3a918a66ea7df875965130ff86c7d1a1227576` با CI، deploy و smoke زنده موفق است؛ Hugging Face Space commit برابر `16ba7967240bc24ade18397697f9b56df233bac3` و runtime در وضعیت `RUNNING` است.

### فاز شش: موبایل و UX — خودکار کامل، سخت‌افزار ناقص

- viewport، safe-area، keyboard/pinch، fullscreen، orientation، safe back و SPA
  focus/announcement در کد پیاده شده‌اند.
- زوم متنی ۲۰۰٪، WCAG 2.2 A/AA خودکار، keyboard focus، tap target حداقل ۴۴px،
  dark mode و overflow در suiteهای Phase 6 پوشش دارند.
- PWA/install/update/offline با manifest، service worker release-scoped، offline
  shell مستقل و cache policy بدون داده خصوصی پیاده شده است.
- `npm run check` با ۴۸ unit و suite کامل Phase 6 روی production build سبزند: ۶۵
  collected، ۶۳ passed، دو skip مورد انتظار cross-engine و صفر failure؛ npm audit صفر است.
- release `1219342ce50139c1ac6a109ad7f1cb23ba2b7bab`، CI، Vercel Preview محافظت‌شده
  و smoke زنده همان SHA کامل‌اند.
- شش دستگاه واقعی BrowserStack launch شدند و keyboard/focus سیستم Safari روی
  iPhone 16e شاهد دارد، اما خود ChinVerse به‌علت Trial یک‌دقیقه‌ای پیش از قطع session
  دیده/تست نشد. journeyهای سخت‌افزاری و assistive technology دستی pending هستند؛
  emulation هرگز به‌عنوان تست دستگاه واقعی ثبت نمی‌شود.

### فاز هفت: performance و operations

- timeout/retry/offline UX با یک retry owner و رعایت `Retry-After` کامل است.
- polling تطبیقی، WebSocket ping/pong deadline و PostgreSQL realtime relay/presence
  برای چند replica پیاده و با concurrency واقعی integration تست شده‌اند.
- query/indexهای چت، image optimizer allowlist، cache/egress policy و performance
  budget داخل CI هستند.
- runner ایمن smoke/load/soak، monitor alert/recovery، structured logs، request ID،
  metrics، readiness واقعی DB/storage و rollback runbook کامل‌اند.
- Sentry SDK و scrubber بدون PII آماده ولی fail-closed و خاموش است؛ org/project/DSN
  و source-map upload فقط پس از تأیید صریح مالک در secret manager فعال می‌شود.
- gate محلی: frontend `81` unit، backend `161` unit + `28` integration، E2E برابر
  `150 passed/5 skipped` و چرخه کامل migration/container سبز است. restore محلی
  PostgreSQL 18.4 تا head `e7c4a9b2d6f1` موفق است؛ deploy/load/soak زنده در گزارش
  فاز هفت ثبت می‌شود.

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
poetry run python scripts/verify_phase5_schema.py
poetry run python scripts/verify_phase7_schema.py
```

### Gate کامل

```powershell
pwsh -NoProfile -File .\scripts\check.ps1 -WithIntegration -WithE2E
```

### Backup/restore

```powershell
pwsh -NoProfile -File .\scripts\backup-database.ps1
pwsh -NoProfile -File .\scripts\restore-database.ps1 -ConfirmIsolatedTarget
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
- `docs/PHASE_5_EDUCATION_MEDIA_FA.md`: workflow، entitlement، player، تست و وضعیت pre-release فاز پنج
- `docs/PHASE_5_DATA_LICENSE_AUDIT_FA.md`: قرارداد ممیزی dictionary و provenance رسانه
- `docs/PHASE_6_MOBILE_UX_FA.md`: معیار پذیرش، پیاده‌سازی، تست‌های خودکار و blockerهای فاز شش
- `docs/PHASE_7_PERFORMANCE_OPERATIONS_FA.md`: قرارداد performance/operations و شواهد فاز هفت
- `docs/PHASE_7_ROLLBACK_RUNBOOK_FA.md`: alert، rollback و recovery staging
- `.github/workflows/quality-gates.yml`: pipeline اصلی
- `scripts/check.ps1`: gate محلی
- `scripts/check-release-baseline.ps1`: privacy/release guard
- `backend/app/core/config.py`: قرارداد تنظیمات و fail-closed production
- `backend/app/core/storage.py`, `backend/app/core/uploads.py`, `backend/app/core/paths.py`: فایل و storage
- `backend/app/api/v1/api.py`: ثبت routerهای API
- `backend/alembic/versions/`: تاریخچه schema
- `backend/scripts/verify_phase4_schema.py`: invariantهای workflow پشتیبانی
- `backend/scripts/verify_phase5_schema.py`: invariantهای workflow آموزش و رسانه
- `backend/scripts/verify_phase7_schema.py`: invariant و plan/indexهای realtime/chat
- `backend/scripts/phase7_load_test.py`: runner محدود smoke/load/soak staging
- `backend/data/dictionary/`: CSVهای canonical HSK
- `frontend/src/app/watch/[domain]/[courseId]/page.tsx`: player امن API-driven و sync زیرنویس
- `frontend/src/components/layout/MobileUxController.tsx`, `frontend/src/lib/mobileUx.ts`: viewport، keyboard، orientation، navigation و SPA accessibility
- `frontend/src/components/pwa/PwaProvider.tsx`, `frontend/public/sw.js`: install/update/offline و cache policy PWA
- `frontend/e2e/phase6-mobile-ux.spec.ts`, `frontend/e2e/phase6-accessibility.spec.ts`, `frontend/e2e/phase6-pwa.spec.ts`: gateهای مرورگر فاز شش

## ۱۶. نتیجه‌ای که باید به Codex جدید گفته شود

«این repository مربوط به ChinVerse است. فازهای صفر تا شش در دامنه تعریف‌شده انجام
شده‌اند و شاخه کاری `codex/phase-7-performance-operations` است. فاز هفت از نظر
timeout/retry/offline، polling و realtime چند replica، image/performance budget،
structured logging/request ID/metrics، DB+storage readiness، load/soak tooling،
alert و rollback/restore پیاده و محلی پذیرفته شده است. frontend برابر ۸۱ unit با
پوشش ۹۳٫۴۸٪ statement، backend برابر ۱۶۱ unit و ۲۸ integration، E2E production
برابر ۱۵۰ passed/۵ skip مورد انتظار و migration/container کامل سبز است. Sentry
SDK و scrubber آماده اما بدون تأیید مالک/DSN خاموش است. promotion و شواهد زنده
release را از `docs/PHASE_7_PERFORMANCE_OPERATIONS_FA.md` بخوان. evidence gapهای
دستگاه واقعی/assistive technology فاز شش و ۳۷۹ finding ثبت‌شده provenance/content
review مانع ادعای آمادگی انتشار عمومی‌اند. هیچ secretی را در چت یا Git ثبت نکن و
فقط از dashboard/secret manager استفاده کن.»
