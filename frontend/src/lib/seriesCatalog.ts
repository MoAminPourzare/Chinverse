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
        pinyin: "Tōu Tōu Cáng Bù Zhù",
        posterPath: `${assetRoot}/v2-2663d60481b402789eaca506206a4cb6_r.jpg`,
        episodeCount: 25,
        year: 2023,
        country: "چین",
        synopsis: [
            "سانگ ژی از سال‌های نوجوانی احساسش را نسبت به دوان جیاشو، دوست بزرگ‌تر برادرش، پنهان می‌کند. با گذشت زمان و دیدار دوبارهٔ آن‌ها در شهری دیگر، این علاقه فرصت پیدا می‌کند از یک دلبستگی نوجوانانه به رابطه‌ای بالغ تبدیل شود.",
            "سریال داستانی آرام دربارهٔ رشد، فاصلهٔ سنی، خانواده و شکل‌گرفتن اعتماد میان دو نفر دارد.",
        ],
        genres: ["عاشقانه", "درام", "نوجوانانه"],
        directors: ["لی چینگ‌رونگ (李青蓉 — Lǐ Qīngróng)"],
        cast: [
            "ژائو لوسی (赵露思 — Zhào Lùsī)",
            "چن ژه‌یوان (陈哲远 — Chén Zhéyuǎn)",
            "ما بوچیان (马伯骞 — Mǎ Bóqiān)",
        ],
    },
    {
        slug: "go-ahead",
        title: "以家人之名",
        pinyin: "Yǐ Jiārén Zhī Míng",
        posterPath: `${assetRoot}/fSs8b6nqJ.jpeg`,
        episodeCount: 40,
        year: 2020,
        country: "چین",
        synopsis: [
            "سه نوجوان که پیوند خونی ندارند، در کنار دو پدر و زیر یک سقف بزرگ می‌شوند و خانواده‌ای انتخابی می‌سازند. جدایی و بازگشت سال‌های بعد، رابطهٔ آن‌ها را با خاطرات کودکی و زخم‌های خانوادگی روبه‌رو می‌کند.",
            "سریال دربارهٔ معنای خانواده، بزرگ‌شدن، بخشش و شکل‌های گوناگون محبت است.",
        ],
        genres: ["درام", "خانوادگی", "عاشقانه"],
        directors: ["دینگ زی‌گوانگ (丁梓光 — Dīng Zǐguāng)"],
        cast: [
            "تان سونگ‌یون (谭松韵 — Tán Sōngyùn)",
            "سونگ وی‌لونگ (宋威龙 — Sòng Wēilóng)",
            "ژانگ شین‌چنگ (张新成 — Zhāng Xīnchéng)",
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
            "ارکیدهٔ کوچک، پری جوانی با نیروی محدود، ناخواسته فرمانروای قدرتمند قبیلهٔ ماه را آزاد می‌کند. پیوند جادویی میان آن‌ها باعث می‌شود احساس و سرنوشتشان به هم گره بخورد و دشمنی قدیمی به رابطه‌ای پیچیده تبدیل شود.",
            "داستان در جهانی افسانه‌ای با رقابت قلمروها، انتخاب میان قدرت و محبت و بهایی که شخصیت‌ها برای تغییر سرنوشت می‌پردازند پیش می‌رود.",
        ],
        genres: ["فانتزی", "عاشقانه", "تاریخی"],
        directors: ["یی ژنگ (伊峥 — Yī Zhēng)"],
        cast: [
            "یو شو‌شین (虞书欣 — Yú Shūxīn)",
            "وانگ هه‌دی (王鹤棣 — Wáng Hèdì)",
            "ژانگ لینگ‌هه (张凌赫 — Zhāng Línghè)",
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
            "لی شِچینگ پس از انفجار اتوبوس دوباره در همان مسیر بیدار می‌شود و می‌فهمد در یک حلقهٔ زمانی گرفتار شده است. او شیاو هه‌یون را هم وارد این تکرار می‌کند و آن دو می‌کوشند پیش از انفجار، علت حادثه و راه نجات مسافران را پیدا کنند.",
            "هر بار تکرار، جزئیات تازه‌ای از مسافران و گذشتهٔ آن‌ها آشکار می‌کند و معمای اصلی را یک قدم جلو می‌برد.",
        ],
        genres: ["معمایی", "هیجانی", "علمی‌تخیلی"],
        directors: [
            "سون مو‌لونگ (孙墨龙 — Sūn Mòlóng)",
            "لیو هونگ‌یوان (刘洪源 — Liú Hóngyuán)",
        ],
        cast: [
            "ژائو جین‌مای (赵今麦 — Zhào Jīnmài)",
            "بای جینگ‌تینگ (白敬亭 — Bái Jìngtíng)",
            "لیو تائو (刘涛 — Liú Tāo)",
        ],
    },
    {
        slug: "you-are-my-glory",
        title: "你是我的荣耀",
        pinyin: "Nǐ Shì Wǒ De Róngyào",
        posterPath: `${assetRoot}/fStIMmlHf.jpeg`,
        episodeCount: 32,
        year: 2021,
        country: "چین",
        synopsis: [
            "چیاو جینگ‌جینگ، بازیگری مشهور، برای بهترشدن در یک بازی آنلاین از همکلاسی قدیمی‌اش یو تو کمک می‌خواهد. این آشنایی دوباره، آن‌ها را میان فشار حرفه، رؤیاهای شخصی و احساسات گذشته روبه‌روی هم قرار می‌دهد.",
            "سریال ترکیبی از عشق، دنیای بازی و زندگی حرفه‌ای است و رابطهٔ دو شخصیت را آرام و مرحله‌به‌مرحله پیش می‌برد.",
        ],
        genres: ["عاشقانه", "درام", "مدرن"],
        directors: ["وانگ ژی (王之 — Wáng Zhī)"],
        cast: [
            "یانگ یانگ (杨洋 — Yáng Yáng)",
            "دیلرابا دیلمورات (迪丽热巴 — Dílìrèbā)",
        ],
    },
];

export const getSeries = (slug: string | undefined): SeriesCatalogItem | undefined =>
    getScreenMediaItem(SERIES_CATALOG, slug);
