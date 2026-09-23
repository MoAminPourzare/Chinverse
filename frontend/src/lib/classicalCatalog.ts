import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference plan for classical Chinese; publication still comes from the public API. */
export const CLASSICAL_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "baijia-talk-classical-chinese-introduction",
        title: "百家Talk (古代汉语入门)",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: 8,
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
        knownLessonSubtitles: {},
    },
];

export const getClassicalCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CLASSICAL_CATALOG, slug);
