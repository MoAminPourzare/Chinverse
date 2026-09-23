import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan. Published lessons and media are read from the courses API. */
export const PRACTICAL_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "hoa-ngu-nam-khanh-office-sentences",
        title: "Hoa Ngữ Nam Khánh (公司里常用句型)",
        coverPath: `${assetRoot}/fMEg1uHEG.jpeg`,
        lessonCount: 9,
        description: [
            "این دوره از کانال Hoa Ngữ Nam Khánh جمله‌های رایج در محیط کار و شرکت را آموزش می‌دهد. موقعیت‌هایی مانند صحبت با همکار، گفت‌وگو دربارهٔ کارها و بیان درخواست‌ها با مثال‌های واقعی توضیح داده می‌شوند.",
            "تمرکز درس‌ها روی عبارت‌هایی است که بتوان آن‌ها را در ارتباط روزمرهٔ کاری به کار برد و با تکرار، روان‌تر گفت.",
        ],
        audience: [
            "متوسط تا پیشرفته",
            "کسی که در محیط کاری یا شرکت به جمله‌های درست و طبیعی نیاز دارد",
            "زبان‌آموزی که می‌خواهد شنیدن و گفتن عبارت‌های کاری را تمرین کند",
        ],
        knownLessonTitles: { 1: "第1集" },
        knownLessonSubtitles: { 1: "公司里常用句型 01~05" },
    },
    {
        slug: "hoa-ngu-nam-khanh-business-chinese",
        title: "Hoa Ngữ Nam Khánh (商务汉语 公司篇)",
        coverPath: `${assetRoot}/fMEg1uHEG.jpeg`,
        lessonCount: 6,
        description: [
            "این دوره از کانال Hoa Ngữ Nam Khánh برای کسانی است که می‌خواهند در فضای کاری و تجاری به زبان چینی صحبت کنند. درس‌ها موقعیت‌هایی مانند ارتباط با همکاران، جلسه، گفت‌وگو و درخواست‌های اداری را پوشش می‌دهند.",
            "هدف این است که زبان‌آموز عبارت‌های رسمی‌تر و کاربردی را بشناسد و بتواند در شرکت و محیط واقعی با اطمینان بیشتری از آن‌ها استفاده کند.",
        ],
        audience: [
            "متوسط تا پیشرفته",
            "کسی که می‌خواهد مکالمهٔ کاری و تجاری را تمرین کند",
            "زبان‌آموزی که به واژگان و عبارت‌های محیط شرکت نیاز دارد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "love-chinese-vocabulary",
        title: "Love Chinese 爱中文 (Chinese Vocabulary)",
        coverPath: `${assetRoot}/Love Chinese爱中文.jpeg`,
        lessonCount: 69,
        description: [
            "این مجموعه از Love Chinese روی واژگان دسته‌بندی‌شدهٔ چینی تمرکز دارد. هر بخش واژه‌های یک موضوع را با توضیح، تلفظ و نمونه‌های کاربردی کنار هم می‌گذارد تا بتوان آن‌ها را در گفتار و متن بهتر به خاطر سپرد.",
            "موضوع‌ها از واژه‌های روزمره تا کاربردهای تخصصی‌تر پیش می‌روند و برای زبان‌آموزی مناسب‌اند که می‌خواهد دایرهٔ لغاتش را منظم گسترش دهد.",
        ],
        audience: [
            "مبتدی تا پیشرفته، بسته به موضوع",
            "کسی که می‌خواهد دایرهٔ واژگانش را سریع‌تر گسترش دهد",
            "زبان‌آموزی که واژه‌ها را همراه با کاربردشان می‌خواهد",
        ],
        knownLessonSubtitles: {},
    },
];

export const getPracticalCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(PRACTICAL_CATALOG, slug);
