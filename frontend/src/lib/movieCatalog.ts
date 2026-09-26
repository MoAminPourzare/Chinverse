import {
    getFirstPublishedScreenMediaLesson,
    getScreenMediaItem,
    type ScreenMediaCatalogItem,
} from "@/lib/screenMediaCatalog";

const assetRoot = "/assets/chinverse/course-profiles/فیلم ها";

export type MovieCatalogItem = ScreenMediaCatalogItem;

/** Owner-reference movie catalog. Playable media still comes from the public API. */
export const MOVIE_CATALOG: MovieCatalogItem[] = [
    {
        slug: "dying-to-survive",
        title: "我不是药神",
        pinyin: "Wǒ Bù Shì Yào Shén",
        posterPath: `${assetRoot}/OIP%20(6).jpg`,
        englishTitle: "Dying to Survive",
        previewImagePath: `${assetRoot}/2fc22437ed.jpg`,
        year: 2018,
        country: "چین",
        synopsis: [
            "داستان فیلم دربارهٔ مردی به نام چِنگ یونگ است که زندگی چندان موفقی ندارد. ورود اتفاقی او به کار واردات داروی ارزان برای بیماران سرطانی، مسیر زندگی خودش و آدم‌های زیادی را عوض می‌کند.",
            "این درام اجتماعی با طنزی تلخ، فشار هزینهٔ درمان و انتخاب‌های اخلاقی آدم‌های معمولی را روایت می‌کند.",
        ],
        genres: ["درام", "اجتماعی", "کمدی تلخ"],
        directors: ["ون مویه (文牧野 — Wén Mùyě)"],
        cast: [
            "شو ژنگ (徐峥 — Xú Zhēng)",
            "وانگ چوان‌جون (王传君 — Wáng Chuánjūn)",
            "تان ژو (谭卓 — Tán Zhuō)",
            "ژانگ یو (章宇 — Zhāng Yǔ)",
        ],
    },
    {
        slug: "the-wandering-earth",
        title: "流浪地球1",
        pinyin: "Liúlàng Dìqiú",
        posterPath: `${assetRoot}/v2-42e7666cefabd3b6a08d95b1ae6b2058_r.webp`,
        englishTitle: "The Wandering Earth 1",
        previewImagePath: `${assetRoot}/流浪地球1.jpeg`,
        year: 2019,
        country: "چین",
        synopsis: [
            "با نزدیک‌شدن خورشید به پایان عمرش، انسان‌ها برای نجات زمین موتورهایی عظیم می‌سازند تا سیاره را به خانه‌ای تازه منتقل کنند. گروهی از آدم‌ها در میانهٔ این سفر با بحرانی روبه‌رو می‌شوند که آیندهٔ همه را تهدید می‌کند.",
            "فیلم یکی از آثار شاخص علمی‌تخیلی چین است و ماجراجویی فضایی را با تصمیم‌های خانوادگی و انسانی پیوند می‌دهد.",
        ],
        genres: ["علمی‌تخیلی", "ماجراجویی", "اکشن"],
        directors: ["گوئو فن (郭帆 — Guō Fān)"],
        cast: [
            "وو جینگ (吴京 — Wú Jīng)",
            "چو شیاو (屈楚萧 — Qū Chǔxiāo)",
            "لی گوانگ‌جیه (李光洁 — Lǐ Guāngjié)",
            "وو منگ‌دا (吴孟达 — Wú Mèngdá)",
            "چو جینگ‌جینگ (屈菁菁 — Qū Jīngjīng)",
        ],
    },
    {
        slug: "the-wandering-earth-2",
        title: "流浪地球2",
        pinyin: "Liúlàng Dìqiú",
        posterPath: `${assetRoot}/流浪地球2.jpg`,
        englishTitle: "The Wandering Earth 2",
        previewImagePath: `${assetRoot}/7a2c5d6682af4fead82a6586118b953663ae929f.jpg`,
        year: 2023,
        country: "چین",
        synopsis: [
            "این پیش‌درآمد، سال‌های آغاز پروژهٔ موتورهای سیاره‌ای را دنبال می‌کند؛ زمانی که بشر باید میان راه‌حل‌های رقیب برای نجات تمدن تصمیم بگیرد و با پیامدهای سنگین هر انتخاب روبه‌رو شود.",
            "روایت فیلم فناوری، امید و فداکاری را در مقیاسی جهانی کنار هم می‌گذارد و زمینهٔ داستان قسمت نخست را کامل می‌کند.",
        ],
        genres: ["علمی‌تخیلی", "ماجراجویی", "اکشن"],
        directors: ["گوئو فن (郭帆 — Guō Fān)"],
        cast: [
            "وو جینگ (吴京 — Wú Jīng)",
            "لیو ده‌هوا (刘德华 — Liú Déhuá / Andy Lau)",
            "لی شوجیان (李雪健 — Lǐ Xuějiàn)",
            "ژو یان‌مانزی (朱颜曼滋 — Zhū Yánmànzī)",
            "ژائو جین‌مای (赵今麦 — Zhào Jīnmài)",
        ],
    },
    {
        slug: "one-second",
        title: "一秒钟",
        pinyin: "Yī Miǎo Zhōng",
        posterPath: `${assetRoot}/one-second-poster.webp`,
        englishTitle: "One Second",
        previewImagePath: `${assetRoot}/v2-954f1ef78b8bace39d28734f656076dc_r.jpg`,
        showGenresInDetail: true,
        year: 2020,
        country: "چین",
        synopsis: [
            "در چین دوران انقلاب فرهنگی، مردی فراری فقط می‌خواهد یک لحظه تصویر دخترش را روی حلقهٔ فیلم ببیند. برخورد او با دختری نوجوان و یک آپاراتچی، داستانی دربارهٔ حافظه، تصویر و ارزش یک ثانیه می‌سازد.",
            "فیلم نگاهی شاعرانه به خاطره، سینما و بخشی از گذشتهٔ فرهنگی چین دارد.",
        ],
        genres: ["درام", "تاریخی", "اجتماعی"],
        directors: ["ژانگ ییمو (张艺谋 — Zhāng Yìmóu)"],
        cast: [
            "ژانگ یی (张译 — Zhāng Yì)",
            "لیو هائوچون (刘浩存 — Liú Hàocún)",
            "فن وی (范伟 — Fàn Wěi)",
        ],
    },
    {
        slug: "hi-mom",
        title: "你好，李焕英",
        pinyin: "Nǐ Hǎo, Lǐ Huànyīng",
        posterPath: `${assetRoot}/你好，李焕英.jpeg`,
        englishTitle: "Hi, Mom",
        previewImagePath: `${assetRoot}/你好，李焕英2.jpeg`,
        year: 2021,
        country: "چین",
        synopsis: [
            "پس از حادثه‌ای تلخ، جیا شیائولینگ ناگهان به سال‌های جوانی مادرش بازمی‌گردد. او تلاش می‌کند زندگی بهتری برای مادرش بسازد، اما این سفر تصویری تازه از رابطهٔ مادر و دختر به او می‌دهد.",
        ],
        genres: ["کمدی", "درام", "خانوادگی", "فانتزی"],
        directors: ["جیا لینگ (贾玲 — Jiǎ Líng)"],
        cast: [
            "جیا لینگ (贾玲 — Jiǎ Líng)",
            "ژانگ شیائوفی (张小斐 — Zhāng Xiǎofěi)",
            "شن تنگ (沈腾 — Shěn Téng)",
            "لیو جیا (刘佳 — Liú Jiā)",
        ],
    },
    {
        slug: "hello-mr-billionaire",
        title: "西虹市首富",
        pinyin: "Xī Hóng Shì Shǒu Fù",
        posterPath: `${assetRoot}/西虹市首富.jpeg`,
        englishTitle: "Hello Mr. Billionaire",
        previewImagePath: `${assetRoot}/西虹市首富2.jpeg`,
        year: 2018,
        country: "چین",
        synopsis: [
            "وانگ دوئو‌یوی، دروازه‌بانی ناموفق، برای به‌دست‌آوردن ارثی بزرگ باید در زمانی محدود مبلغ هنگفتی خرج کند؛ آن هم زیر مجموعه‌ای از قانون‌های عجیب که کار را هر لحظه سخت‌تر می‌کنند.",
            "این اثر از کمدی‌های پرفروش سینمای چین است و با موقعیت‌های اغراق‌آمیز به پول، شهرت و انتخاب شخصی نگاه می‌کند.",
        ],
        genres: ["کمدی", "اجتماعی", "فانتزی"],
        directors: [
            "یان فی (闫非 — Yán Fēi)",
            "پنگ دامو (彭大魔 — Péng Dàmo)",
        ],
        cast: [
            "شن تنگ (沈腾 — Shěn Téng)",
            "سونگ یون‌هوا (宋芸桦 — Sòng Yúnhuà)",
            "ما لی (马丽 — Mǎ Lì)",
            "گائو وی (高伟 — Gāo Wěi)",
        ],
    },
    {
        slug: "operation-red-sea",
        title: "红海行动",
        pinyin: "Hóng Hǎi Xíng Dòng",
        posterPath: `${assetRoot}/红海行动.jpeg`,
        englishTitle: "Operation Red Sea",
        previewImagePath: `${assetRoot}/红海行动2.jpeg`,
        showYearInDetail: false,
        year: 2018,
        country: "چین",
        synopsis: [
            "یک یگان ویژهٔ دریایی برای نجات شهروندان گرفتار در کشوری جنگ‌زده اعزام می‌شود. مأموریت تخلیه به عملیاتی دشوار تبدیل می‌شود و گروه باید زیر فشار زمان و درگیری‌های سنگین پیش برود.",
        ],
        genres: ["اکشن", "جنگی", "نظامی", "ماجراجویی"],
        directors: ["دانته لم (林超贤 — Lín Chāoxián)"],
        cast: [
            "ژانگ یی (张译 — Zhāng Yì)",
            "هوانگ جینگ‌یو (黄景瑜 — Huáng Jǐngyú)",
            "های چینگ (海清 — Hǎi Qīng)",
            "دو جیانگ (杜江 — Dù Jiāng)",
            "یین فانگ (尹昉 — Yǐn Fǎng)",
        ],
    },
    {
        slug: "our-times",
        title: "我的少女时代",
        pinyin: "Wǒ De Shàonǚ Shídài",
        posterPath: `${assetRoot}/我的少女时代.jpeg`,
        englishTitle: "Our Times",
        previewImagePath: `${assetRoot}/我的少女时代2.jpeg`,
        showYearInDetail: false,
        year: 2015,
        country: "تایوان",
        synopsis: [
            "لین ژِن‌شین، دانش‌آموزی معمولی، برای نزدیک‌شدن به پسر محبوب مدرسه با یک دانش‌آموز دردسرساز هم‌پیمان می‌شود. برنامهٔ آن‌ها کم‌کم به دوستی و شناختی تازه از عشق نوجوانی می‌رسد.",
        ],
        genres: ["عاشقانه", "کمدی", "نوجوانانه"],
        directors: ["چن یوشان (陈玉珊 — Chén Yùshān)"],
        cast: [
            "سونگ یون‌هوا (宋芸桦 — Sòng Yúnhuà)",
            "وانگ دالو (王大陆 — Wáng Dàlù)",
            "لی یوچن (李玉玺 — Lǐ Yùxǐ)",
            "جیان مان‌شو (简嫚书 — Jiǎn Mànshū)",
        ],
    },
];

export const getMovie = (slug: string | undefined): MovieCatalogItem | undefined =>
    getScreenMediaItem(MOVIE_CATALOG, slug);

export const getPublishedMovieLesson = getFirstPublishedScreenMediaLesson;
