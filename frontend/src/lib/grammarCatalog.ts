import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

const baijiaGrammarLessons = [
    { title: "第1课", subtitle: "1.1 能愿动词1：想、要" },
    { title: "第1课", subtitle: "1.2 能愿动词2：能、会、可以" },
    { title: "第1课", subtitle: "1.3 概数的表达法：大约、来、左右、多" },
    { title: "第2课", subtitle: "2.1 “的”字结构" },
    { title: "第2课", subtitle: "2.2 结构助词“地”" },
    { title: "第2课", subtitle: "2.3 动态助词“着”表示伴随" },
    { title: "第2课", subtitle: "2.4 句尾“了”表完成" },
    { title: "第2课", subtitle: "2.5 动词短语做定语" },
    { title: "第3课", subtitle: "3.1 同比句：跟……一样" },
    { title: "第3课", subtitle: "3.2 比较句1：基本式" },
    { title: "第3课", subtitle: "3.3 比较句2：基本式+精确量" },
    { title: "第4课", subtitle: "4.1 连动句：表示方式" },
    { title: "第4课", subtitle: "4.2 双宾语句" },
    { title: "第4课", subtitle: "4.3 兼语句" },
    { title: "第5课", subtitle: "5.1 时量补语" },
    { title: "第5课", subtitle: "5.2 动量补语" },
    { title: "第5课", subtitle: "5.3 简单趋向补语" },
    { title: "第5课", subtitle: "5.4 复合趋向补语" },
    { title: "第5课", subtitle: "5.5 可能补语" },
    { title: "第5课", subtitle: "5.6 复杂程度补语" },
    { title: "第6课", subtitle: "6.1 “把”字句：A把B+V+结果补语" },
    { title: "第6课", subtitle: "6.2 “把”字句：V+成" },
    { title: "第6课", subtitle: "6.3 “把”字句：V+给" },
    { title: "第6课", subtitle: "6.4 “把”字句：V+趋向补语" },
    { title: "第6课", subtitle: "6.5 “把”字句：V+其他成分" },
    { title: "第7课", subtitle: "7.1 反问句1：不是……吗？" },
    { title: "第7课", subtitle: "7.2 反问句2：难道……吗？" },
    { title: "第7课", subtitle: "7.3 疑问代词表示反问" },
    { title: "第7课", subtitle: "7.4 疑问代词表示任指" },
];

