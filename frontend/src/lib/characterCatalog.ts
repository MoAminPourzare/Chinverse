import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Reference-based course plan; published lessons still come from the public API. */
export const CHARACTER_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "yoyo-chinese-character",
        title: "Yoyo Chinese (Character)",
        coverPath: `${assetRoot}/Yoyo Chinese.png`,
        lessonCount: 20,
        description: [
            "این بخش برای آشنایی با کاراکترهای چینی از پایه است. به‌جای حفظ‌کردن شکل‌ها به‌تنهایی، ساختار، اجزا و منطق نوشتن آن‌ها قدم‌به‌قدم توضیح داده می‌شود.",
            "تمرین‌ها به شناخت رادیکال‌ها، ترتیب خط‌ها و به‌خاطر سپردن شکل کاراکتر کمک می‌کنند تا خواندن و نوشتن کم‌کم طبیعی‌تر شود.",
        ],
        audience: [
            "مبتدی‌ای که می‌خواهد پایهٔ کاراکترها را اصولی بسازد",
            "زبان‌آموزی که حفظ‌کردن شکل کاراکترها برایش دشوار است",
            "کسی که می‌خواهد اجزا و ترتیب نوشتن کاراکتر را بهتر بفهمد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "grace-mandarin-character",
        title: "Grace Mandarin (Character)",
        coverPath: `${assetRoot}/Grace Mandarin.png`,
        lessonCount: 7,
        description: [
            "این مجموعه خواندن و نوشتن کاراکترهای چینی را با تمرکز بر شکل سنتی کاراکترها (Traditional Chinese) توضیح می‌دهد. درس‌ها به ساختار کاراکتر، ترتیب خط‌ها و تشخیص اجزا می‌پردازند.",
            "برای زبان‌آموزی که می‌خواهد با متن و کاربرد کاراکترهای سنتی، به‌ویژه در فضای تایوان، آشنا شود نقطهٔ شروع مناسبی است.",
        ],
        audience: [
            "مبتدی‌ای که می‌خواهد از اول درست نوشتن را یاد بگیرد",
            "زبان‌آموزی که به ساختارهای کاراکتر علاقه دارد",
            "کسی که می‌خواهد کاراکترهای سنتی را بشناسد",
        ],
        knownLessonSubtitles: { 1: "How to learn Chinese" },
    },
    {
        slug: "baijia-talk-hanzi",
        title: "百家Talk (走进汉字)",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: 8,
        description: [
            "این دوره دریچه‌ای به دنیای کاراکترهای چینی است و به‌جای تکیه بر حفظ شکل، به پیشینه و معنای آن‌ها هم توجه می‌کند. روایت‌های فرهنگی کمک می‌کنند ارتباط شکل و معنا روشن‌تر شود.",
            "اگر در کنار یادگیری نوشتن، به تاریخ و فرهنگ پشت کاراکترها علاقه داری، این مجموعه یک مسیر آشنایی اولیه فراهم می‌کند.",
        ],
        audience: [
            "زبان‌آموز سطح متوسط رو به بالا",
            "کسی که پایهٔ پین‌یین و کاراکتر را می‌داند",
            "علاقه‌مند به تاریخ و فرهنگ و ریشه‌شناسی کاراکترهای چینی",
        ],
        knownLessonTitles: { 1: "引言" },
        knownLessonSubtitles: {},
    },
];

export const getCharacterCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CHARACTER_CATALOG, slug);
