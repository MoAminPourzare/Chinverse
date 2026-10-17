import { HSK_LESSON_TOPICS } from "@/lib/hskLessonTopics";

export type HskPart = "上" | "下";

export interface HskCatalogCourse {
    slug: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
    title: string;
    tagline: string;
    coverPath: string;
    lessonCount: number;
    lessonStart: number;
    lessonPart?: HskPart;
    order: number;
    levelLabel: string;
    description: string;
    audience: string[];
}

const beginnerDescription = [
    "امتحان HSK 1 اولین سطح از سیستم قدیمی آزمون استاندارد زبان چینیه که توسط Hanban برگزار میشه. این دوره که توسط گروه Say Nihao ضبط و تدوین شده، دقیقاً بر اساس همون سرفصل‌های نسخه‌ی قدیمی طراحی شده و برای کسایی مناسبه که می‌خوان طبق ساختار کلاسیک HSK جلو برن.",
    "توی این سطح با پایه‌ای‌ترین واژه‌ها و ساختارهای زبان چینی آشنا میشی؛ معرفی خودت، اعداد، زمان، خانواده و جمله‌های ساده‌ی روزمره. تمرکز اصلی روی اینه که بتونی جمله‌های کوتاه و درست بسازی و مهارت شنیدن و خوندنت شکل بگیره.",
    "در سیستم قدیمی، این سطح شامل حدود ۱۵۰ واژه بود و انتظار می‌رفت زبان‌آموز بتونه مکالمه‌های خیلی ابتدایی و موقعیت‌های ساده‌ی روزمره رو مدیریت کنه. این دوره هم دقیقاً با همون هدف جلو میره و یه پایه‌ی محکم برای رفتن به سطح ۲ می‌سازه.",
].join("\n\n");

const hsk2Description =
    "در سطح ۲ HSK، جمله‌ها طولانی‌تر میشن و مکالمه‌ها طبیعی‌تر. حدود ۳۰۰ واژه پوشش داده میشه و با ساختارهای بیشتری برای بیان گذشته، درخواست کردن، پیشنهاد دادن و توصیف موقعیت‌ها آشنا میشین. این سطح کمک می‌کنه تا در موقعیت‌های روزمره راحت‌تر ارتباط برقرار کنی و از سطح خیلی ابتدایی خارج بشی.";

const hsk3Description =
    "این سطح یعنی ورود جدی‌تر به چینی کاربردی. حدود ۶۰۰ واژه پوشش داده میشه و می‌تونی درباره‌ی تجربه‌ها، مقایسه‌ها و موقعیت‌های متنوع حرف بزنی. ساختار جمله‌ها پیچیده‌تر میشه و توانایی درک متن‌های کوتاه و گفت‌وگوهای معمول روزمره افزایش پیدا می‌کنه.";

const hsk4Description =
    "در HSK 4 جمله‌ها بلندتر و موضوع‌ها گسترده‌تر میشن. حدود ۱۲۰۰ واژه پوشش داده میشه و می‌تونی نظرات، توضیحات مفصل و متن‌های نسبتاً طولانی رو بفهمی. مکالمه‌ها طبیعی‌تر و مستقل‌تر میشن و دیگه به جملات حفظی محدود نیستی.";

const hsk5Description =
    "تو این مرحله وارد سطح پیشرفته میشی. حدود ۲۵۰۰ واژه رو یاد می‌گیری و می‌تونی متن‌های خبری، مقاله‌های ساده و محتوای رسمی‌تر رو بخونی و بفهمی. تو مکالمه هم راحت‌تر نظر شخصی، تحلیل و توضیح پیچیده ارائه میدی. این سطح معمولاً برای تحصیل یا کار به زبان چینی اهمیت زیادی داره.";

const hsk6Description =
    "بالاترین سطح آزمون قدیم HSK محسوب میشه. اینجا دیگه انتظار میره تقریباً مثل یه گویشور مسلط غیر بومی عمل کنی. حدود ۵۰۰۰ واژه رو شامل میشه و باید بتونی متن‌های طولانی، سخنرانی‌ها و محتوای پیچیده رو درک کنی و خلاصه‌نویسی انجام بدی. تمرکز اصلی روی درک عمیق، سرعت پردازش بالا و بیان دقیق‌تره.";