/** Reference-based page plan; the public API remains the source of published lessons. */
export const GRAMMAR_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "chinese-zero-to-hero-grammar",
        title: "Chinese Zero to Hero",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Chinese Zero to Hero.jpeg`,
        lessonCount: 7,
        countSummary: "7 سطح · 175 درس",
        lessonGroupCounts: { 1: 23, 2: 29, 3: 31, 4: 34, 5: 32, 6: 21, 7: 5 },
        description: [
            "دوره‌ی گرامر Chinese Zero to Hero یه آموزش کاملاً ساختارمند و سطح‌بندی‌شده‌ست که گرامر چینی رو دقیقاً بر اساس استانداردهای HSK جلو می‌بره. این دوره برای زبان‌آموزایی طراحی شده که دوست دارن بدون ابهام و پراکندگی، قدم‌به‌قدم جلو برن و بدونن هر مبحث دقیقاً مربوط به کدوم سطحه. توضیح‌ها روشن، طبقه‌بندی‌شده و همراه با مثال‌های هدفمند هستن و معمولاً بعد از هر نکته‌ی گرامری، تمرین‌های تعاملی یا تستی میاد تا یادگیری تثبیت بشه.",
            "برخلاف بعضی دوره‌های ساختارنا‌محور، اینجا ساختار کاملاً سیستماتیکه؛ یعنی هر مبحث جای مشخصی تو نقشه‌ی یادگیری داره. تمرکز روی کاربرد عملی گرامره، مخصوصاً برای خواندن، درک مطلب و آمادگی آزمون. توضیح‌ها معمولاً مقایسه‌ای هم هستن؛ مثلاً تفاوت ساختارهای مشابه یا اشتباهات رایج زبان‌آموزها رو مشخص می‌کنن. این باعث می‌شه دوره برای کسانی که دنبال نظم و چارچوب مشخص هستن خیلی مناسب باشه.",
        ],
        audience: [
            "مبتدی تا متوسط (بر اساس سطح HSK انتخابی)",
            "زبان‌آموزانی که برای آزمون HSK آماده می‌شن",
            "افرادی که دوست دارن گرامر رو طبقه‌بندی‌شده و سیستماتیک یاد بگیرن",
            "کسانی که با منابع پراکنده سردرگم می‌شن و یه مسیر مشخص نیاز دارن",
        ],
        knownLessonTitles: {
            1: "HSK1 Grammar", 2: "HSK2 Grammar", 3: "HSK3 Grammar", 4: "HSK4 Grammar",
            5: "HSK5 Grammar", 6: "HSK6 Grammar", 7: "HSK7-9 Grammar",
        },
        knownLessonSubtitles: {
            1: "23课", 2: "29课", 3: "31课", 4: "34课", 5: "32课", 6: "21课", 7: "5课",
        },
        knownLessonThumbnails: {
            1: `${assetRoot}/HSK Grammar/hqdefault (6).jpg`,
            2: `${assetRoot}/HSK Grammar/hqdefault (5).jpg`,
            3: `${assetRoot}/HSK Grammar/hqdefault (2).jpg`,
            4: `${assetRoot}/HSK Grammar/hqdefault (1).jpg`,
            5: `${assetRoot}/HSK Grammar/hqdefault.jpg`,
            6: `${assetRoot}/HSK Grammar/hqdefault (3).jpg`,
            7: `${assetRoot}/HSK Grammar/hqdefault (4).jpg`,
        },
    },
    {
        slug: "baijia-talk-grammar",
        title: "百家Talk (初级汉语语法进阶)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: baijiaGrammarLessons.length,
        chapterCount: 7,
        description: [
            "دوره‌ی ارتقای گرامر چینی مقدماتی «初级汉语语法进阶» از مجموعه‌ی 百家Talk یک آموزش تحلیلی و ساختارمند برای کسانیه که گرامر پایه‌ی چینی رو خوندن اما هنوز موقع جمله‌سازی تردید دارن. اینجا تمرکز روی فهم عمیق ساختار جمله‌ست؛ یعنی فقط حفظ کردن الگوها نیست، بلکه توضیح داده می‌شه چرا جمله این‌طوری ساخته می‌شه، جای قید کجاست، کاربرد درست 了 چیه، ساختار 把 و 被 چه تفاوتی ایجاد می‌کنه و چطور ترتیب اجزای جمله معنی رو تغییر می‌ده.",
            "سبک آموزش بیشتر شبیه یک کلاس جدی و توضیح‌محوره تا آموزش مکالمه‌محور. مدرس معمولاً مثال‌های متعدد می‌زنه و ساختارها رو باز می‌کنه تا زبان‌آموز از حالت ترجمه‌ی کلمه‌به‌کلمه خارج بشه و به منطق درونی جمله‌ی چینی عادت کنه. این دوره بیشتر برای تثبیت و ارتقای درک گرامری طراحی شده تا تمرین گفتار روزمره.",
        ],
        audience: [
            "سطح مبتدی رو به پیش‌متوسط",
            "زبان‌آموزانی که HSK 1 و HSK 2 رو گذروندن",
            "افرادی که تو جمله‌سازی اشتباه ساختاری زیاد دارن",
            "کسانی که می‌خوان پایه‌ی گرامرشون قبل از ورود به سطح متوسط محکم بشه",
        ],
        knownLessonTitles: Object.fromEntries(baijiaGrammarLessons.map((lesson, index) => [index + 1, lesson.title])),
        knownLessonSubtitles: Object.fromEntries(baijiaGrammarLessons.map((lesson, index) => [index + 1, lesson.subtitle])),
    },
    {
        slug: "yoyo-chinese-grammar",
        title: "Yoyo Chinese (Grammar)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Yoyo Chinese.png`,
        lessonCount: 10,
        description: [
            "دوره گرامر یویو چاینیز یه دوره‌ی جمع‌وجور و کاربردیه که میاد سراغ چند تا از مهم‌ترین و چالش‌برانگیزترین نکته‌های گرامری. قرار نیست همه‌ی گرامر چینی رو کامل و خط‌به‌خط پوشش بده؛ بیشتر تمرکزش روی جاهاییه که معمولاً زبان‌آموزها قاطی می‌کنن. مثلاً قانون طلایی ترتیب کلمات رو جوری توضیح میده که بالاخره بفهمی زمان و مکان دقیقاً باید کجای جمله بیان، یا سؤال پرسیدن با «چه»، «چطور»، «چند» و «چقدر» رو مرحله‌به‌مرحله باز می‌کنه. همین‌طور با مکمل نتیجه، مکمل جهت و ساختار «除了…之外» هم آشنات می‌کنه و با مثال‌های واضح نشون میده چطور تو جمله استفاده‌شون کنی.",
            "فضای آموزش مثل بقیه‌ی درس‌های یویو صمیمی و روونه؛ حس کلاس خشک و رسمی نداره. اول کاربرد رو می‌بینی، بعد منطقش رو می‌فهمی. فقط حواست باشه این یه دوره‌ی جامع گرامر نیست، بیشتر یه مجموعه‌ی هدفمند برای روشن شدن چند تا مبحث مهمه. اگه دنبال یه جمع‌بندی سبک و کاربردی از نکته‌های کلیدی هستی، انتخاب خوبیه.",
        ],
        audience: [
            "مبتدی رو به پیش‌متوسط",
            "کسایی که تو ترتیب جمله و سؤال‌سازی مشکل دارن",
            "افرادی که دنبال توضیح ساده و کاربردی چند مبحث کلیدی هستن، نه یک دوره جامع",
        ],
        knownLessonSubtitles: {
            1: "The Golden Rule of Chinese Word Order",
            2: "Chinese word order practice",
            3: "How to ask and answer content questions in Chinese",
            4: "Complement of Result in Chinese (Part 1)",
            5: "Introduction to complement of direction",
            6: 'How to Ask a Question with "What" in Chinese',
            7: 'How to Ask a Question with "How" in Chinese',
            8: 'How to ask "How Much" and "How Many" in Chinese',
            9: 'How to use 除了...之外 to say "besides" in Chinese',
            10: 'How to say “these”, “those” and “which ones” in Chinese using 些 (xiē)',
        },
    },
    {
        slug: "grace-mandarin-grammar",
        title: "Grace Mandarin (Grammar)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Grace Mandarin.png`,
        lessonCount: 7,
        description: [
            "دوره گرامر گریس ماندارین یه دوره‌ی جمع‌وجوره که میره سراغ چند تا از حساس‌ترین و گیج‌کننده‌ترین نکته‌های چینی. تمرکزش روی ساختارهایی مثل «才»، «就»، «都» و همین‌طور «了» هست؛ مخصوصاً اینکه کی باید ازش استفاده کنی و کی اصلاً لازم نیست بیاد. یه توضیح جالب هم درباره‌ی دو هجایی شدن کلمه‌ها داره که کمک می‌کنه طبیعی‌تر حرف بزنی.",
            "این دوره جامع کل گرامر نیست، بیشتر یه تمرکز عمیق روی چند مبحث مهمه که معمولاً زبان‌آموزها توش اشتباه می‌کنن. توضیح‌ها روشن و کاربردیه و با فضای ماندارین تایوانی و نوشتار سنتی ارائه میشه.",
        ],
        audience: [
            "پیش‌متوسط",
            "کسایی که با «了» هنوز مشکل دارن",
            "افرادی که تفاوت «就» و «才» براشون مبهمه",
            "زبان‌آموزایی که می‌خوان جمله‌هاشون دقیق‌تر و طبیعی‌تر بشه",
        ],
        knownLessonSubtitles: {
            1: 'Learn How to Use “就 jiù” (Part 1)',
            2: 'Learn How to Use “就 jiù” (Part 2)',
            3: 'Learn How to Use “才 cái”',
            4: 'The Ultimate Guide to Using “都 dōu”',
            5: "Why Chinese Needs Two Syllable Words",
            6: "Start Using 了 (le) Correctly in Chinese",
            7: "When 了 (le) is NOT Needed for Completed Actions in Chinese",
        },
    },
];

export const getGrammarCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(GRAMMAR_CATALOG, slug);
