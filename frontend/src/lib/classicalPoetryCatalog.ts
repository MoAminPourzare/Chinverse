import { CLASSICAL_POETRY_LESSON_TOPICS } from "@/lib/classicalPoetryLessonTopics";
import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; publication is confirmed by the public API. */
export const CLASSICAL_POETRY_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "rabbit-classical-poetry",
        title: "兔小贝",
        subtitle: "(古诗大全)",
        cardSubtitle: "(古诗大全)",
        coverPath: `${assetRoot}/兔小贝Beckybunny.jpeg`,
        detailCoverPath: `${assetRoot}/兔小贝古诗大全.jpeg`,
        detailImageAspect: "video",
        lessonCount: CLASSICAL_POETRY_LESSON_TOPICS.length,
        fallbackLessonTitle: "قسمت",
        description: [
            "این برنامه شعرهای کلاسیک چینی رو با یه فضای کودکانه و کارتونی آموزش می‌ده. شعرها معمولاً کوتاه و معروفن (بیشتر از دوره تانگ) و با تصویر و انیمیشن همراه شدن تا هم معنیشون راحت‌تر فهمیده بشه هم تو ذهن بمونن.",
            "برای زبان‌آموزها خیلی مفیده چون هم با ادبیات کلاسیک چین آشنا می‌شی، هم تلفظ درست شعرها رو می‌شنوی.",
            "از نظر زبانی ماندارین معیار و واضح استفاده میشه و چون شعرها ریتم دارن، برای تقویت شنیدار هم کمک‌کننده‌ست."
        ],
        audience: ["علاقه‌مندان به شعر و ادبیات کلاسیک چین"],
        knownLessonTitles: Object.fromEntries(CLASSICAL_POETRY_LESSON_TOPICS.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(CLASSICAL_POETRY_LESSON_TOPICS.map((topic, index) => [index + 1, topic])),
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
];

export const getClassicalPoetryCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CLASSICAL_POETRY_CATALOG, slug);
