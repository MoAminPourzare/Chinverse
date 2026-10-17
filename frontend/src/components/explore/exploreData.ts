export type ExploreTone = "sky" | "violet" | "green" | "amber";

export interface ExploreItem {
    title: string;
    id: string;
    href: string;
    description: string;
    imagePath: string;
    tone: ExploreTone;
    wide?: boolean;
    comingSoon?: boolean;
}

export interface ExploreSection {
    title: string;
    subtitle: string;
    description: string;
    id: string;
    tone: ExploreTone;
    iconPath: string;
    heroPath: string;
    heroWidth: number;
    heroHeight: number;
    heroAlt: string;
    items: ExploreItem[];
}

const artwork = (id: string) => `/assets/chinverse/explore/v4/${id}.webp`;

function createExploreItem(item: Omit<ExploreItem, "href" | "imagePath">): ExploreItem {
    return { ...item, href: `/explore/${item.id}`, imagePath: artwork(item.id) };
}

export const learningItems: ExploreItem[] = [
    createExploreItem({ title: "HSK", id: "hsk", description: "آمادگی آزمون در همهٔ سطوح", tone: "sky" }),
    createExploreItem({ title: "اصطلاحات و ضرب‌المثل‌ها", id: "idioms", description: "عبارت‌های پرکاربرد و نکات فرهنگی", tone: "sky" }),
    createExploreItem({ title: "تلفظ", id: "pronunciation", description: "شنیدن و درست صحبت کردن", tone: "sky" }),
    createExploreItem({ title: "کاراکتر", id: "characters", description: "نوشتن و خواندن کاراکترهای چینی", tone: "sky" }),
    createExploreItem({ title: "گرامر", id: "grammar", description: "ساختار و جمله‌سازی کاربردی", tone: "sky" }),
    createExploreItem({ title: "چینی کاربردی", id: "practical", description: "مکالمه در موقعیت‌های روزمره", tone: "sky" }),
    createExploreItem({ title: "واژگان هم‌معنی", id: "synonyms", description: "کشف واژه‌ها و گسترش دایرهٔ لغات", tone: "sky" }),
    createExploreItem({ title: "زبان چینی کلاسیک", id: "classical", description: "آشنایی با زبان و متون کهن چین", tone: "sky" }),
    createExploreItem({ title: "یادگیری با ولاگ", id: "vlogs", description: "یادگیری با ویدیوها و تجربه‌های واقعی زندگی در چین", tone: "sky", wide: true }),
];

export const entertainmentItems: ExploreItem[] = [
    createExploreItem({ title: "پادکست", id: "podcasts", description: "گوش دادن به گفت‌وگوهای چینی", tone: "violet" }),
    createExploreItem({ title: "گفتارهای موضوعی", id: "topic-talks", description: "موضوع‌های متنوع برای شنیدن و یادگیری", tone: "violet" }),
    createExploreItem({ title: "فیلم", id: "movies", description: "یادگیری با فیلم‌های جذاب چینی", tone: "violet" }),
    createExploreItem({ title: "سریال", id: "series", description: "تماشای داستان‌های دنیای سریال چینی", tone: "violet" }),
    createExploreItem({ title: "کارتون و انیمیشن", id: "cartoons", description: "دنیای رنگارنگ انیمیشن چینی", tone: "violet" }),
    createExploreItem({ title: "موسیقی", id: "music", description: "آهنگ‌ها و ترانه‌های چینی", tone: "violet" }),
];

export const artSkillItems: ExploreItem[] = [
    createExploreItem({ title: "آشپزی", id: "cooking", description: "طعم‌ها و هنر آشپزی سنتی چین", tone: "green" }),
    createExploreItem({ title: "هنرهای رزمی", id: "martial-arts", description: "حرکت، تمرکز و سنت‌های رزمی چین", tone: "green" }),
    createExploreItem({ title: "تمرینات انرژی و سلامت", id: "energy-health", description: "تنفس، آرامش و هماهنگی بدن", tone: "green" }),
    createExploreItem({ title: "خطاطی", id: "calligraphy", description: "هنر نوشتن و زیبایی حروف چینی", tone: "green" }),
];

