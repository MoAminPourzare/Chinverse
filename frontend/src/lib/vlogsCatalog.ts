import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import {
    FREE_TO_LEARN_VLOG_TOPICS,
    HI_CHINESE_VLOG_TOPICS,
    HONGCHA_VLOG_TOPICS,
    ZHANGKAI_SHORT_TOPICS,
    ZHANGKAI_VLOG_TOPICS,
} from "@/lib/vlogsLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";
const subtitles = (topics: string[]): Record<number, string> =>
    Object.fromEntries(topics.map((topic, index) => [index + 1, topic]));
const episodeTitles = (topics: string[], lessonOverrides: number[] = []): Record<number, string> =>
    Object.fromEntries(topics.map((_, index) => {
        const position = index + 1;
        return [position, `第${position}${lessonOverrides.includes(position) ? "课" : "集"}`];
    }));

/** Owner-reference page plan; the public courses API confirms published lessons. */
export const VLOGS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "zhangkai-chinese-vlog",
        title: "Zhangkai Chinese (Vlog)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Zhangkai Chinese.jpeg`,
        lessonCount: ZHANGKAI_VLOG_TOPICS.length,
        description: [
            "این دوره از Zhangkai Chinese یه سبک آموزش متفاوت داره که به‌جای تمرکز روی حفظ کردن لغت و گرامر، سعی می‌کنه زبان رو از راه فهمیدن تدریجی یاد بده. یعنی چی؟ یعنی تو رو توی موقعیت‌های واقعی قرار میده، زیاد برات چینی حرف می‌زنه، با تصویر و فضا کمک می‌کنه معنی رو حدس بزنی و کم‌کم ذهنت خودش ساختارها و واژه‌ها رو جذب می‌کنه. دقیقاً شبیه روشی که یه بچه زبان مادریشو یاد می‌گیره.",
            "ویدیوها به شکل ولاگ ساخته شدن؛ یعنی شبیه ویدیوهای روزمره از زندگی واقعی هستن. همین باعث میشه با نحوه‌ی طبیعی صحبت کردن، لحن، ریتم جمله‌ها و کاربرد واقعی کلمات آشنا بشی، نه فقط شکل کتابیشون. یادگیری اینجا حس کلاس خشک و رسمی نداره، بیشتر حس اینو میده که داری کنار یه چینی‌زبان زندگی رو تجربه می‌کنی.",
            "اگه از حفظ کردن‌های پشت‌سرهم خسته شدی و دوست داری زبان رو با دیدن، شنیدن و درک کردن واقعی یاد بگیری، این سبک خیلی برات جذاب و مؤثر خواهد بود.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسایی که می‌خوان شنیدارشون قوی بشه",
            "افرادی که با فضای واقعی و روزمره بهتر یاد می‌گیرن",
            "زبان‌آموزایی که از روش‌های خشک گرامرمحور خوششون نمیاد",
        ],
        knownLessonTitles: episodeTitles(ZHANGKAI_VLOG_TOPICS, [10, 40]),
        knownLessonSubtitles: subtitles(ZHANGKAI_VLOG_TOPICS),
    },
    {
        slug: "hongcha-chinese-vlog",
        title: "HongCha红茶 Chinese (Vlog)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/HongCha红茶 Chinese.jpeg`,
        lessonCount: HONGCHA_VLOG_TOPICS.length,
        description: [
            "این دوره از HongCha 红茶 Chinese یه سبک جذاب و کاربردیه که زبان چینی رو در موقعیت‌های واقعی زندگی و محیط‌های طبیعی آموزش میده. به‌جای اینکه فقط از لغت‌ها و گرامر خشک حرف بزنه، ویدیوها تو صحنه‌های واقعی ضبط شده — مثل فروشگاه، رستوران، خیابون، محل کار و موقعیت‌های روزمره‌ای که واقعاً تو زندگی باهاش روبرو میشی. این باعث میشه هم شنیدارت تقویت بشه، هم بفهمی چطور جمله‌ها و واژه‌ها تو موقعیت واقعی به‌کار میرن.",
            "هر درس ترکیبی از اصطلاح‌های کاربردی، مکالمه‌های طبیعی و موقعیت‌های روزمره‌ست و تمرکز داره روی اینکه بتونی تو زندگی واقعی سریع‌تر چینی رو بفهمی و استفاده کنی. سبک آموزش واقع‌گرایانه‌ست و حس کلاس رسمی نداره؛ بیشتر احساس می‌کنی داری همراه با یه دوست یا همراه، زبان رو وسط تجربه‌های واقعی یاد می‌گیری.",
            "اگه دنبال یه دوره‌ای هستی که یادگیری رو از کتاب‌ها بیرون بیاره و بهت یاد بده چطور تو موقعیت‌های واقعی صحبت کنی، این مجموعه واقعاً انتخاب خوبیه.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "زبان‌آموزانی که می‌خوان چینی رو تو موقعیت‌های واقعی تجربه کنن",
            "افرادی که شنیدار و گفتارشون رو طبیعی‌تر کنن",
            "کسایی که از درس‌های محیط واقعی و کاربرد مستقیم لذت می‌برن",
        ],
        knownLessonTitles: episodeTitles(HONGCHA_VLOG_TOPICS, [10]),
        knownLessonSubtitles: subtitles(HONGCHA_VLOG_TOPICS),
    },
    {
        slug: "free-to-learn-chinese-vlog",
        title: "Free To Learn Chinese (Vlog)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Free To Learn Chinese.jpeg`,
        lessonCount: FREE_TO_LEARN_VLOG_TOPICS.length,
        description: [
            "این دوره توسط یک مدرس زن اجرا می‌شه که با لحن صمیمی و جذاب، درباره موضوعات روزمره و کاربردی زندگی صحبت می‌کنه. مثلاً یاد می‌گیری چطور هتل رزرو کنی، تو رستوران غذا سفارش بدی، خرید کنی یا با مردم محلی صحبت کنی. درس‌ها خشک و رسمی نیستن و حس می‌کنی کنار یه معلم مهربون نشستی که جمله‌به‌جمله راهنماییت می‌کنه.",
            "هر درس کوتاه و هدفمند طراحی‌شده و تمرکزش روی واژه‌ها و ساختارهایی هست که واقعاً تو زندگی روزمره استفاده می‌شن. همین باعث می‌شه زبانت سریع‌تر کاربردی بشه و مهارت شنیدار و گفتارت تو موقعیت‌های واقعی تقویت بشه.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسایی که می‌خوان چینی روزمره و کاربردی یاد بگیرن",
            "افرادی که قصد دارن تو سفر یا موقعیت‌های واقعی راحت صحبت کنن",
            "زبان‌آموزایی که از درس‌های صمیمی و سرگرم‌کننده لذت می‌برن",
        ],
        knownLessonTitles: episodeTitles(FREE_TO_LEARN_VLOG_TOPICS),
        knownLessonSubtitles: subtitles(FREE_TO_LEARN_VLOG_TOPICS),
    },
    {
        slug: "hi-chinese-vlog",
        title: "Hi Chinese",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Hi Chinese.jpeg`,
        lessonCount: HI_CHINESE_VLOG_TOPICS.length,
        description: [
            "این دوره بیشتر از اینکه حول یک مدرس مشخص باشه، روی موضوعات جذاب و واقعی روزمره و اجتماعی تمرکز داره. بخش عمده‌ای از ویدیوها درباره چگونگی پشت سر گذاشتن دوران کووید در کشورهای مختلفه، ولی علاوه بر این، موضوعات متنوع دیگه‌ای هم داره مثل تفکیک زباله، زندگی شهری، فرهنگ روزمره و نکات محیط زیستی.",
            "سبک آموزش خیلی مستقیم و کاربردیه؛ یعنی هر ویدیو با مثال‌های واقعی و موقعیت‌های ملموس ساخته شده تا زبان‌آموز همزمان با یادگیری واژه‌ها و اصطلاحات، با زندگی روزمره مردم در چین و دنیا هم آشنا بشه. این باعث میشه هم شنیدار تقویت بشه و هم دایره واژگان کاربردی و موضوعی گسترده‌تر بشه.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسایی که می‌خوان با موضوعات واقعی و روزمره چینی آشنا بشن",
            "زبان‌آموزانی که دوست دارن واژگان کاربردی و اصطلاحات عمومی رو درک کنن",
            "افرادی که به یادگیری همراه با محتواهای اجتماعی و فرهنگی علاقه دارن",
        ],
        knownLessonTitles: episodeTitles(HI_CHINESE_VLOG_TOPICS),
        knownLessonSubtitles: subtitles(HI_CHINESE_VLOG_TOPICS),
    },
    {
        slug: "zhangkai-chinese-short-videos",
        title: "Zhangkai Chinese (中文学习短视频)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Zhangkai Chinese.jpeg`,
        lessonCount: ZHANGKAI_SHORT_TOPICS.length,
        description: [
            "این دوره مجموعه‌ای از ویدیوهای کوتاه و خیلی سریعه که مخصوص زبان‌آموزان مبتدی طراحی شده. هر ویدیو حدود زیر یک دقیقه طول داره و تمرکزش روی یادگیری کلمات و فعل‌های کاربردی روزمره‌ست. به این شکل، تو می‌تونی بدون اینکه زمان زیادی بذاری، هر روز یه بسته‌ی کوچک اما مفید از واژگان و افعال جدید رو یاد بگیری و کم‌کم دایره لغاتت قوی بشه.",
        ],
        audience: [
            "مبتدی",
            "کسایی که می‌خوان واژگان و افعال پرکاربرد روزمره رو سریع یاد بگیرن",
            "افرادی که وقت کمی دارن و دنبال درس‌های کوتاه و مفید هستن",
        ],
        knownLessonTitles: episodeTitles(ZHANGKAI_SHORT_TOPICS, [10]),
        knownLessonSubtitles: subtitles(ZHANGKAI_SHORT_TOPICS),
    },
];

export const getVlogsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(VLOGS_CATALOG, slug);
