import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const portraitPath = "/assets/chinverse/course-profiles/陳忠建.jpeg";

/** Owner-reference page plan; published lessons are attached only after the public API confirms them. */
export const CALLIGRAPHY_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "chen-zhongjian-calligraphy-beginners",
        title: "陳忠建",
        subtitle: "零基础自学书法入门",
        cardSubtitle: "零基础自学书法入门",
        coverPath: portraitPath,
        lessonCount: 14,
        fallbackLessonTitle: "درس",
        description: [
            "این دوره یک مقدمهٔ جامع و سطح‌بالا برای ورود به دنیای خوشنویسی چینی است. آموزش از صفر آغاز می‌شود و اصول پایه مانند شیوهٔ گرفتن قلم‌مو، حرکت‌های اصلی قلم، ترتیب نوشتن و ساختار کاراکترها را پوشش می‌دهد.",
            "آموزش‌ها عملی و قابل‌فهم‌اند و هنرجو را قدم‌به‌قدم با منطق شکل‌گیری حروف چینی آشنا می‌کنند. توضیح‌ها با ماندارین معیار و روشن ارائه می‌شوند تا هم تمرین خوشنویسی و هم درک ساختار کاراکترهای چینی آسان‌تر شود.",
        ],
        audience: [
            "مبتدی و بدون پیش‌نیاز",
            "علاقه‌مند به خوشنویسی و ساختار کاراکترهای چینی",
            "زبان‌آموزی که می‌خواهد نوشتن با قلم‌مو را از پایه تمرین کند",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "chen-zhongjian-ouyang-xun-structure",
        title: "陳忠建",
        subtitle: "欧阳询(结构)",
        cardSubtitle: "欧阳询(结构)",
        coverPath: portraitPath,
        lessonCount: 36,
        fallbackLessonTitle: "درس",
        description: [
            "این دوره بر ساختار کاراکترهای چینی در سبک اویانگ شون تمرکز دارد. جای‌گیری اجزای کاراکتر، تعادل میان بخش‌ها، فاصله‌ها و فرم کلی هر حرف بررسی می‌شود تا روشن شود چرا یک نویسه درست، منظم و استاندارد به نظر می‌رسد.",
            "شیوهٔ تدریس ساده و جزئی‌نگر است و هنرجو همراه توضیح ساختار، نوشتن را نیز تمرین می‌کند. ماندارین روشن و معیار دوره، آن را برای خوشنویسی و درک بهتر ساختمان کاراکترهای چینی مناسب می‌کند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "هنرجوی خوشنویسی علاقه‌مند به سبک اویانگ شون",
            "زبان‌آموزی که می‌خواهد ساختار و تعادل کاراکترها را بهتر بفهمد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "chen-zhongjian-yan-zhenqing-duobao-pagoda",
        title: "陳忠建",
        subtitle: "颜真卿(多宝塔碑)",
        cardSubtitle: "颜真卿(多宝塔碑)",
        coverPath: portraitPath,
        lessonCount: 23,
        fallbackLessonTitle: "درس",
        description: [
            "این دوره تمرین و یادگیری خط به سبک یان ژن‌چینگ را بر اساس اثر معروف «کتیبهٔ پاگودای گنج‌های بسیار» دنبال می‌کند. حرکت قلم‌مو، فرم کاراکترها و ساختارهای محکم و باثبات این سبک قدم‌به‌قدم آموزش داده می‌شوند.",
            "آموزش عملی و تدریجی است تا هنرجو بتواند با تمرین پیوسته به شکل‌های قوی و استاندارد نزدیک شود. توضیح‌های روشن با ماندارین معیار، هم برای تمرین خوشنویسی و هم برای فهم ساخت کاراکترهای چینی سودمندند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "هنرجوی علاقه‌مند به سبک یان ژن‌چینگ",
            "کسی که می‌خواهد فرم‌های محکم و متعادل را با قلم‌مو تمرین کند",
        ],
        knownLessonSubtitles: {},
    },
];

export const getCalligraphyCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CALLIGRAPHY_CATALOG, slug);
