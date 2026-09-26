import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";
const classicalChapters = [
    ["1.1 古汉语概说", "1.2 郑人买履（一）", "1.3 郑人买履（二）", "1.4 狐假虎威（一）", "1.5 狐假虎威（二）"],
    ["2.1 火烧裳尾（一）", "2.2 火烧裳尾（二）", "2.3 执长竿入城（一）", "2.4 执长竿入城（二）", "2.5 古汉语常识（一）"],
    ["3.1 精卫填海（一）", "3.2 精卫填海（二）", "3.3 画蛇添足（一）", "3.4 画蛇添足（二）", "3.5 古汉语常识（二）"],
    ["4.1 远水不救近火（一）", "4.2 远水不救近火（二）", "4.3 拔杨容易栽杨难（一）", "4.4 拔杨容易栽杨难（二）", "4.5 古汉语常识（三）"],
    ["5.1 为学（一）", "5.2 为学（二）", "5.3 为学（三）", "5.4 为学（四）", "5.5 古汉语常识（四）"],
    ["6.1 黔之驴（一）", "6.2 黔之驴（二）", "6.3 黔之驴（三）", "6.4 黔之驴（四）", "6.5 古汉语常识（五）"],
    ["7.1 邹忌讽齐王纳谏（一）", "7.2 邹忌讽齐王纳谏（二）", "7.3 邹忌讽齐王纳谏（三）", "7.4 邹忌讽齐王纳谏（四）", "7.5 古汉语常识（六）"],
    ["8.1 狼（一）", "8.2 狼（二）", "8.3 狼（三）", "8.3 狼（三）", "8.4 狼（四）", "8.5 古汉语常识（七）"],
];
const classicalLessons = classicalChapters.flatMap((subtitles, chapterIndex) =>
    subtitles.map((subtitle) => ({ title: `第${chapterIndex + 1}课`, subtitle }))
);

/** Owner-reference plan for classical Chinese; publication still comes from the public API. */
export const CLASSICAL_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "baijia-talk-classical-chinese-introduction",
        title: "百家Talk (古代汉语入门)",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: classicalLessons.length,
        chapterCount: classicalChapters.length,
        description: [
            "این دوره مقدمه‌ای بر زبان چینی کلاسیک است؛ زبانی که در متن‌های کهن، نوشته‌های فلسفی و تاریخی و ادبیات کلاسیک چین دیده می‌شود. درس‌ها ساختار جمله و واژه‌های رایج در متن قدیمی را با توضیح قابل‌فهم بررسی می‌کنند.",
            "هدف دوره این است که زبان‌آموز بتواند تفاوت زبان کلاسیک و چینی امروزی را تشخیص دهد و برای خواندن متن‌های ساده‌تر کلاسیک پایهٔ لازم را بسازد.",
        ],
        audience: [
            "متوسط به بالا",
            "زبان‌آموزی که پایهٔ چینی مدرن را دارد",
            "علاقه‌مند به ادبیات و تاریخ چین",
            "کسی که می‌خواهد متن کلاسیک را بخواند و تحلیل کند",
        ],
        knownLessonTitles: Object.fromEntries(classicalLessons.map(({ title }, index) => [index + 1, title])),
        knownLessonSubtitles: Object.fromEntries(classicalLessons.map(({ subtitle }, index) => [index + 1, subtitle])),
    },
];

export const getClassicalCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CLASSICAL_CATALOG, slug);
