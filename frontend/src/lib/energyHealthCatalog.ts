import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { ENERGY_HEALTH_LESSON_TOPICS } from "@/lib/energyHealthLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";

export interface EnergyHealthCourse extends PlannedCatalogCourse {
    detailCoverPosition?: "right";
    contentLanguage: "en" | "zh";
}

/** Owner-reference page plan; the public courses API confirms published exercises. */
export const ENERGY_HEALTH_CATALOG: EnergyHealthCourse[] = [
    {
        slug: "shi-heng-yi-what-is-qi-gong",
        title: "Shi Heng Yi Online（What is Qi Gong?）",
        cardTitle: "Shi Heng Yi Online",
        cardSubtitle: "(What is Qi Gong? )",
        contentLanguage: "en" as const,
        coverPath: `${assetRoot}/${encodeURIComponent("Shi Heng Yi Online.jpeg")}`,
        lessonCount: 11,
        fallbackLessonTitle: "تمرین",
        description: [
            "این دوره از Shi Heng Yi یه معرفی خیلی ساده و عمیق از چی‌گونگه (Qi Gong)؛ یعنی مجموعه‌ای از تمرین‌های تنفسی و حرکتی که توی سنت چینی برای آرامش ذهن، تقویت انرژی بدن و تمرکز استفاده میشه.",
            "توی ویدیوها توضیح داده میشه چی‌گونگ دقیقاً چیه، چطور کار می‌کنه و چطور با حرکات آهسته و تنفس درست می‌تونی بدن و ذهنت رو هماهنگ کنی. سبک آموزش خیلی آروم، قابل فهم و همراه با نمایش حرکت‌هاست، برای همین حتی مبتدی‌ها هم راحت می‌تونن باهاش ارتباط بگیرن.",
            "این دوره بیشتر از اینکه یه آموزش ورزشی سخت باشه، یه تجربه برای آرام‌سازی و شناخت بدنه و کمک می‌کنه با یکی از بخش‌های مهم فرهنگ سنتی چین آشنا بشی."
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که به تمرین تنفس، تمرکز و آرامش ذهن علاقه دارد",
            "علاقه‌مندان به چی‌گونگ و شیوه‌های سنتی سلامت در چین",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
    {
        slug: "xue-guoxue-wang-baduanjin",
        title: "学国学网《八段锦》",
        cardTitle: "学国学网",
        cardSubtitle: "《八段锦》",
        contentLanguage: "zh" as const,
        coverPath: `${assetRoot}/学国学网.jpeg`,
        detailCoverPath: `${assetRoot}/《八段锦》.jpeg`,
        detailCoverPosition: "right" as const,
        lessonCount: 20,
        fallbackLessonTitle: "تمرین",
        description: [
            "این دوره آموزش یکی از معروف‌ترین تمرین‌های سنتی چین یعنی 八段锦 (تمرین هشت‌گانه سلامتی) هست؛ یه سری حرکات خیلی نرم و ساده که بیشتر برای سلامت بدن، تنفس درست و آرامش ذهن طراحی شده. حرکت‌ها آهسته‌ست و مرحله‌به‌مرحله آموزش داده میشه، برای همین حتی اگه هیچ تجربه‌ای نداشته باشی هم می‌تونی راحت همراهی کنی.",
            "این تمرین بیشتر از اینکه ورزشی سنگین باشه، یه جور چی‌گونگ (تمرین انرژی و تنفس) محسوب میشه و توی فرهنگ چینی خیلی برای سبک زندگی سالم استفاده میشه.",
            "از نظر زبانی توضیح‌ها با ماندارین معیار و ساده ارائه میشه، ولی چون محور اصلی حرکت بدنه، فهم زبان خیلی مانع یادگیری نیست."
        ],
        audience: [
            "مبتدی",
            "کسی که به حرکت آرام، انعطاف و سلامت عمومی علاقه دارد",
            "زبان‌آموزی که می‌خواهد با یک تمرین کلاسیک چینی آشنا شود",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
].map((course) => {
    const topics = ENERGY_HEALTH_LESSON_TOPICS[course.slug];
    const unit = course.slug === "xue-guoxue-wang-baduanjin" ? "节" : "集";
    return {
        ...course,
        lessonCount: topics.length,
        knownLessonTitles: Object.fromEntries(topics.map((_, index) => [index + 1, `第${index + 1}${unit}`])),
        knownLessonSubtitles: Object.fromEntries(topics.map((topic, index) => [index + 1, topic])),
    };
});

export const getEnergyHealthCourse = (slug: string | undefined): EnergyHealthCourse | undefined =>
    getPlannedCourse(ENERGY_HEALTH_CATALOG, slug);
