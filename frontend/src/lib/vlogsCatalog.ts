import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; the public courses API confirms published lessons. */
export const VLOGS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "zhangkai-chinese-vlog",
        title: "Zhangkai Chinese (Vlog)",
        coverPath: `${assetRoot}/Zhangkai Chinese.jpeg`,
        lessonCount: 55,
        description: [
            "این دوره از Zhangkai Chinese یادگیری زبان را در دل موقعیت‌های واقعی و روزمره پیش می‌برد. گفت‌وگوها با سرعت قابل‌دنبال‌کردن و تصویرِ همان موقعیت همراه‌اند تا بتوان معنی و کاربرد عبارت‌ها را در بافت طبیعی فهمید.",
            "ویدیوها شکل ولاگ دارند: کارهای روزمره و دیدن جاهای مختلف، فرصتی برای شنیدن جمله‌ها و واژه‌هایی می‌شوند که در مکالمهٔ واقعی به کار می‌روند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد شنیدار خود را با گفتار روزمره تقویت کند",
            "زبان‌آموزی که ولاگ و فضای واقعی را به درس خشک ترجیح می‌دهد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "hongcha-chinese-vlog",
        title: "HongCha红茶 Chinese (Vlog)",
        coverPath: `${assetRoot}/HongCha红茶 Chinese.jpeg`,
        lessonCount: 20,
        description: [
            "این دوره از HongCha 红茶 Chinese زبان چینی را در موقعیت‌های واقعی زندگی و مکالمه‌های طبیعی نشان می‌دهد. واژه‌ها و اصطلاحات کاربردی در جریان روایت و تصویر توضیح داده می‌شوند تا شکل استفادهٔ آن‌ها روشن شود.",
            "فضای ولاگ برای کسی مناسب است که می‌خواهد شنیدن چینی روزمره را تمرین کند و هم‌زمان با شیوهٔ زندگی و موقعیت‌های عادی آشنا شود.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "زبان‌آموزی که می‌خواهد چینی را در موقعیت‌های واقعی تجربه کند",
            "کسی که شنیدار و گفتارش را طبیعی‌تر می‌خواهد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "free-to-learn-chinese-vlog",
        title: "Free To Learn Chinese (Vlog)",
        coverPath: `${assetRoot}/Free To Learn Chinese.jpeg`,
        lessonCount: 14,
        description: [
            "این دوره زبان را در گفت‌وگوهای روزمره و موقعیت‌های معمول زندگی آموزش می‌دهد. توضیح‌ها صمیمی‌اند و به‌جای یک درس رسمیِ طولانی، عبارت‌ها را در زمینهٔ واقعی‌شان نشان می‌دهند.",
            "برای کسی مناسب است که می‌خواهد با دیدن و شنیدن موقعیت‌های ساده، واژه‌ها و جمله‌های کاربردی را تمرین کند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد چینی روزمره و کاربردی یاد بگیرد",
            "زبان‌آموزی که گفت‌وگوهای واقعی را راحت‌تر دنبال می‌کند",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "hi-chinese-vlog",
        title: "Hi Chinese",
        coverPath: `${assetRoot}/Hi Chinese.jpeg`,
        lessonCount: 19,
        description: [
            "این دوره موضوع‌های روزمره و اجتماعی چین را با ویدیوهای کوتاه و تصویری معرفی می‌کند. در کنار واژگان و اصطلاحات، نمونه‌هایی از زندگی شهری، فرهنگ و موقعیت‌های واقعی دیده می‌شوند.",
            "سبک آموزش ساده و کاربردی است و کمک می‌کند زبان‌آموز هم شنیدن چینی را تمرین کند و هم با زمینهٔ فرهنگی عبارت‌ها آشنا شود.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد با موضوع‌های واقعی و روزمرهٔ چین آشنا شود",
            "زبان‌آموزی که به فرهنگ و محتوای اجتماعی علاقه دارد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "zhangkai-chinese-short-videos",
        title: "Zhangkai Chinese (中文学习短视频)",
        coverPath: `${assetRoot}/Zhangkai Chinese.jpeg`,
        lessonCount: 22,
        description: [
            "این مجموعه از ویدیوهای کوتاه و چینی‌محور Zhangkai Chinese ساخته شده است. هر قسمت روی یک نکتهٔ کوچک، واژه یا عبارت کاربردی تمرکز می‌کند تا بتوان آن را در زمان کوتاه دید و مرور کرد.",
            "درس‌های کوتاه برای مرور روزانه و تقویت تدریجی واژگان و جمله‌های واقعی مناسب‌اند.",
        ],
        audience: [
            "مبتدی",
            "کسی که می‌خواهد واژگان و افعال کاربردی را سریع یاد بگیرد",
            "زبان‌آموزی که دنبال درس‌های کوتاه و مفید است",
        ],
        knownLessonSubtitles: {},
    },
];

export const getVlogsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(VLOGS_CATALOG, slug);
