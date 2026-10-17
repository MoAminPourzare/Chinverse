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
        title: "百家Talk (HSK5级词语解析)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: BAIJIA_HSK5_SYNONYM_TOPICS.length,
        description: [
            "این دوره همه واژگان سطح پنج رو پوشش نمی‌ده، بلکه تمرکزش روی واژه‌های هم‌معنی و نزدیک به هم در سطح HSK5 هست. تو هر ویدیو چند کلمه با معنای مشابه کنار هم بررسی می‌شن و توضیح داده میشه هر کدوم دقیقاً چه کاربردی دارن، تو چه موقعیتی طبیعی‌تر استفاده می‌شن و تفاوت ظریفشون با هم چیه.",
            "اگر سطح پنج رو می‌خونی و حس می‌کنی بین بعضی لغت‌ها مرددی یا نمی‌دونی کدوم رو کجا به کار ببری، این مجموعه کمک می‌کنه انتخاب‌هات دقیق‌تر و حرفه‌ای‌تر بشه، نه اینکه فقط لیست لغت حفظ کنی.",
        ],
        audience: [
            "زبان‌آموزان HSK5",
            "داوطلبان آزمون HSK5",
            "کسایی که می‌خوان تفاوت واژه‌های مشابه رو دقیق بفهمن",
        ],
        knownLessonTitles: episodeTitles(BAIJIA_HSK5_SYNONYM_TOPICS),
        knownLessonSubtitles: episodeSubtitles(BAIJIA_HSK5_SYNONYM_TOPICS),
    },
    {
        slug: "qa-mandarin-synonyms",
        title: "Q&A Mandarin (近义词辨析)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Q%26A%20Mandarin.jpeg`,
        lessonCount: QA_MANDARIN_SYNONYM_TOPICS.length,
        description: [
            "این مجموعه کوتاه فقط شامل چند ویدیوعه و روی تفاوت‌های ظریف بین واژه‌های هم‌معنی تمرکز داره. تو هر قسمت چند تا کلمه نزدیک به هم مقایسه می‌شن تا بفهمی هر کدوم دقیقاً کی و کجا استفاده می‌شن.",
        ],
        audience: [
            "پیش‌متوسط رو به بالا",
            "کسایی که تو انتخاب بین کلمات مشابه مردد می‌شن",
        ],
        knownLessonTitles: episodeTitles(QA_MANDARIN_SYNONYM_TOPICS),
        knownLessonSubtitles: episodeSubtitles(QA_MANDARIN_SYNONYM_TOPICS),
    },
    {
        slug: "free-to-learn-chinese-synonyms",
        title: "Free To Learn Chinese (近义词详解)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Free To Learn Chinese.jpeg`,
        lessonCount: FREE_TO_LEARN_SYNONYM_TOPICS.length,
        description: [
            "این مجموعه بیشتر روی توضیح کلمات و عبارت‌های نزدیک‌معنی در زبان چینی تمرکز داره؛ کلماتی که ظاهراً شبیه هم هستن، ولی در کاربرد، لحن یا موقعیت استفاده تفاوت دارن.",
            "مدرس معمولاً با مثال‌های ساده و کاربردی توضیح میده که هر واژه دقیقاً در چه موقعیتی استفاده میشه و چه تفاوتی با واژه‌های مشابهش داره. برای زبان‌آموزایی که می‌خوان طبیعی‌تر و دقیق‌تر چینی صحبت کنن، این سبک محتوا خیلی مفیده.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسایی که می‌خوان چینی روزمره و کاربردی یاد بگیرن",
            "افرادی که قصد دارن تو سفر یا موقعیت‌های واقعی راحت صحبت کنن",
            "زبان‌آموزایی که از درس‌های صمیمی و سرگرم‌کننده لذت می‌برن",
        ],
        knownLessonTitles: episodeTitles(FREE_TO_LEARN_SYNONYM_TOPICS),
        knownLessonSubtitles: episodeSubtitles(FREE_TO_LEARN_SYNONYM_TOPICS),
    },
];

export const getSynonymsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(SYNONYMS_CATALOG, slug);
