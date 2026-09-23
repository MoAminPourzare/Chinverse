import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; the public courses API confirms published exercises. */
export const ENERGY_HEALTH_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "shi-heng-yi-what-is-qi-gong",
        title: "Shi Heng Yi Online（What is Qi Gong?）",
        coverPath: `${assetRoot}/Shi Heng Yi Online.jpeg`,
        lessonCount: 11,
        fallbackLessonTitle: "تمرین",
        description: [
            "این دوره از Shi Heng Yi معرفی ساده اما عمیقی از چی‌گونگ (Qi Gong) ارائه می‌کند؛ مجموعه‌ای از تمرین‌های تنفسی و حرکتی در سنت چینی برای آرام‌کردن ذهن، تقویت انرژی بدن و تمرکز.",
            "ویدیوها مرحله‌به‌مرحله نشان می‌دهند حرکت و تنفس چگونه با هم هماهنگ می‌شوند تا تنش کمتر شود، جریان انرژی در بدن بهتر حرکت کند و میان جسم و ذهن تعادل بیشتری شکل بگیرد.",
            "تمرین‌ها پیچیده نیستند و به ابزار خاصی نیاز ندارند. توضیح‌های روشن و تصویر حرکت‌ها این دوره را برای آشنایی اولیه با تمرین‌های انرژی و فرهنگ سلامت سنتی چین مناسب می‌کنند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که به تمرین تنفس، تمرکز و آرامش ذهن علاقه دارد",
            "علاقه‌مندان به چی‌گونگ و شیوه‌های سنتی سلامت در چین",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "xue-guoxue-wang-baduanjin",
        title: "学国学网《八段锦》",
        coverPath: `${assetRoot}/学国学网.jpeg`,
        detailCoverPath: `${assetRoot}/《八段锦》.jpeg`,
        lessonCount: 20,
        fallbackLessonTitle: "تمرین",
        description: [
            "این دوره یکی از معروف‌ترین تمرین‌های سنتی چین با نام بادوان‌جین یا 八段锦 را آموزش می‌دهد. مجموعه از هشت حرکت آرام و ساده تشکیل شده است که برای سلامت بدن، تنفس درست و آرامش ذهن طراحی شده‌اند.",
            "حرکت‌ها مرحله‌به‌مرحله آموزش داده می‌شوند تا هنرجو بتواند آن‌ها را درست اجرا کند و به‌تدریج هماهنگی بدن، انعطاف و تمرکز بیشتری به دست آورد.",
            "تمرین سبک است، به فضای زیاد یا وسیلهٔ خاصی نیاز ندارد و می‌تواند بخشی از برنامهٔ روزانه باشد. توضیح‌ها با ماندارین معیار و ساده ارائه می‌شوند و تصویر نقش اصلی را در دنبال‌کردن حرکت‌ها دارد.",
        ],
        audience: [
            "مبتدی",
            "کسی که به حرکت آرام، انعطاف و سلامت عمومی علاقه دارد",
            "زبان‌آموزی که می‌خواهد با یک تمرین کلاسیک چینی آشنا شود",
        ],
        knownLessonSubtitles: {},
    },
];

export const getEnergyHealthCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(ENERGY_HEALTH_CATALOG, slug);
