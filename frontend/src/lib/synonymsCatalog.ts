import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import {
    BAIJIA_HSK5_SYNONYM_TOPICS,
    FREE_TO_LEARN_SYNONYM_TOPICS,
    QA_MANDARIN_SYNONYM_TOPICS,
} from "@/lib/synonymsLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";
const episodeTitles = (topics: string[]): Record<number, string> =>
    Object.fromEntries(topics.map((_, index) => [index + 1, `第${index + 1}集`]));
const episodeSubtitles = (topics: string[]): Record<number, string> =>
    Object.fromEntries(topics.map((topic, index) => [index + 1, topic]));

/** Owner-reference page plan; published lessons still come from the public courses API. */
export const SYNONYMS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "baijia-talk-hsk5-synonyms",
        title: "百家Talk (HSK5级词语辨析)",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: BAIJIA_HSK5_SYNONYM_TOPICS.length,
        description: [
            "این دوره واژگان سطح پنج HSK و تفاوت میان واژه‌های نزدیک به هم را بررسی می‌کند. هر درس چند کلمهٔ مشابه را کنار هم می‌گذارد و معنی، کاربرد و موقعیت استفادهٔ هرکدام را توضیح می‌دهد.",
            "هدف این است که زبان‌آموز فقط ترجمهٔ واژه‌ها را نداند و بتواند هنگام نوشتن یا صحبت‌کردن، واژهٔ دقیق‌تر و طبیعی‌تر را انتخاب کند.",
        ],
        audience: [
            "زبان‌آموز HSK5",
            "داوطلب آزمون HSK5",
            "کسی که می‌خواهد تفاوت واژه‌های مشابه را دقیق بفهمد",
        ],
        knownLessonTitles: episodeTitles(BAIJIA_HSK5_SYNONYM_TOPICS),
        knownLessonSubtitles: episodeSubtitles(BAIJIA_HSK5_SYNONYM_TOPICS),
    },
    {
        slug: "qa-mandarin-synonyms",
        title: "Q&A Mandarin (近义词辨析)",
        coverPath: `${assetRoot}/Q%26A%20Mandarin.jpeg`,
        lessonCount: QA_MANDARIN_SYNONYM_TOPICS.length,
        description: [
            "این مجموعه چند واژهٔ نزدیک به هم را کنار هم می‌گذارد و تفاوت‌های ظریف میان آن‌ها را توضیح می‌دهد. مقایسهٔ مستقیم کمک می‌کند روشن شود هر کلمه در چه موقعیتی طبیعی‌تر است.",
            "درس‌های کوتاه برای مرور تفاوت‌هایی مناسب‌اند که معمولاً هنگام حرف‌زدن یا نوشتن باعث تردید می‌شوند.",
        ],
        audience: [
            "پیش‌متوسط رو به بالا",
            "کسی که در انتخاب میان کلمات مشابه مردد می‌شود",
            "زبان‌آموزی که توضیح کوتاه و مقایسه‌ای می‌خواهد",
        ],
        knownLessonTitles: episodeTitles(QA_MANDARIN_SYNONYM_TOPICS),
        knownLessonSubtitles: episodeSubtitles(QA_MANDARIN_SYNONYM_TOPICS),
    },
    {
        slug: "free-to-learn-chinese-synonyms",
        title: "Free To Learn Chinese (近义词详解)",
        coverPath: `${assetRoot}/Free To Learn Chinese.jpeg`,
        lessonCount: FREE_TO_LEARN_SYNONYM_TOPICS.length,
        description: [
            "این مجموعه واژه‌های هم‌معنی و نزدیک‌معنی چینی را با جزئیات بیشتری توضیح می‌دهد. معنی، لحن و موقعیت استفادهٔ واژه‌ها با مثال مقایسه می‌شوند تا تفاوت آن‌ها در جمله روشن شود.",
            "سبک توضیح محاوره‌ای و قابل‌دنبال‌کردن است و کمک می‌کند زبان‌آموز هنگام مکالمه و نوشتن، انتخاب دقیق‌تری داشته باشد.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد چینی روزمره و کاربردی یاد بگیرد",
            "زبان‌آموزی که درس‌های صمیمی و کوتاه را ترجیح می‌دهد",
        ],
        knownLessonTitles: episodeTitles(FREE_TO_LEARN_SYNONYM_TOPICS),
        knownLessonSubtitles: episodeSubtitles(FREE_TO_LEARN_SYNONYM_TOPICS),
    },
];

export const getSynonymsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(SYNONYMS_CATALOG, slug);