export const cultureThoughtItems: ExploreItem[] = [
    createExploreItem({ title: "آیین‌ها و جشن‌ها", id: "festivals-customs", description: "جشن‌های سنتی و آیین‌های چینی", tone: "amber" }),
    createExploreItem({ title: "چین، فراتر از زبان", id: "china-beyond-language", description: "زندگی مردم و جلوه‌های فرهنگ چین", tone: "amber", comingSoon: true }),
    createExploreItem({ title: "داستان‌های کهن", id: "historical-stories", description: "روایت‌های ماندگار از گذشتهٔ چین", tone: "amber" }),
    createExploreItem({ title: "شعر و ادبیات کلاسیک", id: "classical-poetry", description: "شعرها و اندیشه‌های ادبی کهن", tone: "amber" }),
    createExploreItem({ title: "متون کلاسیک آموزشی", id: "culture-texts", description: "متون ماندگار و آموزه‌های فلسفی", tone: "amber" }),
    createExploreItem({ title: "فرهنگ چای", id: "tea-culture", description: "آداب، تاریخ و هنر دم‌آوری چای", tone: "amber" }),
];

export const exploreSections: ExploreSection[] = [
    {
        title: "یادگیری زبان چینی", id: "learning", tone: "sky",
        description: "از پایه تا تسلط، به شیوهٔ خودت یاد بگیر",
        subtitle: "از پایه تا تسلط، با مسیرهای متنوع و جذاب",
        iconPath: artwork("learning-icon"), heroPath: artwork("learning-hero"), heroWidth: 1200, heroHeight: 400,
        heroAlt: "زبان چینی، دنیایی از فرصت‌ها؛ با محتوای متنوع و تعاملی یاد بگیر.", items: learningItems,
    },
    {
        title: "سرگرمی چینی", id: "entertainment", tone: "violet",
        description: "با فیلم، موسیقی و قصه‌ها همراه شو",
        subtitle: "با صدا، تصویر و قصه، چین را جذاب‌تر کشف کن",
        iconPath: artwork("entertainment-icon"), heroPath: artwork("entertainment-hero"), heroWidth: 1200, heroHeight: 480,
        heroAlt: "سرگرمی چینی، دنیایی از محتوا؛ با محتوای شنیداری و دیداری، یادگیری را لذت‌بخش کن.", items: entertainmentItems,
    },
    {
        title: "هنر و مهارت‌های چینی", id: "arts", tone: "green",
        description: "از آشپزی و خطاطی تا هنرهای رزمی",
        subtitle: "ذوق، تمرکز و مهارت را به زندگی روزمره بیاور",
        iconPath: artwork("arts-icon"), heroPath: artwork("arts-hero"), heroWidth: 1200, heroHeight: 480,
        heroAlt: "هنر و مهارت‌های چینی، دنیایی از ذوق و مهارت؛ با آشپزی، خطاطی، تمرین‌های سلامت و هنرهای سنتی آشنا شو.", items: artSkillItems,
    },
    {
        title: "فرهنگ و اندیشه چینی", id: "culture", tone: "amber",
        description: "سفری به تاریخ، آیین‌ها و اندیشه‌های چین",
        subtitle: "سفری به عمق تاریخ، فرهنگ و اندیشه‌های چین",
        iconPath: artwork("culture-icon"), heroPath: artwork("culture-hero"), heroWidth: 1200, heroHeight: 400,
        heroAlt: "فرهنگ چین، هزاران سال، یک داستان؛ با آیین‌ها، اندیشه‌ها و زیبایی‌های جاودانهٔ آن آشنا شو.", items: cultureThoughtItems,
    },
];

export function getExploreSection(id: string) {
    return exploreSections.find(section => section.id === id);
}
