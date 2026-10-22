import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { CALLIGRAPHY_LESSON_TOPICS } from "@/lib/calligraphyLessonTopics";

const portraitPath = "/assets/chinverse/course-profiles/陳忠建.jpeg";

export interface CalligraphyLevel {
    slug: string;
    title: string;
    lessonCount: number;
}

export interface CalligraphyCourse extends PlannedCatalogCourse {
    levels?: CalligraphyLevel[];
}

/** Owner-reference page plan; published lessons are attached only after the public API confirms them. */
export const CALLIGRAPHY_CATALOG: CalligraphyCourse[] = [
    {
        slug: "chen-zhongjian-calligraphy-beginners",
        title: "陳忠建",
        subtitle: "零基础自学书法入门",
        cardSubtitle: "零基础自学书法入门",
        coverPath: portraitPath,
        lessonCount: 14,
        fallbackLessonTitle: "درس",
        description: [
            "این دوره یه نقطه شروع عالی برای ورود به دنیای خوشنویسی چینیه. از کاملاً صفر شروع می‌کنه و قدم‌به‌قدم اصول پایه مثل نحوه گرفتن قلم، حرکات اصلی، ترتیب نوشتن و ساختار کاراکترها رو آموزش می‌ده. تدریسش منظم و قابل‌فهمه و برای کسایی که هیچ پیش‌زمینه‌ای ندارن خیلی مناسبه.",
            "از نظر زبانی با ماندارین معیار تدریس میشه و علاوه بر یادگیری نوشتن، کمک می‌کنه درک عمیق‌تری از ساختار کاراکترهای چینی پیدا کنی."
        ],
        audience: [
            "مبتدی و بدون پیش‌نیاز",
            "علاقه‌مند به خوشنویسی و ساختار کاراکترهای چینی",
            "زبان‌آموزی که می‌خواهد نوشتن با قلم‌مو را از پایه تمرین کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
    {
        slug: "chen-zhongjian-ouyang-xun-structure",
        title: "陳忠建",
        subtitle: "欧阳询(结构)",
        cardSubtitle: "欧阳询(结构)",
        coverPath: portraitPath,
        lessonCount: 36,
        countSummary: "۲ سطح · ۳۶ درس",
        levels: [
            { slug: "beginner", title: "入门 欧阳询结构", lessonCount: 18 },
            { slug: "advanced", title: "进阶 欧体结构", lessonCount: 18 },
        ],
        fallbackLessonTitle: "درس",
        description: [
            "این دوره تمرکزش روی ساختار کاراکترهای چینی در سبک اویانگ‌شونه، یکی از مهم‌ترین استادان خط کایشو (خط رسمی). توی این مجموعه یاد می‌گیری اجزای کاراکترها چطور کنار هم قرار می‌گیرن، تعادل، فاصله‌ها و فرم کلی هر حرف چطور باید باشه تا نوشتنت حرفه‌ای و استاندارد به نظر برسه.",
            "سبک آموزش تحلیلی و دقیق‌تر از دوره‌های مقدماتیه و بیشتر به «درست نوشتن» از نظر فرم و ساختار توجه داره. برای کسایی که پایه خوشنویسی رو دارن و می‌خوان کارشون تمیزتر و اصولی‌تر بشه خیلی مفیده.",
            "از نظر زبانی با ماندارین معیار و لحن آموزشی نسبتاً آروم تدریس میشه و تمرکز اصلی روی دیدن و تمرین کردنه."
        ],
        audience: [
            "مبتدی تا متوسط",
            "هنرجوی خوشنویسی علاقه‌مند به سبک اویانگ شون",
            "زبان‌آموزی که می‌خواهد ساختار و تعادل کاراکترها را بهتر بفهمد",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
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
            "این دوره روی تمرین و یادگیری خط به سبک یان ژن‌چینگ بر اساس اثر معروف 《多宝塔碑》 تمرکز داره؛ یکی از مهم‌ترین منابع برای یادگیری خط کایشو. توی این مجموعه حرکات قلم، فرم کاراکترها و استحکام خاص این سبک رو یاد می‌گیری که باعث میشه نوشته‌هات قدرتمندتر و استانداردتر به نظر برسن.",
            "سبک آموزش قدم‌به‌قدم و عملیه و بیشتر از توضیح تئوری، روی دیدن و تمرین کردن تمرکز داره. برای کسایی که می‌خوان وارد دنیای خوشنویسی کلاسیک بشن یا سبک‌های معروف رو اصولی یاد بگیرن، خیلی انتخاب خوبیه."
        ],
        audience: [
            "مبتدی تا متوسط",
            "هنرجوی علاقه‌مند به سبک یان ژن‌چینگ",
            "کسی که می‌خواهد فرم‌های محکم و متعادل را با قلم‌مو تمرین کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
].map((course) => {
    const topics = CALLIGRAPHY_LESSON_TOPICS[course.slug] || [];
    return {
        ...course,
        knownLessonTitles: Object.fromEntries(Array.from({ length: course.lessonCount }, (_, index) => [index + 1, `第${index + 1}课`])),
        knownLessonSubtitles: Object.fromEntries(topics.map((topic, index) => [index + 1, topic])),
    };
});

export const getCalligraphyCourse = (slug: string | undefined): CalligraphyCourse | undefined =>
    getPlannedCourse(CALLIGRAPHY_CATALOG, slug);
