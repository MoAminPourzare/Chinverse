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
            "این مجموعه با زبان کودکانه و ساده، جشن‌ها و مناسبت‌های سنتی چین را معرفی می‌کند. ویدیوها زمان برگزاری، پیشینه و شیوهٔ برپایی جشن‌هایی مانند جشن بهار را همراه رسم‌ها و نمادهای رایج توضیح می‌دهند.",
            "سبک روایت معمولاً داستانی و رنگارنگ است و مطالب فرهنگی را سرگرم‌کننده و قابل‌فهم نگه می‌دارد. در کنار آشنایی با جشن‌ها، زبان‌آموز نکته‌های فرهنگی جذابی دربارهٔ جامعه و زندگی در چین یاد می‌گیرد.",
            "زبان برنامه ماندارین معیار و نسبتاً ساده است و تصویرها بخش مهمی از معنا را منتقل می‌کنند؛ بنابراین زبان‌آموزان سطح پایین‌تر نیز می‌توانند مسیر هر درس را دنبال کنند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به جشن‌ها، آیین‌ها و فرهنگ سنتی چین",
            "زبان‌آموزی که با روایت تصویری و کودکانه بهتر یاد می‌گیرد",
        ],
        knownLessonTitles: Object.fromEntries(festivalTopics.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(festivalTopics.map((topic, index) => [index + 1, topic])),
    },
];

export const getFestivalsCustomsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(FESTIVALS_CUSTOMS_CATALOG, slug);
