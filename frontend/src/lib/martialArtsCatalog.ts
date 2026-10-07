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
            "این دوره یه برنامه آموزشی برای یادگیری تای‌چیه که به شکل ساده‌شده و مخصوص مبتدی‌ها طراحی شده. به‌جای فرم‌های طولانی، فقط روی چند حرکت اصلی تمرکز می‌کنه تا سریع‌تر وارد فضای این ورزش بشی. در واقع این مجموعه نسخه‌ای خلاصه از سبک یانگ هست که فقط مهم‌ترین حرکات رو نگه داشته و برای شروع خیلی مناسبه",
            "توی ویدیوها حرکات مرحله‌به‌مرحله آموزش داده می‌شن؛ از اصول پایه مثل ایستادن، تعادل و تنفس گرفته تا اجرای کامل فرم‌ها. علاوه بر یادگیری حرکت‌ها، یه جورایی با فضای آرامش، تمرکز و سبک زندگی سنتی چینی هم آشنا می‌شی.",
            "از نظر زبانی توضیح‌ها با ماندارین معیار و واضح گفته می‌شن، ولی چون تمرکز اصلی روی حرکته، حتی بدون درک کامل زبان هم می‌تونی همراهی کنی."
        ],
        audience: [
            "مبتدی",
            "کسی که می‌خواهد اصول تای‌چی، تعادل و تنفس را یاد بگیرد",
            "علاقه‌مندان به تمرین آرام و هنرهای رزمی سنتی چین",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
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
            "این دوره یه مجموعه آموزشیه برای یادگیری چوب‌زنی (棍术) در ووشو که از پایه شروع می‌کنه و حرکات اصلی رو قدم‌به‌قدم یاد می‌ده. تمرکز روی تکنیک‌های اولیه مثل نحوه گرفتن چوب، ضربه‌ها، چرخش‌ها و کنترل بدنته—طوری که حتی بدون پیش‌زمینه هم بتونی شروع کنی.",
            "سبک تدریسش خیلی عملی و قابل فهمه؛ حرکات رو آهسته و مرحله‌ای نشون می‌ده و بعد توی اجرا ترکیبشون می‌کنه، برای همین هم برای یادگیری تصویری خیلی مناسبه.",
            "از نظر محتوا بیشتر جنبه آموزشی مهارت و تمرین بدنی داره تا زبان، ولی در کنارش با یه سری واژه‌های مربوط به هنرهای رزمی هم آشنا می‌شی."
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که می‌خواهد تکنیک‌های پایهٔ چوب بلند را تمرین کند",
            "علاقه‌مندان به ووشو و واژگان مربوط به تمرین‌های رزمی",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
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
            "این دوره ترکیبی از تای‌چی و حرکات نمایشی با بادبزنه که یه فضای خیلی نرم، ریتمیک و چشم‌نواز داره. حرکات به‌صورت فرم‌های مشخص آموزش داده می‌شن و بیشتر روی هماهنگی بدن، تعادل و اجرای روان تمرکز داره.",
            "برخلاف دوره‌های رزمی خشک، اینجا یه حس هنری هم هست؛ هم ورزشه هم یه جور اجرای زیبا. برای همین خیلی‌ها فقط برای آرامش و لذت بردن هم دنبالش می‌کنن.",
            "از نظر زبانی توضیح‌ها با ماندارین معیار گفته میشه، ولی چون آموزش بیشتر بصریه، حتی بدون فهم کامل زبان هم می‌تونی همراهی کنی"
        ],
        audience: [
            "مبتدی تا متوسط",
            "کسی که به تای‌چی، تعادل و اجرای حرکت‌های نمایشی علاقه دارد",
            "زبان‌آموزی که می‌خواهد ماندارین را در آموزش عملی دنبال کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی دوره:",
        tagline: "هنر و مهارت‌های چینی | ؟ دقیقه",
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
