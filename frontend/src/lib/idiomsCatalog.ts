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
        coverPath: `${assetRoot}/兔小贝Beckybunny.jpeg`,
        lessonCount: BECKYBUNNY_IDIOM_TOPICS.length,
        description: [
            "این مجموعهٔ کارتونی هر بار یکی از اصطلاحات چهارحرفی چینی را با یک داستان کوتاه و بامزه معرفی می‌کند. فضای رنگی و سادهٔ آن کمک می‌کند معنای اصطلاح از دل ماجرا فهمیده شود، نه فقط با حفظ‌کردن یک تعریف.",
            "روایت‌ها برای آشنایی سبک و سرگرم‌کننده با اصطلاحات و داستان‌های فرهنگی چینی مناسب‌اند و می‌توان هر قسمت را جداگانه دید.",
        ],
        audience: [
            "زبان‌آموز سطح متوسط رو به پیشرفته",
            "کسی که می‌خواهد اصطلاحات پرکاربرد را یاد بگیرد",
            "کسی که محتوای کارتونی و داستانی را راحت‌تر دنبال می‌کند",
        ],
        knownLessonTitles: episodeTitles(BECKYBUNNY_IDIOM_TOPICS, [10, 40]),
        knownLessonSubtitles: lessonSubtitles(BECKYBUNNY_IDIOM_TOPICS),
    },
    {
        slug: "national-library-idiom-stories",
        title: "中国国家图书馆 (中华成语故事)",
        coverPath: `${assetRoot}/中国国家图书馆.jpeg`,
        lessonCount: NATIONAL_LIBRARY_IDIOM_TOPICS.length,
        description: [
            "این مجموعه در فضای رسمی‌تر و فرهنگیِ کتابخانهٔ ملی چین، داستان و پیشینهٔ اصطلاحات چینی را روایت می‌کند. هر قسمت کمک می‌کند معنای دقیق یک اصطلاح و موقعیت استفاده از آن روشن‌تر شود.",
            "برای زبان‌آموزی مناسب است که علاوه بر کاربرد امروز اصطلاحات، به زمینهٔ تاریخی و فرهنگی پشت آن‌ها هم علاقه دارد.",
        ],
        audience: [
            "متوسط رو به پیشرفته",
            "کسی که می‌خواهد اصطلاحات پرکاربرد را یاد بگیرد",
            "علاقه‌مند به فرهنگ و تاریخ چین",
        ],
        knownLessonTitles: episodeTitles(NATIONAL_LIBRARY_IDIOM_TOPICS, [10, 40]),
        knownLessonSubtitles: lessonSubtitles(NATIONAL_LIBRARY_IDIOM_TOPICS),
    },
    {
        slug: "sanmiao-kids-idiom-stories",
        title: "三淼儿童官方频道 (深刻的成语故事)",
        coverPath: `${assetRoot}/三淼儿童官方频道.jpeg`,
        lessonCount: SANMIAO_IDIOM_TOPICS.length,
        description: [
            "این مجموعه از کانال رسمی 三淼儿童، داستان‌های کوتاه و مصور را برای توضیح اصطلاحات چهارحرفی چینی به کار می‌گیرد. روایت ساده و تصویری، معنای اصطلاح را در جریان قصه نشان می‌دهد.",
            "اگر می‌خواهی اصطلاح‌ها را با فضای داستانی یاد بگیری و بهتر به خاطر بسپاری، این دوره نقطهٔ شروع سبک و قابل‌دنبال‌کردنی است.",
        ],
        audience: [
            "متوسط رو به پیشرفته",
            "کسی که می‌خواهد اصطلاحات پرکاربرد را یاد بگیرد",
            "زبان‌آموزی که محتوای کارتونی و داستانی را ترجیح می‌دهد",
        ],
        knownLessonTitles: episodeTitles(SANMIAO_IDIOM_TOPICS),
        knownLessonSubtitles: lessonSubtitles(SANMIAO_IDIOM_TOPICS),
    },
    {
        slug: "youpeng-chinese-idioms",
        title: "Youpeng Chinese (成语、谚语、歇后语)",
        coverPath: `${assetRoot}/Youpeng Chinese.jpeg`,
        lessonCount: YOUPENG_IDIOM_TOPICS.length,
        description: [
            "این مجموعه از Youpeng Chinese اصطلاحات، ضرب‌المثل‌ها و عبارت‌های کنایی چینی را با توضیح کاربردشان معرفی می‌کند. هر عبارت با مثال و موقعیت استفاده‌اش همراه است تا بتوان آن را در جمله شناخت.",
            "درس‌ها برای کسی مناسب‌اند که می‌خواهد فراتر از معنی لغوی برود و تفاوت معنای فرهنگی و کاربرد واقعی این عبارت‌ها را بفهمد.",
        ],
        audience: [
            "پیش‌متوسط به بالا",
            "کسی که می‌خواهد اصطلاح و ضرب‌المثل کاربردی یاد بگیرد",
            "کسی که دنبال استفادهٔ واقعی از این عبارت‌ها در گفتار و متن است",
        ],
        knownLessonTitles: episodeTitles(YOUPENG_IDIOM_TOPICS),
        knownLessonSubtitles: lessonSubtitles(YOUPENG_IDIOM_TOPICS),
    },
    {
        slug: "dapeng-chinese-idioms",
        title: "大鹏说中文 (成语、谚语、歇后语)",
        coverPath: `${assetRoot}/大鹏说中文.jpeg`,
        lessonCount: DAPENG_IDIOM_TOPICS.length,
        description: [
            "این مجموعه از کانال 大鹏说中文 اصطلاحات و ضرب‌المثل‌های چینی را با توضیح صمیمی و مثال‌های قابل‌استفاده معرفی می‌کند. هدف این است که عبارت‌ها فقط حفظ نشوند و معنا و جای درستشان در گفتار روشن شود.",
            "در کنار اصطلاح‌های چهارحرفی، مثل‌ها و عبارت‌های کنایی هم مطرح می‌شوند تا زبان‌آموز با لایه‌های فرهنگی زبان آشنا شود.",
        ],
        audience: [
            "متوسط به بالا",
            "کسی که می‌خواهد اصطلاحات طبیعی‌تر و ظریف‌تر یاد بگیرد",
            "زبان‌آموزی که می‌خواهد آن‌ها را در مکالمه و متن به کار ببرد",
        ],
        // The reference list displays episode 19 twice before episode 20.
        knownLessonTitles: Object.fromEntries(DAPENG_IDIOM_TOPICS.map((_, index) => [index + 1, `第${index < 19 ? index + 1 : index}集`])),
        knownLessonSubtitles: lessonSubtitles(DAPENG_IDIOM_TOPICS),
    },
];

export const getIdiomsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(IDIOMS_CATALOG, slug);