export const HSK_CATALOG: HskCatalogCourse[] = [
    {
        slug: "hsk-1",
        level: 1,
        title: "HSK 1",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-1-boek.jpg",
        lessonCount: 15,
        lessonStart: 1,
        order: 1,
        levelLabel: "کاملاً مبتدی",
        description: beginnerDescription,
        audience: [
            "کسایی که هیچ پیش‌زمینه‌ای از چینی ندارن",
            "زبان‌آموزهایی که می‌خوان اصولی و پایه‌ای شروع کنن",
        ],
    },
    {
        slug: "hsk-2",
        level: 2,
        title: "HSK 2",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/MicrosoftTeams-image-16.png",
        lessonCount: 15,
        lessonStart: 1,
        order: 2,
        levelLabel: "مبتدی رو به متوسط",
        description: hsk2Description,
        audience: [
            "کسایی که HSK 1 رو گذروندن",
            "زبان‌آموزایی که می‌خوان مکالمه‌شون روان‌تر و کاربردی‌تر بشه",
        ],
    },
    {
        slug: "hsk-3",
        level: 3,
        title: "HSK 3",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/81sR2V8UC9L._AC_UF1000,1000_QL80_.jpg",
        lessonCount: 20,
        lessonStart: 1,
        order: 3,
        levelLabel: "پیش‌متوسط",
        description: hsk3Description,
        audience: [
            "زبان‌آموزایی که پایه‌ی خوبی ساختن",
            "افرادی که می‌خوان در موقعیت‌های واقعی روزمره راحت‌تر ارتباط برقرار کنن",
        ],
    },
    {
        slug: "hsk-4-shang",
        level: 4,
        title: "HSK 4上",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/MicrosoftTeams-image-11-e1699895486612.jpg",
        lessonCount: 20,
        lessonStart: 1,
        lessonPart: "上",
        order: 4,
        levelLabel: "متوسط",
        description: `${hsk4Description} HSK 4 شامل دو جلد مجزاست که تو این دوره جلد اولش رو با هم یاد می‌گیریم.`,
        audience: [
            "زبان‌آموزایی که می‌خوان مکالمه‌ی مستقل‌تری داشته باشن",
            "داوطلب‌های آزمون سطح ۴",
        ],
    },
    {
        slug: "hsk-4-xia",
        level: 4,
        title: "HSK 4下",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-4下-boek-2.0.jpg",
        lessonCount: 20,
        lessonStart: 11,
        lessonPart: "下",
        order: 5,
        levelLabel: "متوسط",
        description: `${hsk4Description} HSK 4 شامل دو جلد مجزاست که تو این دوره جلد دومش رو با هم یاد می‌گیریم.`,
        audience: [
            "زبان‌آموزایی که می‌خوان مکالمه‌ی مستقل‌تری داشته باشن",
            "داوطلب‌های آزمون سطح ۴",
        ],
    },
    {
        slug: "hsk-5-shang",
        level: 5,
        title: "HSK 5上",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-5上-boek.jpg",
        lessonCount: 36,
        lessonStart: 1,
        lessonPart: "上",
        order: 6,
        levelLabel: "متوسط رو به پیشرفته",
        description: `${hsk5Description} HSK 5 شامل دو جلد مجزاست که تو این دوره جلد اولش رو با هم یاد می‌گیریم.`,
        audience: [
            "کسایی که می‌خوان متن‌های جدی‌تر رو بخونن",
            "افرادی که برای دانشگاه یا کار به مدرک نیاز دارن",
        ],
    },
    {
        slug: "hsk-5-xia",
        level: 5,
        title: "HSK 5下",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-5下-boek.png",
        lessonCount: 36,
        lessonStart: 19,
        lessonPart: "下",
        order: 7,
        levelLabel: "متوسط رو به پیشرفته",
        description: `${hsk5Description} HSK 5 شامل دو جلد مجزاست که تو این دوره جلد دومش رو با هم یاد می‌گیریم.`,
        audience: [
            "کسایی که می‌خوان متن‌های جدی‌تر رو بخونن",
            "افرادی که برای دانشگاه یا کار به مدرک نیاز دارن",
        ],
    },
    {
        slug: "hsk-6-shang",
        level: 6,
        title: "HSK 6上",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-6上-boek.png",
        lessonCount: 40,
        lessonStart: 1,
        lessonPart: "上",
        order: 8,
        levelLabel: "پیشرفته",
        description: `${hsk6Description} HSK 6 شامل دو جلد مجزاست که تو این دوره جلد اولش رو با هم یاد می‌گیریم.`,
        audience: [
            "زبان‌آموزای جدی و حرفه‌ای",
            "کسایی که قصد تحصیل دانشگاهی یا کار تخصصی به زبان چینی دارن",
        ],
    },
    {
        slug: "hsk-6-xia",
        level: 6,
        title: "HSK 6下",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: "/assets/chinverse/course-profiles/HSK/2dd81a34-40b2-40a1-a28d-cf7c7c9f64ad.png",
        lessonCount: 40,
        lessonStart: 21,
        lessonPart: "下",
        order: 9,
        levelLabel: "پیشرفته",
        description: `${hsk6Description} HSK 6 شامل دو جلد مجزاست که تو این دوره جلد دومش رو با هم یاد می‌گیریم.`,
        audience: [
            "زبان‌آموزای جدی و حرفه‌ای",
            "کسایی که قصد تحصیل دانشگاهی یا کار تخصصی به زبان چینی دارن",
        ],
    },
];

export const getHskCourse = (slug: string | undefined): HskCatalogCourse | undefined =>
    HSK_CATALOG.find((course) => course.slug === slug);

export const getHskLessonNumber = (course: HskCatalogCourse, lessonIndex: number): number =>
    course.lessonStart + (course.lessonPart ? Math.floor(lessonIndex / 2) : lessonIndex);

export const getHskLessonTitle = (course: HskCatalogCourse, lessonIndex: number): string => {
    const lessonNumber = getHskLessonNumber(course, lessonIndex);
    const part = course.lessonPart ? `（${lessonIndex % 2 === 0 ? "上" : "下"}）` : "";
    return `第${lessonNumber}课${part}`;
};

export const getHskLessonTopic = (course: HskCatalogCourse, lessonIndex: number): string =>
    HSK_LESSON_TOPICS[course.level]?.[getHskLessonNumber(course, lessonIndex) - 1] || "";
