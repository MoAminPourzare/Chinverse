export type HskPart = "上" | "下";

export interface HskCatalogCourse {
    slug: string;
    title: string;
    coverPath: string;
    lessonCount: number;
    lessonStart: number;
    lessonPart?: HskPart;
    order: number;
    levelLabel: string;
    description: string;
    audience: string[];
}

const beginnerDescription =
    "این دوره بر اساس مجموعهٔ Standard Course و ساختار کلاسیک آزمون HSK آماده شده است. در این سطح با واژه‌ها و الگوهای پایه، معرفی خود، عددها، زمان، خانواده و جمله‌های سادهٔ روزمره آشنا می‌شوی. هدف این است که مهارت شنیدن و خواندن از یک پایهٔ منظم شکل بگیرد و برای رفتن به سطح بعد آماده شوی.";

const elementaryDescription =
    "در این سطح جمله‌ها طولانی‌تر می‌شوند و واژه‌های بیشتری از زندگی روزمره، خرید، رفت‌وآمد، برنامه‌ریزی و گفت‌وگوهای معمول را تمرین می‌کنی. درس‌ها بر فهم شنیداری، ساخت جمله و استفادهٔ درست از واژه‌ها در موقعیت واقعی تمرکز دارند.";

const intermediateDescription =
    "این دوره موضوع‌ها و ساختارهای گسترده‌تری را پوشش می‌دهد و توضیح‌های دقیق‌تر، جمله‌های طولانی‌تر و تمرین‌های شنیداری جدی‌تری دارد. در پایان دوره باید بتوانی متن‌ها و مکالمه‌های سطح متوسط را بهتر بفهمی و منظور خودت را روشن‌تر بیان کنی.";

const advancedDescription =
    "بالاترین سطح دورهٔ Standard Course محسوب می‌شود و برای زبان‌آموزی طراحی شده که می‌خواهد متن‌ها، گفت‌وگوها و موضوع‌های پیچیده‌تر را با دقت بیشتری دنبال کند. تمرکز دوره بر دامنهٔ واژگان، درک مطلب و کاربرد طبیعی‌تر زبان است.";

