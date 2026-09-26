import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { HISTORICAL_STORIES_LESSON_TOPICS } from "@/lib/historicalStoriesLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; published lessons are attached only after the public API confirms them. */
export const HISTORICAL_STORIES_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "chinese-tales-with-xiao-lin",
        title: "Chinese Tales with Xiao Lin",
        coverPath: `${assetRoot}/Chinese Tales with Xiao Lin.jpeg`,
        lessonCount: 18,
        fallbackLessonTitle: "درس",
        description: [
            "این برنامه با استفاده از داستان‌های کوتاه، جذاب و قصه‌محور زبان چینی را آموزش می‌دهد. هر قسمت داستانی ساده را با زبان روشن تعریف می‌کند و به زبان‌آموز کمک می‌کند ضمن دنبال‌کردن قصه، شنیدار و درک مطلب قوی‌تری پیدا کند.",
            "بسیاری از داستان‌ها ریشه در فرهنگ، افسانه‌ها و ارزش‌های سنتی چین دارند و معمولاً پیام اخلاقی یا نکته‌ای دربارهٔ زندگی منتقل می‌کنند. به همین دلیل هنرجو هم‌زمان با زبان، با بخشی از فرهنگ چین نیز آشنا می‌شود.",
            "روایت‌ها شنیدنی و قابل‌پیگیری‌اند و تصویرها فهم رویدادها و فضای داستان را آسان‌تر می‌کنند. آموزش با ریتم آرام و تمرکز بر فهم کلی پیش می‌رود و برای کسی که از درس‌های خشک لذت نمی‌برد، تجربه‌ای شبیه گوش‌دادن به یک داستان واقعی می‌سازد.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "زبان‌آموز علاقه‌مند به یادگیری با داستان و تصویر",
            "کسی که می‌خواهد شنیدار و درک کلی زبان چینی را تقویت کند",
        ],
        knownLessonTitles: Object.fromEntries(HISTORICAL_STORIES_LESSON_TOPICS.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(HISTORICAL_STORIES_LESSON_TOPICS.map((topic, index) => [index + 1, topic])),
    },
];

export const getHistoricalStoriesCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(HISTORICAL_STORIES_CATALOG, slug);
