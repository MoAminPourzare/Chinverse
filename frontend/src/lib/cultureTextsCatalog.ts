import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { CULTURE_TEXT_LESSONS } from "@/lib/cultureTextsLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";

/** Owner-reference page plan; published lessons are attached only after the public API confirms them. */
export const CULTURE_TEXTS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "rabbit-sanzijing",
        title: "兔小贝国学",
        cardTitle: "兔小贝",
        subtitle: "《三字经》",
        cardSubtitle: "《三字经》",
        coverPath: `${assetRoot}/兔小贝Beckybunny.jpeg`,
        detailCoverPath: `${assetRoot}/三字经.jpeg`,
        detailImageAspect: "video",
        lessonCount: 62,
        chapterCount: 62,
        countSummary: "۶۲ درس · ۶۳ بخش",
        fallbackLessonTitle: "درس",
        description: [
            "این مجموعه روی آموزش یکی از معروف‌ترین متون کلاسیک آموزشی چین یعنی «کتاب سه‌کاراکتری» (三字经) کار می‌کنه. این کتاب از قدیم برای آموزش بچه‌ها استفاده می‌شده و هر جمله‌اش فقط از سه کاراکتر تشکیل شده، برای همین هم حفظ کردن و یاد گرفتنش خیلی ساده‌تره.",
            "محتواش ترکیبی از آموزش زبان و فرهنگه و درباره موضوعاتی مثل یادگیری، اخلاق، تاریخ، خانواده و رفتار درست صحبت می‌کنه. تو این برنامه هر بخش از متن به‌صورت شمرده خونده میشه و بعد با توضیح ساده معنیش گفته میشه تا کاملاً قابل فهم باشه."
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به متون آموزشی و فرهنگ سنتی چین",
            "زبان‌آموزی که می‌خواهد واژگان و کاراکترها را در متن دنبال کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
    {
        slug: "rabbit-dizigui",
        title: "兔小贝国学",
        cardTitle: "兔小贝",
        subtitle: "《弟子规》",
        cardSubtitle: "《弟子规》",
        coverPath: `${assetRoot}/兔小贝Beckybunny.jpeg`,
        detailCoverPath: `${assetRoot}/弟子规.jpeg`,
        detailImageAspect: "video",
        lessonCount: 34,
        fallbackLessonTitle: "درس",
        description: [
            "این مجموعه روی آموزش یکی از متون مهم تربیتی چین به اسم «آیین رفتار شاگردان» (弟子规) کار می‌کنه. این کتاب یه متن کلاسیک برای آموزش آداب، رفتار درست، احترام به والدین و اخلاق اجتماعیه و از قدیم برای تربیت بچه‌ها استفاده می‌شده.",
            "در این برنامه هر بخش از متن به‌صورت ساده خونده میشه و بعد با زبان قابل‌فهم توضیح داده میشه تا معنی رفتارها و نکات اخلاقی کاملاً روشن بشه. فضای کار کودکانه و صمیمیه و کمک می‌کنه بدون پیچیدگی با مفاهیم اخلاقی سنتی چین آشنا بشی."
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به اخلاق و آموزه‌های کنفوسیوسی",
            "زبان‌آموزی که متن کلاسیک ساده را با تصویر بهتر دنبال می‌کند",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
    {
        slug: "rabbit-qianziwen",
        title: "兔小贝国学",
        cardTitle: "兔小贝",
        subtitle: "《千字文》",
        cardSubtitle: "《千字文》",
        coverPath: `${assetRoot}/兔小贝Beckybunny.jpeg`,
        detailCoverPath: `${assetRoot}/千字文.jpeg`,
        detailImageAspect: "video",
        lessonCount: 31,
        fallbackLessonTitle: "درس",
        description: [
            "این مجموعه روی آموزش یکی از مهم‌ترین متون آموزشی چین باستان، یعنی «متن هزار کاراکتری» (千字文) کار می‌کنه. این کتاب یه متن کلاسیکه که از ۱۰۰۰ کاراکتر بدون تکرار تشکیل شده و از قدیم برای آموزش خواندن و یاد گرفتن کاراکترهای چینی استفاده می‌شده. نکته جالبش اینه که جمله‌هاش به‌صورت آهنگین و منظم نوشته شدن و درباره موضوعاتی مثل طبیعت، انسان و زمین، اخلاق، زندگی و فرهنگ صحبت می‌کنه، برای همین هم آموزشیه هم فرهنگی.",
            "توی این دوره، اول هر بخش از متن به‌صورت درست و شمرده خوانده میشه، بعد همون قسمت با زبان ساده توضیح داده میشه تا معنی کاملاً قابل فهم بشه. این روش کمک می‌کنه هم با تلفظ درست آشنا بشی، هم کم‌کم مفهوم متن‌های کلاسیک برات روشن بشه بدون اینکه سنگین یا پیچیده به نظر برسه.",
            "فضای کار ساده و قابل دنبال کردنه و بیشتر روی روخوانی، درک معنی و آشنایی با کاراکترها تمرکز داره."
        ],
        audience: [
            "متوسط",
            "علاقه‌مند به متن‌های پایهٔ آموزش سنتی چین",
            "زبان‌آموزی که بر خواندن دقیق و گسترش واژگان تمرکز دارد",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
    {
        slug: "xue-guoxue-baijiaxing-recitation",
        title: "学国学网",
        subtitle: "【经典诵读·百家姓】",
        cardSubtitle: "【经典诵读·百家姓】",
        coverPath: `${assetRoot}/学国学网.jpeg`,
        detailCoverPath: `${assetRoot}/经典诵读·百家姓.jpeg`,
        detailImageAspect: "video",
        lessonCount: 5,
        fallbackLessonTitle: "درس",
        description: [
            "این برنامه روی روخوانی و حفظ متن کلاسیک «صد نام خانوادگی» (百家姓) تمرکز داره. ویدیوها بیشتر حالت قرائت دارن و کمک می‌کنن کاراکترها و تلفظشون رو با ریتم درست یاد بگیری.",
            "سبک کار ساده و تکراریه، برای همین خیلی خوبه برای تقویت تلفظ، لحن و آشنایی با کاراکترهای پایه. در کنارش با یکی از متون قدیمی و معروف فرهنگ چینی هم آشنا می‌شی."
        ],
        audience: [
            "مبتدی",
            "زبان‌آموز علاقه‌مند به روخوانی و تلفظ معیار",
            "کسی که می‌خواهد با نام‌های خانوادگی رایج چین آشنا شود",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
    {
        slug: "national-library-baijiaxing",
        title: "中国国家图书馆",
        subtitle: "《百家姓》",
        cardSubtitle: "《百家姓》",
        coverPath: `${assetRoot}/中国国家图书馆.jpeg`,
        detailCoverPath: `${assetRoot}/百家姓.jpeg`,
        detailImageAspect: "video",
        lessonCount: 48,
        fallbackLessonTitle: "درس",
        description: [
            "این مجموعه میره سراغ کتاب معروف «صد نام خانوادگی» (《百家姓》) که یکی از متون کلاسیک چینیه و در واقع مجموعه‌ای از نام‌های خانوادگی رایج در چینه. این متن قدیمی از قدیم برای آموزش خواندن و آشنایی با کاراکترها استفاده می‌شده و هنوز هم یه مرجع جالب برای شناخت فرهنگ اسامی در چینه.",
            "توی این مجموعه، نام‌ها فقط خوانده نمی‌شن؛ معمولاً درباره تلفظ، نوشتار و گاهی ریشه یا کاربردشون هم توضیح داده میشه. برای همین علاوه بر یادگیری زبان، با یه بخش مهم از فرهنگ چینی هم آشنا می‌شی."
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به نام‌ها و تاریخ خانواده‌ها در چین",
            "زبان‌آموزی که می‌خواهد تلفظ و پیشینهٔ نام‌های چینی را یاد بگیرد",
        ],
        knownLessonSubtitles: {},
        introductionHeading: "معرفی برنامه:",
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
    {
        slug: "baijia-talk-tao-te-ching-analysis",
        title: "百家Talk",
        subtitle: "《道德经》讲析",
        cardSubtitle: "《道德经》讲析",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        detailCoverPath: `${assetRoot}/道德经.jpeg`,
        detailImageAspect: "square",
        lessonCount: 11,
        chapterCount: 11,
        countSummary: "۱۱ درس · ۵۲ بخش",
        fallbackLessonTitle: "درس",
        introductionHeading: "معرفی دوره:",
        description: [
            "این دوره میره سراغ کتاب معروف «دائودِجینگ»، یکی از پایه‌های اصلی فلسفه چین که به لائوتسه نسبت داده میشه. متن این کتاب خیلی کوتاه ولی عمیق و گاهی مبهمه، برای همین این مجموعه میاد هر بخش رو قدم‌به‌قدم باز می‌کنه و معنی‌هاش رو قابل‌فهم توضیح می‌ده.",
            "توی درس‌ها فقط ترجمه ساده نمی‌شنوی؛ درباره مفاهیم مهمی مثل «راه یا دائو»، «عمل بدون اجبار (wúwéi)»، تعادل و ساده‌زیستی هم صحبت میشه و نشون میده این ایده‌ها چطور تو زندگی واقعی یا طرز فکر چینی‌ها کاربرد دارن. همین باعث میشه هم با زبان آشنا بشی، هم یه نگاه عمیق‌تر به فرهنگ و فلسفه چینی پیدا کنی.",
            "فضای دوره بیشتر تحلیلی و فکریه و مناسب کساییه که دوست دارن از سطح مکالمه روزمره یه قدم فراتر برن و وارد دنیای متون و مفاهیم عمیق‌تر بشن."
        ],
        audience: [
            "متوسط به بالا",
            "علاقه‌مند به فلسفه و فرهنگ کلاسیک چین",
            "زبان‌آموزی که می‌خواهد متن و مفاهیم عمیق‌تر را دنبال کند",
        ],
        knownLessonSubtitles: {},
        tagline: "فرهنگ و اندیشه چین | ؟ دقیقه",
    },
].map((course) => {
    const lessons = CULTURE_TEXT_LESSONS[course.slug];
    return {
        ...course,
        detailImageAspect: course.detailImageAspect as "square" | "video",
        lessonCount: lessons.length,
        knownLessonTitles: Object.fromEntries(lessons.map((lesson, index) => [index + 1, lesson.title])),
        knownLessonSubtitles: Object.fromEntries(lessons.map((lesson, index) => [index + 1, lesson.topic])),
    };
});

export const getCultureTextsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CULTURE_TEXTS_CATALOG, slug);
