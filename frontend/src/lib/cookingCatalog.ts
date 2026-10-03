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
            "این برنامه یک کانال آشپزی با فضایی صمیمی، کاربردی و سرگرم‌کننده است. مجری غذاهای مختلف و مردم‌پسند را معرفی می‌کند، مواد اولیه و روش پخت را توضیح می‌دهد و فضای برنامه شبیه آشپزی در کنار یک دوست است.",
            "در کنار دستور غذا، برنامه فرصت خوبی برای آشنایی با واژه‌ها و اصطلاحات آشپزی چینی فراهم می‌کند؛ از نام مواد و طعم‌ها تا ابزارها و روش‌های پخت.",
            "مجری اهل سیچوان است و گاهی ردّ لهجهٔ محلی در گفتارش شنیده می‌شود. زیرنویس فارسی می‌تواند دنبال‌کردن بخش‌های دشوارتر را آسان‌تر کند و هم‌زمان شنیدار و آشنایی با فرهنگ غذایی چین را تقویت کند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد شنیدار روزمره و واژگان آشپزی را تقویت کند",
            "علاقه‌مندان به غذا و فرهنگ غذایی چین",
        ],
        knownLessonSubtitles: {},
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
            "این کانال یک برنامهٔ آشپزی متفاوت است. سرآشپز غذاهایی را آموزش می‌دهد که گاهی مواد اولیه و روش‌های پخت غیرمنتظره دارند و جزئیات آماده‌سازی را مرحله‌به‌مرحله نشان می‌دهد.",
            "گفتار برنامه محاوره‌ای و روشن است و نام مواد، ابزارها و فعل‌های رایج آشپزی را در یک موقعیت واقعی تکرار می‌کند. همین ویژگی آن را برای یادگیری زبان در کنار دیدن روش پخت غذاهای متنوع چینی مناسب می‌کند.",
            "لحن سرآشپز صریح و بی‌تکلف است؛ بنابراین شنونده فقط دستور غذا نمی‌بیند و با شیوهٔ توضیح‌دادن، توصیف طعم و اصطلاحات روزمرهٔ آشپزخانه نیز آشنا می‌شود.",
        ],
        audience: [
            "متوسط و بالاتر",
            "کسی که به تکنیک‌های واقعی آشپزی و واژگان تخصصی‌تر علاقه دارد",
            "زبان‌آموزی که می‌خواهد گفتار سریع و کاربردی را دنبال کند",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "lao-fan-gu",
        title: "老饭骨",
        subtitle: "Lǎo fàn gǔ",
        coverPath: `${assetRoot}/آشپزی/老饭骨.png`,
        lessonCount: 21,
        fallbackLessonTitle: "قسمت",
        description: [
            "این کانال یک برنامهٔ آموزشی حرفه‌ای است که دو سرآشپز باتجربه آن را اجرا می‌کنند. آن‌ها روش‌های اصیل آشپزی چینی، تکنیک‌های واقعی، فوت‌وفن‌ها و جزئیات مهم کار را با توضیحی روشن و مرحله‌به‌مرحله نشان می‌دهند.",
            "فضای برنامه جدی اما صمیمی است و تجربهٔ حرفه‌ای آشپزها را به زبان قابل‌فهم منتقل می‌کند. در کنار روش پخت، دربارهٔ انتخاب مواد، کنترل حرارت و دلیل هر مرحله نیز صحبت می‌شود.",
            "برای زبان‌آموزی مناسب است که به فرهنگ غذایی چین علاقه دارد و می‌خواهد هم‌زمان با یادگیری آشپزی، واژه‌ها و اصطلاحات حرفه‌ای‌تری بشنود.",
        ],
        audience: [
            "متوسط و بالاتر",
            "علاقه‌مندان به روش‌های اصیل و حرفه‌ای آشپزی چینی",
            "کسی که می‌خواهد واژگان و توضیح‌های دقیق آشپزی را تمرین کند",
        ],
        knownLessonSubtitles: {},
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
            "این کانال بیش از آموزش غذاهای اصلی، روی خوراکی‌های سنتی، دسرهای خانگی، نوشیدنی‌های خوشمزه و آب‌میوه‌های متنوع تمرکز دارد. ویدیوها کوتاه، ساده و از نظر دیداری جذاب‌اند.",
            "روش آماده‌سازی مرحله‌به‌مرحله نمایش داده می‌شود و گفتار روشن برنامه برای تمرین شنیدار مناسب است. تصویر نیز کمک می‌کند معنی نام مواد، طعم‌ها و اصطلاحات آشپزی از روی بافت فهمیده شود.",
            "این مجموعه فرصتی برای آشنایی هم‌زمان با سبک زبان روزمره و بخشی از رسم‌ها و خوراکی‌های رایج چینی فراهم می‌کند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که به دسرها، نوشیدنی‌ها و خوراکی‌های سنتی علاقه دارد",
            "زبان‌آموزی که ویدیوهای کوتاه و تصویری را ترجیح می‌دهد",
        ],
        knownLessonSubtitles: {},
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