export const HSK_CATALOG: HskCatalogCourse[] = [
    {
        slug: "hsk-1",
        title: "HSK 1",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-1-boek.jpg",
        lessonCount: 15,
        lessonStart: 1,
        order: 1,
        levelLabel: "کاملاً مبتدی",
        description: beginnerDescription,
        audience: [
            "زبان‌آموز کاملاً مبتدی",
            "کسی که هیچ پیش‌زمینه‌ای از زبان چینی ندارد",
            "کسی که می‌خواهد یادگیری را اصولی و بر اساس یک مسیر مشخص شروع کند",
        ],
    },
    {
        slug: "hsk-2",
        title: "HSK 2",
        coverPath: "/assets/chinverse/course-profiles/HSK/MicrosoftTeams-image-16.png",
        lessonCount: 15,
        lessonStart: 1,
        order: 2,
        levelLabel: "مبتدی رو به متوسط",
        description: elementaryDescription,
        audience: [
            "زبان‌آموزی که HSK 1 را گذرانده است",
            "کسی که می‌خواهد مکالمهٔ روزمره و کاربردی را تقویت کند",
            "زبان‌آموزی که برای رفتن به سطح متوسط آماده می‌شود",
        ],
    },
    {
        slug: "hsk-3",
        title: "HSK 3",
        coverPath: "/assets/chinverse/course-profiles/HSK/81sR2V8UC9L._AC_UF1000,1000_QL80_.jpg",
        lessonCount: 20,
        lessonStart: 1,
        order: 3,
        levelLabel: "پیش‌متوسط",
        description: elementaryDescription,
        audience: [
            "زبان‌آموز سطح پیش‌متوسط",
            "کسی که می‌خواهد دایرهٔ واژگانش را گسترده‌تر کند",
            "فردی که می‌خواهد در موقعیت‌های واقعی روان‌تر ارتباط برقرار کند",
        ],
    },
    {
        slug: "hsk-4-shang",
        title: "HSK 4上",
        coverPath: "/assets/chinverse/course-profiles/HSK/MicrosoftTeams-image-11-e1699895486612.jpg",
        lessonCount: 10,
        lessonStart: 1,
        lessonPart: "上",
        order: 4,
        levelLabel: "متوسط",
        description: intermediateDescription,
        audience: [
            "زبان‌آموزی که می‌خواهد مکالمهٔ مستقل‌تری داشته باشد",
            "داوطلب سطح چهار آزمون HSK",
            "کسی که آمادهٔ متن‌ها و گفت‌وگوهای طولانی‌تر است",
        ],
    },
    {
        slug: "hsk-4-xia",
        title: "HSK 4下",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-4下-boek-2.0.jpg",
        lessonCount: 10,
        lessonStart: 11,
        lessonPart: "下",
        order: 5,
        levelLabel: "متوسط",
        description: intermediateDescription,
        audience: [
            "زبان‌آموزی که نیمهٔ نخست HSK 4 را تمام کرده است",
            "کسی که به تمرین جدی‌تر شنیدن و خواندن نیاز دارد",
            "داوطلب سطح چهار آزمون HSK",
        ],
    },
    {
        slug: "hsk-5-shang",
        title: "HSK 5上",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-5上-boek.jpg",
        lessonCount: 18,
        lessonStart: 1,
        lessonPart: "上",
        order: 6,
        levelLabel: "متوسط رو به پیشرفته",
        description: intermediateDescription,
        audience: [
            "زبان‌آموزی که می‌خواهد متن‌های جدی‌تر را بخواند و بفهمد",
            "کسی که برای دانشگاه یا کار به زبان چینی نیاز دارد",
            "داوطلب سطح پنج آزمون HSK",
        ],
    },
    {
        slug: "hsk-5-xia",
        title: "HSK 5下",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-5下-boek.png",
        lessonCount: 18,
        lessonStart: 19,
        lessonPart: "下",
        order: 7,
        levelLabel: "متوسط رو به پیشرفته",
        description: intermediateDescription,
        audience: [
            "زبان‌آموزی که نیمهٔ نخست HSK 5 را تمام کرده است",
            "کسی که می‌خواهد نوشته‌ها و گفت‌وگوهای متنوع‌تری را دنبال کند",
            "داوطلب سطح پنج آزمون HSK",
        ],
    },
    {
        slug: "hsk-6-shang",
        title: "HSK 6上",
        coverPath: "/assets/chinverse/course-profiles/HSK/HSK-6上-boek.png",
        lessonCount: 20,
        lessonStart: 1,
        lessonPart: "上",
        order: 8,
        levelLabel: "پیشرفته",
        description: advancedDescription,
        audience: [
            "زبان‌آموز جدی و حرفه‌ای",
            "دانشجو یا متخصصی که با زبان چینی کار می‌کند",
            "کسی که می‌خواهد درک مطلب و دامنهٔ واژگان پیشرفته‌تری داشته باشد",
        ],
    },
    {
        slug: "hsk-6-xia",
        title: "HSK 6下",
        coverPath: "/assets/chinverse/course-profiles/HSK/2dd81a34-40b2-40a1-a28d-cf7c7c9f64ad.png",
        lessonCount: 20,
        lessonStart: 21,
        lessonPart: "下",
        order: 9,
        levelLabel: "پیشرفته",
        description: advancedDescription,
        audience: [
            "زبان‌آموزی که نیمهٔ نخست HSK 6 را تمام کرده است",
            "کسی که برای استفادهٔ دانشگاهی یا حرفه‌ای از زبان آماده می‌شود",
            "داوطلب سطح شش آزمون HSK",
        ],
    },
];

export const getHskCourse = (slug: string | undefined): HskCatalogCourse | undefined =>
    HSK_CATALOG.find((course) => course.slug === slug);

export const getHskLessonNumber = (course: HskCatalogCourse, lessonIndex: number): number =>
    course.lessonStart + lessonIndex;

export const getHskLessonTitle = (course: HskCatalogCourse, lessonIndex: number): string => {
    const lessonNumber = getHskLessonNumber(course, lessonIndex);
    const part = course.lessonPart ? `（${course.lessonPart}）` : "";
    return `第${lessonNumber}课${part}`;
};
