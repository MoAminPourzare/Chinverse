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
        coverPath: `${assetRoot}/fMEg1uHEG.jpeg`,
        lessonCount: officeSentenceRanges.length,
        description: [
            "این دوره از کانال Hoa Ngữ Nam Khánh جمله‌های رایج در محیط کار و شرکت را آموزش می‌دهد. موقعیت‌هایی مانند صحبت با همکار، گفت‌وگو دربارهٔ کارها و بیان درخواست‌ها با مثال‌های واقعی توضیح داده می‌شوند.",
            "تمرکز درس‌ها روی عبارت‌هایی است که بتوان آن‌ها را در ارتباط روزمرهٔ کاری به کار برد و با تکرار، روان‌تر گفت.",
        ],
        audience: [
            "متوسط تا پیشرفته",
            "کسی که در محیط کاری یا شرکت به جمله‌های درست و طبیعی نیاز دارد",
            "زبان‌آموزی که می‌خواهد شنیدن و گفتن عبارت‌های کاری را تمرین کند",
        ],
        knownLessonTitles: numberedEpisodeTitles(officeSentenceRanges.length),
        knownLessonSubtitles: Object.fromEntries(officeSentenceRanges.map((range, index) => [index + 1, `公司里常用句型 ${range}`])),
    },
    {
        slug: "hoa-ngu-nam-khanh-business-chinese",
        title: "Hoa Ngữ Nam Khánh (商务汉语 公司篇)",
        coverPath: `${assetRoot}/fMEg1uHEG.jpeg`,
        lessonCount: businessLessons.length,
        chapterCount: 6,
        description: [
            "این دوره از کانال Hoa Ngữ Nam Khánh برای کسانی است که می‌خواهند در فضای کاری و تجاری به زبان چینی صحبت کنند. درس‌ها موقعیت‌هایی مانند ارتباط با همکاران، جلسه، گفت‌وگو و درخواست‌های اداری را پوشش می‌دهند.",
            "هدف این است که زبان‌آموز عبارت‌های رسمی‌تر و کاربردی را بشناسد و بتواند در شرکت و محیط واقعی با اطمینان بیشتری از آن‌ها استفاده کند.",
        ],
        audience: [
            "متوسط تا پیشرفته",
            "کسی که می‌خواهد مکالمهٔ کاری و تجاری را تمرین کند",
            "زبان‌آموزی که به واژگان و عبارت‌های محیط شرکت نیاز دارد",
        ],
        knownLessonTitles: Object.fromEntries(businessLessons.map((lesson, index) => [index + 1, lesson.title])),
        knownLessonSubtitles: Object.fromEntries(businessLessons.map((lesson, index) => [index + 1, lesson.subtitle])),
    },
    {
        slug: "love-chinese-vocabulary",
        title: "Love Chinese 爱中文 (Chinese Vocabulary)",
        coverPath: `${assetRoot}/Love Chinese爱中文.jpeg`,
        lessonCount: LOVE_CHINESE_VOCABULARY_TOPICS.length,
        description: [
            "این مجموعه از Love Chinese روی واژگان دسته‌بندی‌شدهٔ چینی تمرکز دارد. هر بخش واژه‌های یک موضوع را با توضیح، تلفظ و نمونه‌های کاربردی کنار هم می‌گذارد تا بتوان آن‌ها را در گفتار و متن بهتر به خاطر سپرد.",
            "موضوع‌ها از واژه‌های روزمره تا کاربردهای تخصصی‌تر پیش می‌روند و برای زبان‌آموزی مناسب‌اند که می‌خواهد دایرهٔ لغاتش را منظم گسترش دهد.",
        ],
        audience: [
            "مبتدی تا پیشرفته، بسته به موضوع",
            "کسی که می‌خواهد دایرهٔ واژگانش را سریع‌تر گسترش دهد",
            "زبان‌آموزی که واژه‌ها را همراه با کاربردشان می‌خواهد",
        ],
        knownLessonTitles: numberedEpisodeTitles(LOVE_CHINESE_VOCABULARY_TOPICS.length, [10, 40]),
        knownLessonSubtitles: Object.fromEntries(LOVE_CHINESE_VOCABULARY_TOPICS.map((topic, index) => [index + 1, topic])),
    },
];

export const getPracticalCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(PRACTICAL_CATALOG, slug);
