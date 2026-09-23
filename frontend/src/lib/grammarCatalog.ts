import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Reference-based page plan; the public API remains the source of published lessons. */
export const GRAMMAR_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "chinese-zero-to-hero-grammar",
        title: "Chinese Zero to Hero",
        coverPath: `${assetRoot}/Chinese Zero to Hero.jpeg`,
        lessonCount: 175,
        description: [
            "دورهٔ گرامر Chinese Zero to Hero آموزش ساختارمند و سطح‌بندی‌شده‌ای است که دستور زبان چینی را بر اساس سطح‌های HSK پیش می‌برد. نکته‌ها با توضیح روشن، مثال و تمرین آموزش داده می‌شوند تا زبان‌آموز بتواند آن‌ها را در جمله به کار ببرد.",
            "این مسیر برای کسی مناسب است که می‌خواهد قواعد را به‌ترتیب یاد بگیرد، تفاوت ساختارهای نزدیک را بفهمد و در کنار واژه‌ها و متن‌های HSK پایهٔ گرامرش را محکم کند.",
        ],
        audience: [
            "مبتدی تا متوسط، بسته به سطح HSK انتخابی",
            "زبان‌آموزی که برای آزمون HSK آماده می‌شود",
            "کسی که به توضیح مرحله‌به‌مرحله و تمرین منظم نیاز دارد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "baijia-talk-grammar",
        title: "百家Talk (初级汉语语法进阶)",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        lessonCount: 7,
        description: [
            "این مجموعه گرامر پایهٔ چینی را قدم‌به‌قدم پیش می‌برد. به‌جای حفظ‌کردن نام قواعد، جای واژه‌ها در جمله و کاربرد ساختارهایی مانند «把» و «被» با مثال توضیح داده می‌شود.",
            "درس‌ها برای کسی طراحی شده‌اند که می‌خواهد از جمله‌های ساده به ساختارهای دقیق‌تر برسد و با تمرین کوتاه، کاربرد هر الگو را در گفتار و نوشتار بفهمد.",
        ],
        audience: [
            "مبتدی پیشرفته تا متوسط",
            "زبان‌آموزی که HSK 1 و HSK 2 را گذرانده است",
            "کسی که می‌خواهد پیش از ورود به سطح متوسط، جمله‌سازی را تثبیت کند",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "yoyo-chinese-grammar",
        title: "Yoyo Chinese (Grammar)",
        coverPath: `${assetRoot}/Yoyo Chinese.png`,
        lessonCount: 10,
        description: [
            "در دورهٔ گرامر یویو چاینیز، جمله‌سازی و قواعد کاربردی چینی با توضیح ساده و مثال‌های روشن آموزش داده می‌شوند. موضوع‌ها از ترتیب کلمات و جمله‌های پرسشی تا ساختارهای پرکاربرد پیش می‌روند.",
            "هدف این است که زبان‌آموز فقط قاعده را حفظ نکند؛ بتواند تفاوت شکل‌های نزدیک را بفهمد و در مکالمه و نوشتن از آن‌ها استفاده کند.",
        ],
        audience: [
            "مبتدی رو به پیشرفت تا متوسط",
            "کسی که در ترتیب جمله و سؤال‌سازی مشکل دارد",
            "زبان‌آموزی که توضیح ساده و کاربردی می‌خواهد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "grace-mandarin-grammar",
        title: "Grace Mandarin (Grammar)",
        coverPath: `${assetRoot}/Grace Mandarin.png`,
        lessonCount: 7,
        description: [
            "این دورهٔ گرامر گریس ماندارین الگوهای جمله‌سازی چینی را با توضیح روشن و مثال‌های کاربردی بررسی می‌کند. نکته‌ها به‌جای حفظ‌کردن خشک قواعد، در جمله‌های واقعی نشان داده می‌شوند.",
            "توضیح‌ها با رویکرد یک مدرس تایوانی ارائه می‌شوند و برای زبان‌آموزی مناسب‌اند که می‌خواهد گرامر را دقیق‌تر و طبیعی‌تر در گفتار و نوشتار به کار ببرد.",
        ],
        audience: [
            "پیش‌متوسط",
            "کسی که با 了 و تفاوت کاربردهای آن درگیر است",
            "زبان‌آموزی که می‌خواهد جمله‌های دقیق‌تر و طبیعی‌تر بسازد",
        ],
        knownLessonSubtitles: {},
    },
];

export const getGrammarCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(GRAMMAR_CATALOG, slug);
