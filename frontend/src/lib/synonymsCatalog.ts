import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; published lessons still come from the public courses API. */
export const SYNONYMS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "baijia-talk-hsk5-synonyms",
        title: "百家Talk (HSK5级词语辨析)",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: 20,
        description: [
            "این دوره واژگان سطح پنج HSK و تفاوت میان واژه‌های نزدیک به هم را بررسی می‌کند. هر درس چند کلمهٔ مشابه را کنار هم می‌گذارد و معنی، کاربرد و موقعیت استفادهٔ هرکدام را توضیح می‌دهد.",
            "هدف این است که زبان‌آموز فقط ترجمهٔ واژه‌ها را نداند و بتواند هنگام نوشتن یا صحبت‌کردن، واژهٔ دقیق‌تر و طبیعی‌تر را انتخاب کند.",
        ],
        audience: [
            "زبان‌آموز HSK5",
            "داوطلب آزمون HSK5",
            "کسی که می‌خواهد تفاوت واژه‌های مشابه را دقیق بفهمد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "qa-mandarin-synonyms",
        title: "Q&A Mandarin (近义词辨析)",
        coverPath: `${assetRoot}/Q%26A%20Mandarin.jpeg`,
        lessonCount: 5,
        description: [
            "این مجموعه چند واژهٔ نزدیک به هم را کنار هم می‌گذارد و تفاوت‌های ظریف میان آن‌ها را توضیح می‌دهد. مقایسهٔ مستقیم کمک می‌کند روشن شود هر کلمه در چه موقعیتی طبیعی‌تر است.",
            "درس‌های کوتاه برای مرور تفاوت‌هایی مناسب‌اند که معمولاً هنگام حرف‌زدن یا نوشتن باعث تردید می‌شوند.",
        ],
        audience: [
            "پیش‌متوسط رو به بالا",
            "کسی که در انتخاب میان کلمات مشابه مردد می‌شود",
            "زبان‌آموزی که توضیح کوتاه و مقایسه‌ای می‌خواهد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "free-to-learn-chinese-synonyms",
        title: "Free To Learn Chinese (近义词详解)",
        coverPath: `${assetRoot}/Free To Learn Chinese.jpeg`,
        lessonCount: 37,
        description: [
            "این مجموعه واژه‌های هم‌معنی و نزدیک‌معنی چینی را با جزئیات بیشتری توضیح می‌دهد. معنی، لحن و موقعیت استفادهٔ واژه‌ها با مثال مقایسه می‌شوند تا تفاوت آن‌ها در جمله روشن شود.",
            "سبک توضیح محاوره‌ای و قابل‌دنبال‌کردن است و کمک می‌کند زبان‌آموز هنگام مکالمه و نوشتن، انتخاب دقیق‌تری داشته باشد.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد چینی روزمره و کاربردی یاد بگیرد",
            "زبان‌آموزی که درس‌های صمیمی و کوتاه را ترجیح می‌دهد",
        ],
        knownLessonSubtitles: {},
    },
];

export const getSynonymsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(SYNONYMS_CATALOG, slug);
