import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { LOVE_CHINESE_VOCABULARY_TOPICS } from "@/lib/practicalLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";
const officeSentenceRanges = ["01~05", "06~10", "11~15", "16~20", "21~25", "26~30", "31~35", "36~40", "41~45"];
const businessSections = ["热身", "课文（一）", "课文（二）", "重点词和句型", "练习", "知识链接及技能培训", "自由会话", "听力练习"];
const businessLessons = Array.from({ length: 6 }, (_, chapterIndex) =>
    businessSections.map((section, sectionIndex) => ({
        title: `第${chapterIndex + 1}课`,
        // The fourth card under lesson 2 is labeled 3.4 in the reference.
        subtitle: `${chapterIndex === 1 && sectionIndex === 3 ? "3.4" : `${chapterIndex + 1}.${sectionIndex + 1}`}${section}`,
    }))).flat();
const numberedEpisodeTitles = (count: number, lessonOverrides: number[] = []): Record<number, string> =>
    Object.fromEntries(Array.from({ length: count }, (_, index) => {
        const position = index + 1;
        return [position, `第${position}${lessonOverrides.includes(position) ? "课" : "集"}`];
    }));

/** Owner-reference page plan. Published lessons and media are read from the courses API. */
export const PRACTICAL_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "hoa-ngu-nam-khanh-office-sentences",
        title: "Hoa Ngữ Nam Khánh (公司里常用句型)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/fMEg1uHEG.jpeg`,
        lessonCount: officeSentenceRanges.length,
        description: [
            "این دوره که تو کانال Hoa Ngữ Nam Khánh منتشر شده، یکی از منابع کاربردی برای یادگیری جمله‌های رایج در فضای کاری و شرکته. برخلاف درس‌های صرفاً واژگان یا گرامر، اینجا مثال ساختارهایی میده که واقعاً تو محیط‌های اداری، جلسات، ارتباط با مشتری و فرایندهای شغلی روزمره استفاده میشن. هر بخش با مثال‌های واقعی و موقعیت‌های واقعی توضیح داده میشه تا بتونی دقیق بفهمی هر جمله رو کجا و چطور به‌کار ببری.",
        ],
        audience: [
            "متوسط تا پیشرفته",
            "کسانی که می‌خوان تو محیط کاری و شرکت از ساختارهای درست و طبیعی استفاده کنن",
            "زبان‌آموزانی که پایه‌ی شنیدار و گفتارشون قویه و دنبال مکالمه‌های حرفه‌ای‌تر هستن",
            "افرادی که می‌خوان مهارت ارتباط در محیط اداری رو تقویت کنن",
        ],
        knownLessonTitles: numberedEpisodeTitles(officeSentenceRanges.length),
        knownLessonSubtitles: Object.fromEntries(officeSentenceRanges.map((range, index) => [index + 1, `公司里常用句型 ${range}`])),
    },
    {
        slug: "hoa-ngu-nam-khanh-business-chinese",
        title: "Hoa Ngữ Nam Khánh (商务汉语口语 公司篇)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/fMEg1uHEG.jpeg`,
        lessonCount: businessLessons.length,
        chapterCount: 6,
        description: [
            "این دوره از کانال Hoa Ngữ Nam Khánh یه منبع کاربردیه برای کسایی که می‌خوان مهارت صحبت کردن به زبان چینی تو محیط‌های کاری و شرکت‌ها رو قوی کنن. محتواش دقیقاً حول گفت‌وگوهای روزمره در شرکت می‌چرخه — از مصاحبه استخدام و کار اداری، پذیرش مشتری، جلسات، تا تماس‌های تجاری و مذاکرات. با مثال‌های واقعی و جملات کاربردی یاد می‌گیری جمله‌سازی کنی، درخواست بدی، نظر بدی و موقعیت‌های حرفه‌ای رو راحت‌تر مدیریت کنی. این دوره بهت کمک می‌کنه زبانت فقط برای درس و حفظ کردن نباشه، بلکه تو شرکت و محیط واقعی هم بتونی ارتباط طبیعی و مؤثر برقرار کنی.",
        ],
        audience: [
            "متوسط تا پیشرفته",
            "زبان‌آموزانی که پایه‌ی شنیدار و گفتارشون قویه",
            "کسانی که می‌خوان تو چینی تجاری و محیط شرکت مسلط بشن",
            "افرادی که دنبال مهارت‌های گفتاری شغلی و حرفه‌ای هستن",
        ],
        knownLessonTitles: Object.fromEntries(businessLessons.map((lesson, index) => [index + 1, lesson.title])),
        knownLessonSubtitles: Object.fromEntries(businessLessons.map((lesson, index) => [index + 1, lesson.subtitle])),
    },
    {
        slug: "love-chinese-vocabulary",
        title: "Love Chinese 爱中文 (Chinese Vocabulary)",
        detailTitleLines: ["Love Chinese", "爱中文", "(Chinese Vocabulary)"],
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Love Chinese爱中文.jpeg`,
        lessonCount: LOVE_CHINESE_VOCABULARY_TOPICS.length,
        description: [
            "این دوره دقیقاً روی واژگان دسته‌بندی‌شده تمرکز داره. هر قسمت میاد سراغ یه حوزه‌ی مشخص (مثلاً ساخت و ساز، صنعت، حمل و نقل و...) و حدود ۵۰ تا ۷۰ لغت مرتبط با همون موضوع رو یکجا آموزش میده. آموزش به این صورته که هر واژه همراه با تصویر، معنی و پین‌یین نمایش داده میشه و تلفظش هم شمرده گفته میشه؛ یعنی کاملاً مستقیم و متمرکز روی خود لغته، نه جمله‌سازی یا توضیح طولانی.",
            "نقطه‌ی قوت بزرگ این مجموعه اینه که حجم بالایی از لغات کاربردی رو به‌صورت منظم و موضوعی در اختیارت می‌ذاره. بیشتر واژه‌ها روزمره و قابل استفاده‌ان، اما در کنارش وارد حوزه‌های تخصصی‌تر و مرتبط با مشاغل هم میشه. برای همین اگه کسی بخواد دایره واژگانش رو سریع و هدفمند بالا ببره — مخصوصاً برای ورود به حوزه ترجمه یا کار حرفه‌ای — این دوره واقعاً منبع ارزشمندیه.",
            "اینجا تمرکز روی «شناخت شنیداری واژگانه»، یعنی هر قسمت یه بسته‌ی کامل از لغت‌های یه حوزه رو می‌گیری و ذهنت اون‌ها رو به‌صورت شبکه‌ای یاد می‌گیره، نه پراکنده.",
        ],
        audience: [
            "مبتدی تا پیشرفته",
            "کسایی که می‌خوان دایره واژگانشون رو سریع گسترش بدن",
            "افرادی که قصد ورود به حوزه ترجمه دارن",
        ],
        knownLessonTitles: numberedEpisodeTitles(LOVE_CHINESE_VOCABULARY_TOPICS.length, [10, 40]),
        knownLessonSubtitles: Object.fromEntries(LOVE_CHINESE_VOCABULARY_TOPICS.map((topic, index) => [index + 1, topic])),
    },
];

export const getPracticalCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(PRACTICAL_CATALOG, slug);
