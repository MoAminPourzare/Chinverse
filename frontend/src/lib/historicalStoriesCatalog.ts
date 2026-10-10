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
            "این برنامه با استفاده از داستان‌های کوتاه، جذاب و حکمت‌آموز، زبان چینی رو آموزش می‌ده. هر قسمت یه داستان داره که به زبان ساده تعریف میشه و کمک می‌کنه همزمان با دنبال کردن قصه، شنیدار و درک مطلبت قوی‌تر بشه.",
            "خیلی از این داستان‌ها ریشه در فرهنگ، افسانه‌ها و ارزش‌های سنتی چین دارن و معمولاً یه پیام اخلاقی یا نکته‌ای آموزنده هم تو خودشون دارن، برای همین در کنار یادگیری زبان، کم‌کم با طرز فکر، باورها و فرهنگ مردم چین هم بیشتر آشنا می‌شی.",
            "هر داستان با انیمیشن‌های جذاب و دیدنی همراهه که هم دنبال کردن قصه رو لذت‌بخش‌تر می‌کنه، هم کمک می‌کنه معنی اتفاق‌ها و روند داستان رو راحت‌تر بفهمی. این تصاویر باعث می‌شن بیشتر جذب داستان بشی و ارتباط بهتری با محتوای هر قسمت بگیری.",
            "سبک آموزش خیلی روونه و بیشتر روی فهم کلی داستان تمرکز داره، نه حفظ کردن جزئیات. برای همین حس نمی‌کنی داری درس می‌خونی، بیشتر شبیه اینه که داری یه داستان گوش می‌دی و ناخودآگاه زبان یاد می‌گیری.",
            "از نظر زبانی، داستان‌ها با ماندارین معیار و نسبتاً کنترل‌شده ارائه می‌شن و برای زبان‌آموزهای مبتدی هم قابل فهمن."
        ],
        audience: [
            "مبتدی تا متوسط",
            "زبان‌آموز علاقه‌مند به یادگیری با داستان و تصویر",
            "کسی که می‌خواهد شنیدار و درک کلی زبان چینی را تقویت کند",
        ],
        knownLessonTitles: Object.fromEntries(HISTORICAL_STORIES_LESSON_TOPICS.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(HISTORICAL_STORIES_LESSON_TOPICS.map((topic, index) => [index + 1, topic])),
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
];

export const getHistoricalStoriesCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(HISTORICAL_STORIES_CATALOG, slug);
