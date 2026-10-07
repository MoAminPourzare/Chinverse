import { PODCAST_EPISODE_TITLES } from "@/lib/podcastEpisodeTitles";

export interface PodcastLevelGroup {
    slug: string;
    title: string;
    episodeCount: number;
}

export type PodcastCatalogItem = {
    slug: string;
    title: string;
    titleLines?: string[];
    subtitle: string;
    coverPath: string;
    tagline: string;
    description: string[];
    audience: string[];
} & ({ episodeTitles: string[]; groups?: never } | { groups: PodcastLevelGroup[]; episodeTitles?: never });

const cover = (filename: string) => `/assets/chinverse/course-profiles/${encodeURIComponent(filename)}`;

export const PODCAST_CATALOG: PodcastCatalogItem[] = [
    {
        slug: "chinese-daily",
        title: "Chinese Daily Podcast",
        subtitle: "（简单生活，简单汉语）",
        coverPath: cover("Chinese Daily Podcast.jpeg"),
        groups: [
            { slug: "beginner", title: "初级 (HSK 1–3)", episodeCount: 34 },
            { slug: "intermediate", title: "中级 (HSK 3–4)", episodeCount: 14 },
            { slug: "advanced", title: "高级 (HSK 5–6)", episodeCount: 5 },
        ],
        description: [
            "این پادکست با تمرکز روی موضوعات ساده و روزمره کمک می‌کنه زبان چینی رو در قالب زندگی واقعی یاد بگیری؛ از چیزهایی مثل عادت‌های روزانه، خرید، سفر، غذا و موقعیت‌های معمولی. سبک بیانش روون و طوری طراحی شده که بدون فشار، کم‌کم گوشت به زبان عادت کنه.",
            "نکته مهم اینه که این مجموعه برای سطح‌های مختلف از مبتدی تا پیشرفته محتوا داره، برای همین می‌تونی از همون اول شروع کنی و قدم‌به‌قدم همراهش بری."
        ],
        audience: [
            "مبتدی تا پیشرفته",
            "کسایی که می‌خوان شنیدارشون رو با موضوعات روزمره تقویت کنن",
            "علاقه‌مندان به یادگیری از طریق پادکست و گوش دادن"
        ],
        tagline: "سرگرمی و رسانه | ؟ دقیقه",
    },
    {
        slug: "practical-mandarin",
        title: "Practical Mandarin Podcast",
        titleLines: ["Practical Mandarin", "Podcast"],
        subtitle: "(地道中文表达)",
        coverPath: cover("地道中文表达.jpeg"),
        episodeTitles: PODCAST_EPISODE_TITLES["practical-mandarin"],
        description: [
            "این پادکست روی یاد دادن عبارت‌ها و جمله‌های کاملاً طبیعی و بومی تمرکز داره؛ همون چیزایی که چینی‌ها واقعاً توی مکالمه روزمره استفاده می‌کنن، نه صرفاً فرم کتابی.",
            "توی هر قسمت با یه سری اصطلاح، ترکیب و جمله کاربردی آشنا می‌شی و یاد می‌گیری چطور حرف بزنی که طبیعی‌تر و شبیه نیتیوها به نظر برسی. برای همین خیلی مناسبه برای کسایی که حس می‌کنن جمله‌هاشون درسته، ولی هنوز «چینی‌طور» نیست."
        ],
        audience: [
            "بالاتر از متوسط",
            "کسایی که می‌خوان مکالمه‌شون طبیعی‌تر بشه",
            "علاقه‌مندان به اصطلاحات و بیان‌های واقعی زبان"
        ],
        tagline: "سرگرمی و رسانه | ؟ دقیقه",
    },
    {
        slug: "chinese-podcast-zone",
        title: "Chinese Podcast Zone",
        subtitle: "(情景中文)",
        coverPath: cover("Chinese Podcast Zone.jpeg"),
        episodeTitles: PODCAST_EPISODE_TITLES["chinese-podcast-zone"],
        description: [
            "این پادکست روی آموزش چینی در قالب موقعیت‌های واقعی تمرکز داره؛ یعنی به‌جای آموزش خشک، مکالمه‌ها رو تو سناریوهایی مثل رستوران، خرید، سفر یا محل کار می‌شنوی و یاد می‌گیری هر جمله دقیقاً کِی و کجا استفاده میشه.",
            "سبک آموزشیش کاربردیه و کمک می‌کنه سریع‌تر وارد فضای مکالمه واقعی بشی و جمله‌ها رو به‌صورت طبیعی یاد بگیری، نه صرفاً حفظ کنی."
        ],
        audience: [
            "متوسط رو به بالا",
            "کسایی که می‌خوان مکالمه کاربردی یاد بگیرن",
            "افرادی که دنبال یادگیری در موقعیت‌های واقعی هستن"
        ],
        tagline: "سرگرمی و رسانه | ؟ دقیقه",
    },
    {
        slug: "da-peng",
        title: "大鹏说中文",
        subtitle: "(# Chinese Talk)",
        coverPath: cover("大鹏说中文.jpeg"),
        episodeTitles: PODCAST_EPISODE_TITLES["da-peng"],
        description: [
            "این برنامه یه سری گفت‌وگوهای واقعی و خودمانیه که مجری معمولاً میره سراغ دانشجویان زبان چینی از کشورهای مختلف و باهاشون صحبت می‌کنه و سؤال می‌پرسه. موضوع سؤال‌ها متنوعه؛ از تجربه یادگیری چینی گرفته تا زندگی، فرهنگ و نظرشون درباره چین.",
            "نکته جالبش اینه که فقط یه نوع چینی نمی‌شنوی؛ بلکه با مدل‌های مختلف صحبت کردن زبان‌آموزها آشنا می‌شی و می‌بینی هرکسی چطور خودش رو بیان می‌کنه. همین باعث میشه هم گوشت قوی‌تر بشه، هم اعتمادبه‌نفست برای حرف زدن."
        ],
        audience: [
            "مبتدی رو به بالا",
            "کسایی که می‌خوان مکالمه واقعی و متنوع بشنون",
            "علاقه‌مندان به گفت‌وگوهای بین‌فرهنگی"
        ],
        tagline: "سرگرمی و رسانه | ؟ دقیقه",
    },
    {
        slug: "bumingbai",
        title: "不明白播客",
        subtitle: "(列表)",
        coverPath: cover("不明白播客.jpeg"),
        episodeTitles: PODCAST_EPISODE_TITLES.bumingbai,
        description: [
            "این پادکست یه فضای گفت‌وگومحور و تحلیلی داره که توش مجری‌ها درباره موضوعات مختلف—از مسائل اجتماعی و فرهنگی گرفته تا تجربه‌های شخصی—با هم صحبت می‌کنن. سبک کار بیشتر شبیه یه گفت‌وگوی آزاد و عمیقه تا آموزش مستقیم زبان.",
            "محتواش برای زبان‌آموزها خیلی مفیده چون با چینی واقعی، طبیعی و بدون فیلتر کلاس روبه‌رو می‌شی و یاد می‌گیری آدم‌ها واقعاً چطور نظر می‌دن و بحث می‌کنن. مکالمات به زبان ماندارین استاندارد و طبیعی و نسبتاً سریع (حالت مکالمه واقعی) هستن."
        ],
        audience: [
            "پیشرفته",
            "کسایی که می‌خوان شنیدارشون رو در سطح واقعی تقویت کنن",
            "علاقه‌مندان به بحث‌های فکری و اجتماعی"
        ],
        tagline: "سرگرمی و رسانه | ؟ دقیقه",
    },
];

export const getPodcast = (slug: string | undefined): PodcastCatalogItem | undefined =>
    PODCAST_CATALOG.find((podcast) => podcast.slug === slug);

export const getPodcastEpisodeCount = (podcast: PodcastCatalogItem): number =>
    podcast.groups ? podcast.groups.reduce((count, group) => count + group.episodeCount, 0) : podcast.episodeTitles.length;
