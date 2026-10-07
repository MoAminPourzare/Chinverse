import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import {
    BECKYBUNNY_IDIOM_TOPICS,
    DAPENG_IDIOM_TOPICS,
    NATIONAL_LIBRARY_IDIOM_TOPICS,
    SANMIAO_IDIOM_TOPICS,
    YOUPENG_IDIOM_TOPICS,
} from "@/lib/idiomsLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";
const lessonSubtitles = (topics: string[]): Record<number, string> =>
    Object.fromEntries(topics.map((topic, index) => [index + 1, topic]));
const episodeTitles = (topics: string[], lessonOverrides: number[] = []): Record<number, string> =>
    Object.fromEntries(topics.map((_, index) => {
        const position = index + 1;
        return [position, `第${position}${lessonOverrides.includes(position) ? "课" : "集"}`];
    }));

/** Editorial page plan from the owner's references; publication comes from the courses API. */
export const IDIOMS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "beckybunny-idiom-stories",
        title: "兔小贝Beckybunny (成语故事)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/兔小贝Beckybunny.jpeg`,
        lessonCount: BECKYBUNNY_IDIOM_TOPICS.length,
        description: [
            "یه مجموعه‌ی کارتونی بامزه و کوتاه که هر قسمتش یکی از اصطلاحات چهارحرفی چینی رو از طریق داستان تعریف می‌کنه. فضای کارتونی و ساده‌ش باعث میشه معنی و کاربرد اصطلاح‌ها راحت‌تر تو ذهنت بمونه، مخصوصاً چون هر اصطلاح رو داخل یه موقعیت داستانی می‌بینی، نه فقط یه توضیح خشک.",
            "زبانش ساده‌ست و برای تقویت شنیداری هم خیلی خوبه. اگه می‌خوای همزمان با یاد گرفتن اصطلاح‌ها، با فرهنگ و داستان‌های قدیمی چینی هم آشنا بشی، این مجموعه انتخاب سرگرم‌کننده‌ایه.",
        ],
        audience: [
            "متوسط رو به پیشرفته",
            "کسایی که می‌خوان اصطلاحات پرکاربرد رو یاد بگیرن",
            "زبان‌آموزایی که با محتوای کارتونی و داستانی راحت‌تر یاد می‌گیرن",
        ],
        knownLessonTitles: episodeTitles(BECKYBUNNY_IDIOM_TOPICS, [10, 40]),
        knownLessonSubtitles: lessonSubtitles(BECKYBUNNY_IDIOM_TOPICS),
    },
    {
        slug: "national-library-idiom-stories",
        title: "中国国家图书馆 (中华成语故事)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/中国国家图书馆.jpeg`,
        lessonCount: NATIONAL_LIBRARY_IDIOM_TOPICS.length,
        description: [
            "این مجموعه توسط کتابخانه ملی چین تولید شده و فضای رسمی‌تر و فرهنگی‌تری نسبت به نسخه‌های کارتونی دیگه داره. هر قسمت میره سراغ یکی از اصطلاح‌های چهارحرفی معروف و داستان تاریخی، ریشه و معنای دقیقش رو توضیح میده. تمرکز اصلی روی اینه که بفهمی هر اصطلاح از کجا اومده و تو چه موقعیتی شکل گرفته، نه فقط اینکه معنیش رو حفظ کنی.",
        ],
        audience: [
            "متوسط رو به پیشرفته",
            "کسایی که می‌خوان اصطلاحات پرکاربرد رو یاد بگیرن",
            "علاقه‌مند به فرهنگ و تاریخ چین",
        ],
        knownLessonTitles: episodeTitles(NATIONAL_LIBRARY_IDIOM_TOPICS, [10, 40]),
        knownLessonSubtitles: lessonSubtitles(NATIONAL_LIBRARY_IDIOM_TOPICS),
    },
    {
        slug: "sanmiao-kids-idiom-stories",
        title: "三淼儿童官方频道 (深刻的成语故事)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/三淼儿童官方频道.jpeg`,
        lessonCount: SANMIAO_IDIOM_TOPICS.length,
        description: [
            "این مجموعه از کانال رسمی «三淼儿童» منتشر شده و حال‌وهوای کودکانه ولی مفهومی داره. هر قسمت یکی از اصطلاح‌های چهارحرفی چینی رو از طریق یه داستان کوتاه و قابل‌فهم توضیح میده.",
            "زبانش نسبتاً ساده و قابل‌فهمه و برای تقویت شنیداری هم مناسبه، مخصوصاً اگه بخوای اصطلاح‌ها رو توی یه فضای داستانی یاد بگیری و بهتر تو ذهنت نگه داری.",
        ],
        audience: [
            "متوسط رو به پیشرفته",
            "کسایی که می‌خوان اصطلاحات پرکاربرد رو یاد بگیرن",
            "زبان‌آموزایی که با محتوای کارتونی و داستانی راحت‌تر یاد می‌گیرن",
        ],
        knownLessonTitles: episodeTitles(SANMIAO_IDIOM_TOPICS),
        knownLessonSubtitles: lessonSubtitles(SANMIAO_IDIOM_TOPICS),
    },
    {
        slug: "youpeng-chinese-idioms",
        title: "Youpeng Chinese (成语、谚语、歇后语)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Youpeng Chinese.jpeg`,
        lessonCount: YOUPENG_IDIOM_TOPICS.length,
        description: [
            "این مجموعه از کانال Youpeng Chinese یه پکیج کاربردیه که میره سراغ اصطلاح‌های رایج، ضرب‌المثل‌ها و حتی «عبارت‌های دنباله‌دار» معروف چینی. برخلاف دوره‌های داستانی که بیشتر روی روایت تمرکز دارن، اینجا توضیح‌ها مستقیم و آموزشی‌ان؛ یعنی هر اصطلاح یا ضرب‌المثل معرفی میشه، معنی دقیقش گفته میشه و بعد با مثال نشون داده میشه چطور تو جمله استفاده‌ش کنی.",
            "نکته‌ی جالب اینه که علاوه بر اصطلاح‌های چهارحرفی، سراغ ضرب‌المثل‌ها و ساختارهای خاصی میره که تو مکالمه‌ی روزمره یا متن‌های غیررسمی زیاد می‌بینی. برای همین این مجموعه بیشتر به درد کاربرد عملی می‌خوره تا صرفاً آشنایی فرهنگی. توضیح‌ها روشن و قابل‌فهمه و کمک می‌کنه بدونی هر عبارت دقیقاً تو چه موقعیتی به کار میره.",
        ],
        audience: [
            "پیش‌متوسط به بالا",
            "زبان‌آموزایی که می‌خوان اصطلاح و ضرب‌المثل کاربردی یاد بگیرن",
            "کسایی که دنبال استفاده‌ی واقعی تو مکالمه و متن هستن",
            "افرادی که توضیح آموزشی مستقیم رو به روایت داستانی ترجیح میدن",
        ],
        knownLessonTitles: episodeTitles(YOUPENG_IDIOM_TOPICS),
        knownLessonSubtitles: lessonSubtitles(YOUPENG_IDIOM_TOPICS),
    },
    {
        slug: "dapeng-chinese-idioms",
        title: "大鹏说中文 (成语、谚语、歇后语)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/大鹏说中文.jpeg`,
        lessonCount: DAPENG_IDIOM_TOPICS.length,
        description: [
            "این مجموعه از کانال «大鹏说中文» واقعاً یکی از قوی‌ترین و خوش‌ساخت‌ترین منابع برای یاد گرفتن اصطلاح‌ها و ضرب‌المثل‌های چینیه. داپنگ فقط معنی رو نمیگه؛ هر اصطلاح رو باز می‌کنه، ریشه‌ش رو توضیح میده، تفاوت‌های ظریفش با عبارت‌های مشابه رو میگه و بعد با مثال‌های واقعی نشون میده دقیقاً کی و کجا باید استفاده‌ش کنی. همین باعث میشه حس نکنی داری یه لیست خشک از اصطلاح‌ها حفظ می‌کنی، بلکه واقعاً بفهمی چطور باید زبان زنده بشن.",
            "نقطه‌ی قوت این دوره اینه که هم اصطلاح‌های چهارحرفی رو پوشش میده، هم ضرب‌المثل‌ها و هم عبارت‌های دنباله‌دار خاصی که تو مکالمه‌های طبیعی زیاد شنیده میشن. توضیح‌ها دقیق، شمرده و در عین حال قابل‌فهمه و کمک می‌کنه سطح بیانت یه‌دفعه حرفه‌ای‌تر و بومی‌تر به نظر بیاد. اگه بخوای از چینی کتابی فاصله بگیری و حرف زدنت رنگ و بوی طبیعی‌تری بگیره، این مجموعه واقعاً انتخاب درخشانیه.",
        ],
        audience: [
            "متوسط به بالا",
            "کسایی که می‌خوان بیانشون طبیعی‌تر و حرفه‌ای‌تر بشه",
            "افرادی که می‌خوان اصطلاح‌ها رو عمیق و کاربردی یاد بگیرن",
        ],
        // The reference list displays episode 19 twice before episode 20.
        knownLessonTitles: Object.fromEntries(DAPENG_IDIOM_TOPICS.map((_, index) => [index + 1, `第${index < 19 ? index + 1 : index}集`])),
        knownLessonSubtitles: lessonSubtitles(DAPENG_IDIOM_TOPICS),
    },
];

export const getIdiomsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(IDIOMS_CATALOG, slug);
