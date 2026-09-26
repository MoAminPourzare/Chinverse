import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { MARTIAL_ARTS_LESSON_TOPICS } from "@/lib/martialArtsLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";

export interface MartialArtsCourse extends PlannedCatalogCourse {
    portraitCover?: boolean;
}

/** Owner-reference page plan; the public courses API confirms published episodes. */
export const MARTIAL_ARTS_CATALOG: MartialArtsCourse[] = [
    {
        slug: "xue-guoxue-wang-eight-form-taijiquan",
        title: "学国学网（八式太极拳）",
        cardTitle: "学国学网",
        subtitle: "(八式太极拳)",
        coverPath: `${assetRoot}/学国学网.jpeg`,
        detailCoverPath: `${assetRoot}/八式太极拳.jpeg`,
        portraitCover: true,
        lessonCount: 13,
        fallbackLessonTitle: "قسمت",
        description: [
            "این دوره یک برنامهٔ آموزشی ساده برای یادگیری پایه‌های تای‌چی است و مخصوص مبتدی‌ها طراحی شده است. به‌جای فرم‌های طولانی، روی چند حرکت اصلی تمرکز می‌کند تا هنرجو سریع‌تر وارد فضای این ورزش شود.",
            "ویدیوها حرکت‌ها را مرحله‌به‌مرحله نشان می‌دهند؛ از اصول پایه مانند ایستادن، تعادل و تنفس تا اجرای کامل فرم‌ها. تمرین‌ها به هماهنگی بدن، تمرکز و اجرای آرام و دقیق کمک می‌کنند.",
            "فضای آموزش آرام است و بخشی از فرهنگ و هنرهای رزمی سنتی چین را منتقل می‌کند. توضیح‌ها با ماندارین معیار و روشن ارائه می‌شوند و تصویر حرکت‌ها دنبال‌کردن دوره را آسان‌تر می‌کند.",
        ],
        audience: [
            "مبتدی",
            "کسی که می‌خواهد اصول تای‌چی، تعادل و تنفس را یاد بگیرد",
            "علاقه‌مندان به تمرین آرام و هنرهای رزمی سنتی چین",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "lee-wushu-basic-staff",
        title: "Lee Wushu 武者劲松（基础棍术 教学）",
        cardTitle: "Lee Wushu 武者劲松",
        subtitle: "(基础棍术 教学)",
        coverPath: `${assetRoot}/channels4_profile.png`,
        lessonCount: 10,
        fallbackLessonTitle: "قسمت",
        description: [
            "این دوره مجموعه‌ای آموزشی برای یادگیری چوب بلند یا گون‌شو (棍术) در ووشو است. آموزش از تکنیک‌های پایه مانند گرفتن چوب، ضربه‌زدن، چرخش و کنترل آن شروع می‌شود و سپس به ترکیب حرکت‌ها و فرم‌های پیوسته می‌رسد.",
            "سبک تدریس ساده و قابل‌فهم است. حرکت‌ها آهسته و مرحله‌به‌مرحله نمایش داده می‌شوند و اجرای تمرینی در فضای باز کمک می‌کند مسیر و دامنهٔ هر حرکت بهتر دیده شود.",
            "از نظر زبانی، هنرجو با واژه‌های مربوط به مهارت بدنی، تمرین و هنرهای رزمی آشنا می‌شود و هم‌زمان تصویری عملی از فرهنگ ووشوی چینی می‌بیند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد تکنیک‌های پایهٔ چوب بلند را تمرین کند",
            "علاقه‌مندان به ووشو و واژگان مربوط به تمرین‌های رزمی",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "taichi-wei-kung-fu-fan",
        title: "立新舞太极 Taichi Wei（太极功夫扇）",
        cardTitle: "立新舞太极",
        cardSubtitle: "Taichi Wei",
        subtitle: "(太极功夫扇)",
        coverPath: `${assetRoot}/fR3W0dty9.jpeg`,
        lessonCount: 13,
        fallbackLessonTitle: "قسمت",
        description: [
            "این دوره ترکیبی از تای‌چی و حرکت‌های نمایشی با بادبزن است که در فضایی نرم، ریتمیک و چشم‌نواز اجرا می‌شود. حرکت‌ها به‌صورت آهسته آموزش داده می‌شوند و بر هماهنگی بدن، تعادل و اجرای روان تمرکز دارند.",
            "برخلاف دوره‌های رزمی خشک، این مجموعه حس هنری نیز دارد و ورزش را با فرم‌های زیبا و اجرای نمایشی پیوند می‌دهد. هنرجو هم حرکت‌ها را یاد می‌گیرد و هم با بخشی از هنر اجرایی سنتی چین آشنا می‌شود.",
            "توضیح‌ها با ماندارین معیار و روشن ارائه می‌شوند و چون تصویر نقش اصلی را در آموزش دارد، می‌توان مسیر تمرین را حتی بدون درک کامل همهٔ جمله‌ها دنبال کرد.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که به تای‌چی، تعادل و اجرای حرکت‌های نمایشی علاقه دارد",
            "زبان‌آموزی که می‌خواهد ماندارین را در آموزش عملی دنبال کند",
        ],
        knownLessonSubtitles: {},
    },
].map((course) => {
    const topics = MARTIAL_ARTS_LESSON_TOPICS[course.slug];
    const unit = course.slug === "xue-guoxue-wang-eight-form-taijiquan" ? "节" : "集";
    return {
        ...course,
        lessonCount: topics.length,
        knownLessonTitles: Object.fromEntries(topics.map((_, index) => [index + 1, `第${index + 1}${unit}`])),
        knownLessonSubtitles: Object.fromEntries(topics.map((topic, index) => [index + 1, topic])),
    };
});

export const getMartialArtsCourse = (slug: string | undefined): MartialArtsCourse | undefined =>
    getPlannedCourse(MARTIAL_ARTS_CATALOG, slug);
