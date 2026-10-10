import { getScreenMediaItem, type ScreenMediaCatalogItem } from "@/lib/screenMediaCatalog";

const assetRoot = "/assets/chinverse/course-profiles/سریال";
const resetEpisodeAssetRoot = "/assets/chinverse/course-profiles/开端";

export interface SeriesCatalogItem extends ScreenMediaCatalogItem {
    episodeCount: number;
}

/** Owner-reference series catalog. Playable episodes still come from the public API. */
export const SERIES_CATALOG: SeriesCatalogItem[] = [
    {
        slug: "hidden-love",
        title: "偷偷藏不住",
        pinyin: "Tōu tōu cáng bù zhù",
        posterPath: `${assetRoot}/v2-2663d60481b402789eaca506206a4cb6_r.jpg`,
        episodeCount: 25,
        year: 2023,
        country: "چین",
        synopsis: [
            "سریال \"عشق پنهان\" درباره دختریه که از سن کمی بی‌سروصدا به یکی از آشناهای خانوادگیش علاقه‌مند میشه؛ احساسی که سال‌ها در دلش پنهان می‌مونه.",
            "با گذر زمان و بزرگ‌تر شدنش، دوباره مسیر زندگیشون به هم می‌رسه و این بار شرایط فرق کرده. رابطه‌ای که قبلاً فقط یک احساس پنهان بود، کم‌کم شکل واقعی‌تری به خودش می‌گیره.",
            "سریال با فضای خیلی لطیف و شیرینش، روی عشق آروم، رشد شخصیت‌ها و حس‌وحال‌های ظریف تمرکز داره."
        ],
        genres: [
            "عاشقانه",
            "درام",
            "نوجوانانه"
        ],
        directors: [
            "لی چینگ‌رونگ (李青蓉 - Lǐ Qīngróng)"
        ],
        cast: [
            "ژائو لوسی (赵露思 - Zhào Lùsī)",
            "چن جه‌یوان (陈哲远 - Chén Zhéyuǎn)",
            "ما بوشیان (马伯骞 - Mǎ Bóqiān)"
        ],
    },
    {
        slug: "go-ahead",
        title: "以家人之名",
        pinyin: "Yǐ jiārén zhī míng",
        posterPath: `${assetRoot}/fSs8b6nqJ.jpeg`,
        episodeCount: 40,
        year: 2020,
        country: "چین",
        synopsis: [
            "سریال \"به نام خانواده\" درباره سه تا جوونه که با وجود اینکه هیچ نسبت خونی با هم ندارن، در کنار هم بزرگ می‌شن و کم‌کم تبدیل به یک خانواده واقعی می‌شن.",
            "هر کدوم از اون‌ها گذشته و زخم‌های خاص خودشون رو دارن، اما در کنار هم یاد می‌گیرن معنی واقعی خانواده فقط به خون نیست، بلکه به حمایت، درک و همراهیه.",
            "با بزرگ‌تر شدنشون، رابطه‌ها پیچیده‌تر میشه و داستان وارد مرحله‌ای میشه که احساسات، انتخاب‌ها و مسیر زندگی هرکدوم به چالش کشیده میشه."
        ],
        genres: [
            "درام",
            "خانوادگی",
            "عاشقانه"
        ],
        directors: [
            "دینگ زی‌گوانگ (丁梓光 - Dīng Zǐguāng)"
        ],
        cast: [
            "تان سونگ‌یون (谭松韵 - Tán Sōngyùn)",
            "سونگ وی‌لونگ (宋威龙 - Sòng Wēilóng)",
            "ژانگ شین‌چنگ (张新成 - Zhāng Xīnchéng)"
        ],
    },
    {
        slug: "love-between-fairy-and-devil",
        title: "苍兰诀",
        pinyin: "Cāng Lán Jué",
        posterPath: `${assetRoot}/fSsmm3Ada.jpeg`,
        episodeCount: 36,
        year: 2022,
        country: "چین",
        synopsis: [
            "داستان سریال \"عشق بین پری و شیطان\" در دنیایی فانتزی و اسطوره‌ای اتفاق می‌افته؛ جایی که یک پری ساده و مهربون به‌طور اتفاقی با موجودی قدرتمند و ترسناک از دنیای شیاطین درگیر میشه.",
            "در ابتدا همه‌چیز بین این دو تقابل و دشمنیه، اما کم‌کم رابطه‌ای شکل می‌گیره که مسیر داستان رو تغییر می‌ده. در این رابطه مفاهیمی مثل عشق، فداکاری و تغییر شخصیت به تصویر کشیده میشه.",
            "سریال با فضای پرزرق‌وبرق، جلوه‌های ویژه قوی و داستان احساسی، یکی از پرطرفدارترین فانتزی‌های چینی شده."
        ],
        genres: [
            "فانتزی",
            "عاشقانه",
            "تاریخی"
        ],
        directors: [
            "یی ژنگ (伊峥 - Yī Zhēng)"
        ],
        cast: [
            "یو شوشین (虞书欣 - Yú Shūxīn)",
            "وانگ هه‌دی (王鹤棣 - Wáng Hèdì)",
            "ژانگ لینگ‌هه (张凌赫 - Zhāng Línghè)"
        ],
    },
    {
        slug: "reset",
        title: "开端",
        pinyin: "Kāi Duān",
        posterPath: `${assetRoot}/Reset-Chinese-drama-review-poster-576x1024.jpg`,
        episodeCount: 15,
        episodeImagePaths: Array.from({ length: 15 }, (_, index) => `${resetEpisodeAssetRoot}/${index + 1}.jpg`),
        episodeLabelStyle: "padded",
        year: 2022,
        country: "چین",
        synopsis: [
            "سریال \"آغاز\" درباره دختریه که بعد از یک انفجار در اتوبوس، ناگهان متوجه میشه در یک چرخه زمانی گیر افتاده—هر بار که حادثه اتفاق می‌افته، دوباره به قبل از اون لحظه برمی‌گرده.",
            "در ادامه، او با پسری همراه میشه و سعی می‌کنن بفهمن دقیقاً چه اتفاقی در حال رخ دادنه و چطور میشه جلوی اون رو گرفت. هر بار که زمان تکرار میشه، جزئیات جدیدی کشف می‌کنن و به حقیقت نزدیک‌تر می‌شن.",
            "سریال با ریتم سریع و فضای پرتعلیق، مخاطب رو درگیر یک معمای نفس‌گیر می‌کنه."
        ],
        genres: [
            "معمایی",
            "هیجانی",
            "علمی‌تخیلی"
        ],
        directors: [
            "سون مو (孙墨龙 - Sūn Mòlóng)",
            "لیو هونگ‌یوان (刘洪源 - Liú Hóngyuán)"
        ],
        cast: [
            "ژائو جین‌مای (赵今麦 - Zhào Jīnmài)",
            "بای جینگ‌تینگ (白敬亭 - Bái Jìngtíng)"
        ],
    },
    {
        slug: "you-are-my-glory",
        title: "你是我的荣耀",
        pinyin: "Nǐ shì wǒ de róngyào",
        posterPath: `${assetRoot}/fStIMmlHf.jpeg`,
        episodeCount: 32,
        year: 2021,
        country: "چین",
        synopsis: [
            "سریال \"تو افتخار منی\" درباره یک بازیگر معروفه که برای یک همکاری تبلیغاتی وارد دنیای بازی‌های آنلاین میشه، اما متوجه میشه مهارتش اون‌قدرها هم خوب نیست!",
            "در همین مسیر، با یکی از همکلاسی‌های قدیمیش که حالا یک مهندس موفقه دوباره ارتباط برقرار می‌کنه. این آشنایی دوباره کم‌کم به رابطه‌ای تبدیل میشه که هم مسیر حرفه‌ای‌شون رو تحت تأثیر قرار میده و هم زندگی شخصی‌شون رو.",
            "سریال ترکیبی از عشق، دنیای بازی و زندگی حرفه‌ایه و فضای خیلی لطیف و دلنشینی داره."
        ],
        genres: [
            "عاشقانه",
            "درام",
            "مدرن"
        ],
        directors: [
            "وانگ ژی (王之 - Wáng Zhī)"
        ],
        cast: [
            "یانگ یانگ (杨洋 - Yáng Yáng)",
            "دیلربا دیلمورات (迪丽热巴 - Dìlìrèbā)"
        ],
    },
];

export const getSeries = (slug: string | undefined): SeriesCatalogItem | undefined =>
    getScreenMediaItem(SERIES_CATALOG, slug);
