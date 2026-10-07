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
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: classicalLessons.length,
        chapterCount: classicalChapters.length,
        description: [
            "این دوره یه ورودی جدی و اصولی به دنیای زبان چینی باستانه؛ همون زبانی که تو متون کلاسیک، اشعار قدیمی، نوشته‌های فلسفی و تاریخی استفاده می‌شده. تو این مجموعه کم‌کم با ساختار جمله‌ها، واژه‌های رایج در متون قدیمی و تفاوت‌های مهم بین چینی امروزی و چینی کلاسیک آشنا می‌شی. سبک تدریسش تحلیلی‌تر از دوره‌های مکالمه‌محوره؛ یعنی بیشتر تمرکز روی فهم متن، تجزیه ساختارها و درک دقیق معناست. اگه به ادبیات، تاریخ چین یا متون سنتی علاقه داشته باشی، این دوره برات خیلی جذاب میشه، چون کمک می‌کنه وقتی یه متن کلاسیک می‌بینی، فقط به شکل کاراکترها نگاه نکنی، بلکه واقعاً بتونی معناشو دریابی.",
            "این دوره برای مکالمه روزمره نیست؛ بیشتر مخصوص کساییه که می‌خوان به لایه عمیق‌تر زبان چینی رو بشناسن و وارد فضای متون کلاسیک بشن.",
        ],
        audience: [
            "متوسط به بالا",
            "زبان‌آموزایی که پایه چینی مدرن رو بلدن",
            "علاقه‌مند به ادبیات و تاریخ چین",
            "کسایی که می‌خوان متون کلاسیک رو بخونن و تحلیل کنن",
        ],
        knownLessonTitles: Object.fromEntries(classicalLessons.map(({ title }, index) => [index + 1, title])),
        knownLessonSubtitles: Object.fromEntries(classicalLessons.map(({ subtitle }, index) => [index + 1, subtitle])),
    },
];

export const getClassicalCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CLASSICAL_CATALOG, slug);
