import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

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
        fallbackLessonTitle: "درس",
        description: [
            "این مجموعهٔ ۶۲ قسمتی یکی از معروف‌ترین متون کلاسیک آموزشی چین، یعنی «کلاسیک سه‌حرفی» یا 三字经 را معرفی می‌کند. متن کتاب از قدیم برای آموزش کودکان به کار می‌رفته و جمله‌های کوتاه و آهنگین آن، خواندن و به‌خاطر سپردن را آسان‌تر می‌کنند.",
            "در هر درس بخشی از متن با شماره و تلفظ درست خوانده می‌شود و سپس معنی آن با زبانی ساده توضیح داده می‌شود. فضای تصویری و کودکانه، مفاهیم تاریخی، خانوادگی و رفتاری متن را روشن و یادگیری واژه‌ها و کاراکترها را دلنشین‌تر می‌کند.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به متون آموزشی و فرهنگ سنتی چین",
            "زبان‌آموزی که می‌خواهد واژگان و کاراکترها را در متن دنبال کند",
        ],
        knownLessonSubtitles: {},
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
            "این مجموعهٔ ۳۴ قسمتی یکی از متون مهم تربیتی چین به نام 弟子规 را آموزش می‌دهد. متن بر پایهٔ آموزه‌های کنفوسیوسی دربارهٔ آداب، رفتار درست، احترام به والدین و بزرگ‌ترها و مسئولیت‌های خانوادگی و اجتماعی شکل گرفته است.",
            "در هر برنامه بخشی از متن ساده و شمرده خوانده می‌شود و بعد با زبان قابل‌فهم توضیح داده می‌شود. نکته‌های اخلاقی روشن و فضای کودکانه کمک می‌کنند مفهوم رفتارها بدون پیچیدگی دنبال شود.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به اخلاق و آموزه‌های کنفوسیوسی",
            "زبان‌آموزی که متن کلاسیک ساده را با تصویر بهتر دنبال می‌کند",
        ],
        knownLessonSubtitles: {},
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
            "این مجموعهٔ ۳۱ قسمتی یکی از مهم‌ترین متون آموزشی چین باستان، یعنی 千字文 یا «کلاسیک هزار نویسه» را آموزش می‌دهد. متن از هزار کاراکتر غیرتکراری ساخته شده و در گذشته برای آموزش خواندن و حفظ‌کردن نویسه‌های چینی استفاده می‌شده است.",
            "هر درس بخشی از متن را درست و شمرده می‌خواند و سپس معنای آن را ساده توضیح می‌دهد. زبان کهن متن می‌تواند دشوار باشد، اما روایت روشن و تصویرها به درک معنی، گسترش واژگان و آشنایی با کاراکترها کمک می‌کنند.",
        ],
        audience: [
            "متوسط",
            "علاقه‌مند به متن‌های پایهٔ آموزش سنتی چین",
            "زبان‌آموزی که بر خواندن دقیق و گسترش واژگان تمرکز دارد",
        ],
        knownLessonSubtitles: {},
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
            "این برنامه بر روخوانی و حفظ متن کلاسیک «صد نام خانوادگی» یا 百家姓 تمرکز دارد. ویدیوها نام‌های رایج خانوادگی را با تلفظ و ریتم درست آموزش می‌دهند تا دنبال‌کردن و به‌خاطر سپردن آن‌ها آسان‌تر شود.",
            "ساختار ساده و تکرارشونده برای تقویت تلفظ، درک شنیداری و آشنایی با کاراکترهای پایه مناسب است و هم‌زمان بخشی از فرهنگ نام‌های خانوادگی در چین را معرفی می‌کند.",
        ],
        audience: [
            "مبتدی",
            "زبان‌آموز علاقه‌مند به روخوانی و تلفظ معیار",
            "کسی که می‌خواهد با نام‌های خانوادگی رایج چین آشنا شود",
        ],
        knownLessonSubtitles: {},
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
            "این مجموعه از کتاب معروف «صد نام خانوادگی» یا 百家姓 الهام گرفته است؛ متنی کلاسیک که نام‌های خانوادگی رایج چین را گردآوری می‌کند و هنوز مرجعی جذاب برای شناخت فرهنگ اسامی چینی است.",
            "در هر بخش نام‌ها روشن خوانده می‌شوند و دربارهٔ تلفظ، ریشه، کاربرد و گاهی پیشینهٔ آن‌ها توضیح داده می‌شود. این ترکیب، یادگیری زبان را به شناخت تاریخ و فرهنگ نام‌های چینی پیوند می‌دهد.",
        ],
        audience: [
            "مبتدی تا متوسط",
            "علاقه‌مند به نام‌ها و تاریخ خانواده‌ها در چین",
            "زبان‌آموزی که می‌خواهد تلفظ و پیشینهٔ نام‌های چینی را یاد بگیرد",
        ],
        knownLessonSubtitles: {},
    },
    {
        slug: "baijia-talk-tao-te-ching-analysis",
        title: "百家Talk",
        subtitle: "《道德经》讲析",
        cardSubtitle: "《道德经》讲析",
        coverPath: `${assetRoot}/百家Talk.jpg`,
        detailCoverPath: `${assetRoot}/道德经.jpeg`,
        detailImageAspect: "video",
        lessonCount: 11,
        fallbackLessonTitle: "درس",
        introductionHeading: "معرفی دوره:",
        description: [
            "این دوره سراغ کتاب مشهور «دائودِجینگ» می‌رود؛ یکی از پایه‌های اصلی فلسفهٔ چین که به لائوتسه نسبت داده می‌شود. متن کوتاه اما عمیق کتاب، مفاهیمی مانند راه یا دائو، بی‌کنشی یا 无为، تعادل، سادگی و زندگی هماهنگ را بررسی می‌کند.",
            "درس‌ها مفاهیم مهم را با ترجمه و توضیح ساده باز می‌کنند و نمونه‌های کاربردی می‌آورند. لحن رسمی و آرام دوره برای زبان‌آموزی مناسب است که می‌خواهد هم شنیدار خود را تقویت کند و هم با اندیشه و فرهنگ فلسفی چین آشنا شود.",
        ],
        audience: [
            "متوسط به بالا",
            "علاقه‌مند به فلسفه و فرهنگ کلاسیک چین",
            "زبان‌آموزی که می‌خواهد متن و مفاهیم عمیق‌تر را دنبال کند",
        ],
        knownLessonSubtitles: {},
    },
];

export const getCultureTextsCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(CULTURE_TEXTS_CATALOG, slug);
