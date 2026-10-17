import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { TEA_CULTURE_LESSONS } from "@/lib/teaCultureLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; published lessons are attached only after the public API confirms them. */
export const TEA_CULTURE_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "yinsong8-chinese-tea-culture",
        title: "yinsong8_com",
        subtitle: "（中國茶文化）",
        cardSubtitle: "（中國茶文化）",
        coverPath: `${assetRoot}/yinsong8_com.jpeg`,
        lessonCount: TEA_CULTURE_LESSONS.length,
        chapterCount: 43,
        countSummary: "۴۳ درس · ۵۸ بخش",
        fallbackLessonTitle: "درس",
        description: [
            "این دوره یه مجموعه آموزشی جدی و آکادمیکه که به‌طور کامل وارد دنیای فرهنگ چای چین میشه؛ از تاریخچه و فلسفه چای گرفته تا انواع چای‌ها، روش‌های دم‌آوری و آداب نوشیدن چای. این دوره توسط یکی از اساتید دانشگاه زبان و فرهنگ پکن ارائه شده، برای همین محتواش ساختارمند و علمی‌تر از ویدیوهای معمول یوتیوبه.",
            "توی این مجموعه فقط اسم چای‌ها رو یاد نمی‌گیری؛ بلکه با یه بخش مهم از فرهنگ چینی آشنا میشی. چون چای تو چین فقط یه نوشیدنی نیست، بلکه بخشی از سبک زندگی و حتی فرهنگ فکری مردمه.",
            "از نظر زبانی با ماندارین معیار و رسمی تدریس میشه و چون حالت کلاس داره، برای تقویت شنیدار آکادمیک هم خیلی مفیده."
        ],
        audience: [
            "متوسط به بالا",
            "علاقه‌مند به چای، تاریخ و سبک زندگی چینی",
            "دانشجو یا پژوهشگر فرهنگ چین و شنیدار آکادمیک",
        ],
        knownLessonTitles: Object.fromEntries(TEA_CULTURE_LESSONS.map((lesson, index) => [index + 1, `第${lesson.chapter}课`])),
        knownLessonSubtitles: Object.fromEntries(TEA_CULTURE_LESSONS.map((lesson, index) => [index + 1, lesson.topic])),
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
];

export const getTeaCultureCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(TEA_CULTURE_CATALOG, slug);
