import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { COOKING_LESSON_TOPICS, WANG_GANG_THUMBNAIL_FILES } from "@/lib/cookingLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";

export interface CookingCourse extends PlannedCatalogCourse {
    portraitCover?: boolean;
    chineseTopics?: boolean;
}

/** Owner-reference page plan; the public courses API confirms published episodes. */
export const COOKING_CATALOG: CookingCourse[] = [
    {
        slug: "wanneng-gongjuren-a-wei",
        title: "万能工具人阿伟",
        subtitle: "Wànnéng gōngjù rén a Wěi",
        coverPath: `${assetRoot}/万能工具人阿伟.jpeg`,
        lessonCount: 46,
        fallbackLessonTitle: "قسمت",
        description: [
            "این برنامه یه کانال آشپزی با فضای کاملاً خودمونی و ولاگه که مجری توش غذاهای مختلف رو مرحله‌به‌مرحله درست می‌کنه و هم‌زمان درباره مواد اولیه و روش پخت توضیح می‌ده. حس‌وحالش دقیقاً طوریه که انگار توی آشپزخونه کنارش ایستادی و داری همراهش آشپزی یاد می‌گیری. برای زبان‌آموزها فرصت خیلی خوبیه تا با واژه‌های مربوط به مواد غذایی، روش‌های پخت، طعم‌ها و اصطلاحات رایج آشپزی آشنا بشن.",
            "علاوه بر یادگیری زبان، کسایی که به فرهنگ و غذاهای چینی علاقه دارن هم می‌تونن از دستورها استفاده کنن و خودشون غذاهای خوشمزه چینی درست کنن.",
            "سرآشپز اهل سیچوانه و با لهجه محلی صحبت می‌کنه. به همین دلیل، تلفظ بعضی صداها—مثل f و h و n و l—گاهی با تلفظ معیار ماندارین تفاوت داره یا به‌جای هم شنیده می‌شن. همچنین بعضی از واژه‌ها و اصطلاحاتی که استفاده می‌کنه مربوط به گویش محلی سیچوانه و ممکنه در ماندارین معیار چندان رایج نباشن.",
            "مجری نسبتاً تند صحبت می‌کنه؛ بنابراین از نظر شنیداری، این دوره بیشتر برای زبان‌آموزهای سطح پیشرفته مناسبه. بااین‌حال، چون تمام ویدئوها زیرنویس فارسی دارن، زبان‌آموزها در هر سطحی می‌تونن از برنامه استفاده کنن و در کنار یادگیری زبان، با آشپزی و فرهنگ غذایی چین هم آشنا بشن."
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد شنیدار روزمره و واژگان آشپزی را تقویت کند",
            "علاقه‌مندان به غذا و فرهنگ غذایی چین",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
    {
        slug: "meishi-zuojia-wang-gang",
        title: "美食作家王刚",
        subtitle: "Měishí Zuòjiā Wáng Gāng",
        coverPath: `${assetRoot}/آشپزی/美食作家王刚.png`,
        portraitCover: true,
        knownLessonThumbnails: Object.fromEntries(WANG_GANG_THUMBNAIL_FILES.map((file, index) => [
            index + 1, `${assetRoot}/آشپزی/${encodeURIComponent("wang gang")}/${encodeURIComponent(file)}`,
        ])),
        lessonCount: 16,
        fallbackLessonTitle: "قسمت",
        description: [
            "این کانال یه برنامه آشپزیه، اما نه از اون مدل‌های معمولی! سرآشپز غذاهایی درست می‌کنه که خیلی وقت‌ها برای ما عجیب و غیرمنتظره‌ان؛ از مواد اولیه خاص گرفته تا روش‌های پخت متفاوت. خیلی از موادی که استفاده می‌کنه معمولاً تو ایران پیدا نمی‌شن، برای همین بیشتر از اینکه بخوای دقیقاً دستورشو اجرا کنی، جنبه‌ی دیدنی و فان داره.",
            "اگه همیشه برات سؤال بوده که «آیا چینی‌ها واقعاً غذاهای عجیب‌غریب می‌خورن یا نه؟» این برنامه دقیقاً همون چیزیه که باید ببینی. هم با فرهنگ غذایی متنوع چین آشنا می‌شی، هم کلی سوپرایز می‌شی.",
            "لهجه و تلفظش ماندارین استاندارد و کاملاً قابل فهمه، فقط بعضی وقت‌ها یه حال‌وهوای محلی سیچوانی تو لحنش حس میشه که تأثیر خاصی روی درک جمله‌ها نمی‌ذاره."
        ],
        audience: [
            "متوسط و بالاتر",
            "کسی که به تکنیک‌های واقعی آشپزی و واژگان تخصصی‌تر علاقه دارد",
            "زبان‌آموزی که می‌خواهد گفتار سریع و کاربردی را دنبال کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
    {
        slug: "lao-fan-gu",
        title: "老饭骨",
        subtitle: "Lǎo fàn gǔ",
        coverPath: `${assetRoot}/آشپزی/老饭骨.png`,
        lessonCount: 21,
        fallbackLessonTitle: "قسمت",
        description: [
            "این کانال یه برنامه آشپزی حرفه‌ایه که توسط دو تا سرآشپز باتجربه اجرا میشه و بیشتر روی غذاهای اصیل و سنتی چینی تمرکز داره. برخلاف خیلی از کانال‌های ساده‌تر، اینجا با تکنیک‌های واقعی آشپزی، فوت‌وفن‌ها و جزئیات مهمی آشنا می‌شی که معمولاً فقط سرآشپزهای حرفه‌ای می‌دونن.",
            "فضای برنامه جدی‌تره ولی همچنان قابل‌فهم و جذابه، مخصوصاً اگر به فرهنگ غذایی چین علاقه داشته باشی. در کنارش برای زبان‌آموزها هم خیلی مفیده چون با واژگان دقیق آشپزی، مواد اولیه و اصطلاحات حرفه‌ای آشنا می‌شی."
        ],
        audience: [
            "متوسط و بالاتر",
            "علاقه‌مندان به روش‌های اصیل و حرفه‌ای آشپزی چینی",
            "کسی که می‌خواهد واژگان و توضیح‌های دقیق آشپزی را تمرین کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
    {
        slug: "zhongguo-meishi-pindao",
        title: "中国美食频道",
        subtitle: "Zhōngguó Měishí Píndào",
        coverPath: `${assetRoot}/آشپزی/中国美食频道.png`,
        chineseTopics: true,
        lessonCount: 34,
        fallbackLessonTitle: "قسمت",
        description: [
            "این کانال بیشتر از اینکه سراغ غذاهای اصلی بره، تمرکزش روی دسرها، بستنی‌ها و نوشیدنی‌های خوشمزه و خاصه. تو ویدیوها انواع شیرینی‌های جذاب، دسرهای خلاقانه، آیس‌کریم‌های متنوع و نوشیدنی‌هایی مثل چای‌های طعم‌دار و بابل‌تی آموزش داده می‌شن که هم ظاهر قشنگی دارن هم حسابی وسوسه‌کننده‌ان.",
            "سبک ویدیوها معمولاً ساده و کوتاهه و حتی اگر قصد درست کردنشون رو نداشته باشی، دیدنشون خودش لذت‌بخشه. در کنارش برای زبان‌آموزها هم فرصت خوبیه که با واژه‌های مربوط به مواد شیرین، طعم‌ها، نوشیدنی‌ها و اصطلاحات آشپزی سبک دسر آشنا بشن."
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که به دسرها، نوشیدنی‌ها و خوراکی‌های سنتی علاقه دارد",
            "زبان‌آموزی که ویدیوهای کوتاه و تصویری را ترجیح می‌دهد",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
    },
].map((course) => {
    const topics = COOKING_LESSON_TOPICS[course.slug];
    return {
        ...course,
        lessonCount: topics.length,
        knownLessonTitles: Object.fromEntries(topics.map((_, index) => [index + 1, `第${index + 1}集`])),
        knownLessonSubtitles: Object.fromEntries(topics.map((topic, index) => [index + 1, topic])),
    };
});

export const getCookingCourse = (slug: string | undefined): CookingCourse | undefined =>
    getPlannedCourse(COOKING_CATALOG, slug);
