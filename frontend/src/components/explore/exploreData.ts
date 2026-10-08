export interface ExploreItem {
    title: string;
    id: string;
    href: string;
    description: string;
    imagePath: string;
    tone: "sky" | "rose" | "violet" | "amber";
    scene?: boolean;
    imagePosition?: string;
}

export interface ExploreSection {
    title: string;
    subtitle: string;
    id: string;
    items: ExploreItem[];
}

function createExploreItem(item: Omit<ExploreItem, "href" | "imagePath">): ExploreItem {
    return {
        ...item,
        href: `/explore/${item.id}`,
        imagePath: `/assets/chinverse/explore/${item.id}.webp`,
    };
}

export const learningItems: ExploreItem[] = [
    createExploreItem({ title: "HSK", id: "hsk", description: "آمادگی آزمون", tone: "sky" }),
    createExploreItem({ title: "تلفظ", id: "pronunciation", description: "شنیدن و صحیح گفتن", tone: "rose" }),
    createExploreItem({ title: "کاراکتر", id: "characters", description: "نوشتن و خواندن", tone: "sky" }),
    createExploreItem({ title: "گرامر", id: "grammar", description: "ساختار و جمله‌سازی", tone: "violet" }),
    createExploreItem({ title: "اصطلاح", id: "idioms", description: "عبارت‌های رایج چینی", tone: "sky" }),
    createExploreItem({ title: "چینی کاربردی", id: "practical", description: "چینی در زندگی روزمره", tone: "sky" }),
    createExploreItem({ title: "یادگیری با ولاگ", id: "vlogs", description: "همراه با زندگی واقعی", tone: "sky" }),
    createExploreItem({ title: "واژگان هم‌معنی", id: "synonyms", description: "انتخاب دقیق‌تر واژه‌ها", tone: "violet" }),
    createExploreItem({ title: "زبان چینی کلاسیک", id: "classical", description: "آشنایی با زبان کهن چین", tone: "amber" }),
];

export const entertainmentItems: ExploreItem[] = [
    createExploreItem({ title: "سریال", id: "series", description: "تماشای سریال‌های چینی", tone: "rose", scene: true, imagePosition: "center 60%" }),
    createExploreItem({ title: "فیلم", id: "movies", description: "فیلم‌های جذاب چینی", tone: "amber", scene: true, imagePosition: "center 58%" }),
    createExploreItem({ title: "کارتون و انیمیشن", id: "cartoons", description: "دنیای انیمیشن چینی", tone: "sky", scene: true, imagePosition: "center 54%" }),
    createExploreItem({ title: "پادکست", id: "podcasts", description: "گوش دادن به گفت‌وگوهای چینی", tone: "sky" }),
    createExploreItem({ title: "موسیقی", id: "music", description: "یادگیری با ترانه‌های چینی", tone: "violet" }),
    createExploreItem({ title: "گفتارهای موضوعی", id: "topic-talks", description: "گفت‌وگو دربارهٔ موضوع‌های متنوع", tone: "sky" }),
];

export const artSkillItems: ExploreItem[] = [
    createExploreItem({ title: "آشپزی", id: "cooking", description: "طعم‌ها و هنر آشپزی چینی", tone: "amber" }),
    createExploreItem({ title: "هنرهای رزمی", id: "martial-arts", description: "حرکت، تعادل و تمرکز", tone: "rose" }),
    createExploreItem({ title: "تمرینات انرژی و سلامت", id: "energy-health", description: "تنفس، آرامش و هماهنگی بدن", tone: "sky" }),
    createExploreItem({ title: "خطاطی", id: "calligraphy", description: "هنر نوشتن با قلم‌مو", tone: "amber" }),
    createExploreItem({ title: "فرهنگ چای", id: "tea-culture", description: "آداب و دنیای چای چینی", tone: "sky" }),
];

export const cultureThoughtItems: ExploreItem[] = [
    createExploreItem({ title: "متون کلاسیک آموزشی", id: "culture-texts", description: "خواندن متون ماندگار چین", tone: "sky" }),
    createExploreItem({ title: "داستان‌های کهن", id: "historical-stories", description: "سفر به روایت‌های قدیمی چین", tone: "amber" }),
    createExploreItem({ title: "شعر و ادبیات کلاسیک", id: "classical-poetry", description: "شعرها و قصه‌های ماندگار", tone: "amber", scene: true }),
    createExploreItem({ title: "آیین‌ها و جشن‌ها", id: "festivals-customs", description: "رنگ و شادی سنت‌های چینی", tone: "amber" }),
];

export const exploreSections: ExploreSection[] = [
    {
        title: "یادگیری زبان چینی",
        subtitle: "مسیرهای اصلی برای درس، تمرین و ساخت عادت روزانه.",
        id: "learning",
        items: learningItems,
    },
    {
        title: "سرگرمی چینی",
        subtitle: "یادگیری با فیلم، سریال، صدا و محتوای دیدنی.",
        id: "entertainment",
        items: entertainmentItems,
    },
    {
        title: "هنر و مهارت‌های چینی",
        subtitle: "مهارت‌های فرهنگی و کاربردی برای تجربه عمیق‌تر.",
        id: "arts",
        items: artSkillItems,
    },
    {
        title: "فرهنگ و اندیشه چینی",
        subtitle: "متون، داستان‌ها و آیین‌های کلاسیک و فرهنگی.",
        id: "culture",
        items: cultureThoughtItems,
    },
];

export function getExploreSection(id: string) {
    return exploreSections.find((section) => section.id === id);
}
