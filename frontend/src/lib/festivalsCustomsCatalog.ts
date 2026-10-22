import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";
const festivalTopics = ["春龙节", "清明节", "端午节", "七夕节", "中秋节", "重阳节", "腊八节", "祭灶节", "除夕节", "元宵节"];

/** Owner-reference page plan; published lessons are attached only after the public API confirms them. */
export const FESTIVALS_CUSTOMS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "sanmiao-wonderful-traditional-festivals",
        title: "三淼儿童官方频道",
        subtitle: "[精彩的传统节日]",
        cardSubtitle: "[精彩的传统节日]",
        coverPath: `${assetRoot}/三淼儿童官方频道.jpeg`,
        detailCoverPath: `${assetRoot}/精彩的传统节日.jpeg`,
        detailImageAspect: "square",
        lessonCount: 10,
        fallbackLessonTitle: "درس",
        description: [
            "این مجموعه با یه فضای شاد و کودکانه میاد سراغ جشن‌ها و مناسبت‌های سنتی چین و اون‌ها رو خیلی ساده و جذاب توضیح می‌ده؛ مثل عید بهار، جشن فانوس، جشن نیمه پاییز و بقیه مناسبت‌های معروف.",
            "سبک ویدیوها معمولاً کارتونی و رنگیه، برای همین هم یادگیریش راحت‌تره هم خسته‌کننده نیست. در کنارش کلی نکته فرهنگی، داستان و رسم‌ورسوم جالب یاد می‌گیری که کمک می‌کنه چین رو بهتر بشناسی.",
            "از نظر زبانی با ماندارین معیار و نسبتاً ساده‌ست، برای همین حتی مبتدی‌ها هم می‌تونن خوبی همراهی کنن."
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به جشن‌ها، آیین‌ها و فرهنگ سنتی چین",
            "زبان‌آموزی که با روایت تصویری و کودکانه بهتر یاد می‌گیرد",
        ],
        knownLessonTitles: Object.fromEntries(festivalTopics.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(festivalTopics.map((topic, index) => [index + 1, topic])),
        introductionHeading: "معرفی دوره:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
];

export const getFestivalsCustomsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(FESTIVALS_CUSTOMS_CATALOG, slug);
