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
            "این مجموعه از «兔小贝» به شعرهای کلاسیک چینی اختصاص دارد. فهرست ۶۵ قسمتی آن با عنوان اصلی چینی هر شعر ثبت شده است.",
        ],
        audience: ["علاقه‌مندان به شعر و ادبیات کلاسیک چین"],
        knownLessonTitles: Object.fromEntries(CLASSICAL_POETRY_LESSON_TOPICS.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(CLASSICAL_POETRY_LESSON_TOPICS.map((topic, index) => [index + 1, topic])),
    },
];

export const getClassicalPoetryCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CLASSICAL_POETRY_CATALOG, slug);
