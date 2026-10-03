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
        coverPath: `${assetRoot}/Chinese Zero to Hero.jpeg`,
        lessonCount: 7,
        countSummary: "7 سطح · 175 درس",
        lessonGroupCounts: { 1: 23, 2: 29, 3: 31, 4: 34, 5: 32, 6: 21, 7: 5 },
        description: [
            "دورهٔ گرامر Chinese Zero to Hero آموزش ساختارمند و سطح‌بندی‌شده‌ای است که دستور زبان چینی را بر اساس سطح‌های HSK پیش می‌برد. نکته‌ها با توضیح روشن، مثال و تمرین آموزش داده می‌شوند تا زبان‌آموز بتواند آن‌ها را در جمله به کار ببرد.",
            "این مسیر برای کسی مناسب است که می‌خواهد قواعد را به‌ترتیب یاد بگیرد، تفاوت ساختارهای نزدیک را بفهمد و در کنار واژه‌ها و متن‌های HSK پایهٔ گرامرش را محکم کند.",
        ],
        audience: [
            "مبتدی تا متوسط، بسته به سطح HSK انتخابی",
            "زبان‌آموزی که برای آزمون HSK آماده می‌شود",
            "کسی که به توضیح مرحله‌به‌مرحله و تمرین منظم نیاز دارد",
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
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: baijiaGrammarLessons.length,
        chapterCount: 7,
        description: [
            "این مجموعه گرامر پایهٔ چینی را قدم‌به‌قدم پیش می‌برد. به‌جای حفظ‌کردن نام قواعد، جای واژه‌ها در جمله و کاربرد ساختارهایی مانند «把» و «被» با مثال توضیح داده می‌شود.",
            "درس‌ها برای کسی طراحی شده‌اند که می‌خواهد از جمله‌های ساده به ساختارهای دقیق‌تر برسد و با تمرین کوتاه، کاربرد هر الگو را در گفتار و نوشتار بفهمد.",
        ],
        audience: [
            "مبتدی پیشرفته تا متوسط",
            "زبان‌آموزی که HSK 1 و HSK 2 را گذرانده است",
            "کسی که می‌خواهد پیش از ورود به سطح متوسط، جمله‌سازی را تثبیت کند",
        ],
        knownLessonTitles: Object.fromEntries(baijiaGrammarLessons.map((lesson, index) => [index + 1, lesson.title])),
        knownLessonSubtitles: Object.fromEntries(baijiaGrammarLessons.map((lesson, index) => [index + 1, lesson.subtitle])),
    },
    {
        slug: "yoyo-chinese-grammar",
        title: "Yoyo Chinese (Grammar)",
        coverPath: `${assetRoot}/Yoyo Chinese.png`,
        lessonCount: 10,
        description: [
            "در دورهٔ گرامر یویو چاینیز، جمله‌سازی و قواعد کاربردی چینی با توضیح ساده و مثال‌های روشن آموزش داده می‌شوند. موضوع‌ها از ترتیب کلمات و جمله‌های پرسشی تا ساختارهای پرکاربرد پیش می‌روند.",
            "هدف این است که زبان‌آموز فقط قاعده را حفظ نکند؛ بتواند تفاوت شکل‌های نزدیک را بفهمد و در مکالمه و نوشتن از آن‌ها استفاده کند.",
        ],
        audience: [
            "مبتدی رو به پیشرفت تا متوسط",
            "کسی که در ترتیب جمله و سؤال‌سازی مشکل دارد",
            "زبان‌آموزی که توضیح ساده و کاربردی می‌خواهد",
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
        coverPath: `${assetRoot}/Grace Mandarin.png`,
        lessonCount: 7,
        description: [
            "این دورهٔ گرامر گریس ماندارین الگوهای جمله‌سازی چینی را با توضیح روشن و مثال‌های کاربردی بررسی می‌کند. نکته‌ها به‌جای حفظ‌کردن خشک قواعد، در جمله‌های واقعی نشان داده می‌شوند.",
            "توضیح‌ها با رویکرد یک مدرس تایوانی ارائه می‌شوند و برای زبان‌آموزی مناسب‌اند که می‌خواهد گرامر را دقیق‌تر و طبیعی‌تر در گفتار و نوشتار به کار ببرد.",
        ],
        audience: [
            "پیش‌متوسط",
            "کسی که با 了 و تفاوت کاربردهای آن درگیر است",
            "زبان‌آموزی که می‌خواهد جمله‌های دقیق‌تر و طبیعی‌تر بسازد",
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
