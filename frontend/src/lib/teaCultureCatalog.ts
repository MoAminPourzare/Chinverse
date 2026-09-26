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
            "این دوره مجموعه‌ای آموزشی، جدی و دانشگاهی است که به‌طور کامل وارد دنیای فرهنگ چای چین می‌شود. آموزش از تاریخ و فلسفهٔ چای آغاز می‌شود و مناطق مهم کشت، روش‌های پرورش و برداشت، فرایند تولید، شیوه‌های دم‌آوری، ابزار نوشیدن چای و آداب پذیرایی را پوشش می‌دهد.",
            "دوره فقط شیوهٔ دم‌کردن چای را توضیح نمی‌دهد؛ بخش مهمی از آن دربارهٔ سبک زندگی، تاریخ، آیین‌ها و فرهنگ اجتماعی پیرامون چای است. به همین دلیل برای علاقه‌مندان، دانشجویان و پژوهشگران فرهنگ چین نیز ارزش آموزشی دارد.",
            "زبان دوره ماندارین معیار و رسمی است و لحن آن حالت کلاس دانشگاهی دارد. دنبال‌کردن منظم درس‌ها به تقویت شنیدار آکادمیک و واژگان تخصصی فرهنگ چای کمک می‌کند.",
        ],
        audience: [
            "متوسط به بالا",
            "علاقه‌مند به چای، تاریخ و سبک زندگی چینی",
            "دانشجو یا پژوهشگر فرهنگ چین و شنیدار آکادمیک",
        ],
        knownLessonTitles: Object.fromEntries(TEA_CULTURE_LESSONS.map((lesson, index) => [index + 1, `第${lesson.chapter}课`])),
        knownLessonSubtitles: Object.fromEntries(TEA_CULTURE_LESSONS.map((lesson, index) => [index + 1, lesson.topic])),
    },
];

export const getTeaCultureCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(TEA_CULTURE_CATALOG, slug);
