import { getScreenMediaItem, type ScreenMediaCatalogItem } from "@/lib/screenMediaCatalog";

const assetRoot = "/assets/chinverse/course-profiles/انیمیشن و کارتون ها";
const bearsAssetRoot = `${assetRoot}/熊出没之探险日记`;

const bearsEpisodeTitles = [
    "导游光头强", "冤家路窄", "冒险启程", "迷路危机", "难忘的一夜", "原来是误会",
    "难找的水源", "只想好好睡一觉", "捕鱼能手", "漂流历险记", "善意的谎言", "森林寻宝",
    "回心转意", "用我的真心打动你", "隐藏的陷阱", "危机四伏的森林", "“野人”出没", "神秘的驯鹿少年",
    "蒲公英的约定", "稻田保卫战", "白桦林奇遇", "老虎找到了", "神奇的饮料", "猛虎逼近",
    "初到无人村", "奇怪的豹子", "拯救豹子", "东北虎的线索", "洞穴龙现身", "黑暗中的救星",
    "大马猴的诡计", "梦幻水晶河", "山谷矿车", "被遗忘的地方", "地图争夺战", "孤独的英雄",
    "意外的敌人", "秘密基地", "高原上的危险", "神秘的洞窟", "患难见真情", "雪山惊险夜",
    "雪怪传说", "风雪中的战斗", "营救赵琳", "雾影迷踪", "惊现小虎崽", "虎妈的误会",
    "最强联盟", "令人迷惑的陷阱", "营救大作战", "再见，珍重",
];

// The reference repeats the same still from episode 15 through the finale.
const bearsEpisodeImages = [
    "熊出没之探险日记2- (4).jpg", "019b42666b0c49d3988c046f0c17248e.jpeg",
    "a_100255380_m_601_720_405.jpg", "熊出没之探险日记 (1).jpg",
    "v_114083026_m_601_m2_480_270.jpg", "0.jpg", "2.jpg", "5.png", "3.jpg",
    "8.png", "7.jpg", "6.jpg", "v_114118922_m_601_m1_480_270.jpg",
    "v_114118914_m_601_m1_480_270.jpg",
    ...Array.from({ length: 38 }, () => "v_114118916_m_601_m1_480_270.jpg"),
].map((file) => `${bearsAssetRoot}/${encodeURIComponent(file)}`);

const pupilEpisodeTitles = [
    "祥云宝宝", "神奇的手表", "父亲节礼物", "行孝要及时", "蜜语耳机", "缩小魔镜",
    "神奇的护膝", "妈妈的生日礼物", "同心存钱罐", "玩具变形记", "应答的礼节", "一双戏靴",
    "妈妈我爱你", "爱护大地", "兵马桶风波", "世间一日，帽下一年", "缩水被子", "能量大挪移",
    "万能画板", "虚拟卫星", "真假小禾", "借书风波", "美食小厨神", "化蝶记",
    "加速陀螺", "催眠豆荚", "义犬依依", "换梦", "从富贵到贫穷", "主仆大变身",
    "水晶杯", "珍爱书籍", "一勤天下无难事", "爱在身边", "白树叶", "天鹅之羽 01",
    "天鹅之羽 02", "天鹅之羽 03", "天鹅之羽 04", "感恩香皂", "两个妈妈", "虫虫餐厅",
    "在磨练中成长", "口袋宝宝", "信犬小京巴 01", "信犬小京巴 02", "信犬小京巴 03", "信犬小京巴 04",
    "信犬小京巴 05", "信犬小京巴 06", "谨慎交", "善恶之间", "白雪", "诚实宝宝",
    "超越自己", "魔法泡泡", "许愿瓶", "榜样的力量", "突围行动", "竞赛的真谛",
];

export type CartoonCatalogItem = ScreenMediaCatalogItem;

/** Owner-reference animation catalog. Playable media still comes from the public API. */
export const CARTOON_CATALOG: CartoonCatalogItem[] = [
    {
        slug: "nezha-birth-of-the-demon-child",
        title: "哪吒之魔童降世",
        pinyin: "Nǎ Zhā Zhī Mó Tóng Jiàng Shì",
        posterPath: `${assetRoot}/OIP%20(9).jpg`,
        englishTitle: "Ne Zha",
        year: 2019,
        country: "چین",
        synopsis: [
            "انیمیشن «نژا: تولد کودک شیطان» دربارهٔ پسربچه‌ای است که از همان بدو تولد سرنوشتی متفاوت و ترسناک برایش پیش‌بینی شده و دیگران تصور می‌کنند به نیرویی ویرانگر تبدیل خواهد شد.",
            "نژا برخلاف انتظار دیگران می‌کوشد مسیر خودش را انتخاب کند. روایت با طنز، اکشن و لحظه‌های عاطفی نشان می‌دهد قضاوت دیگران چگونه هویت یک کودک را شکل می‌دهد و ارادهٔ شخصی چگونه می‌تواند با سرنوشت ازپیش‌تعیین‌شده مقابله کند.",
        ],
        genres: ["انیمیشن", "فانتزی", "اکشن", "ماجراجویی"],
        directors: ["جیائوزی (饺子 — Jiǎozi)"],
        cast: [],
        credits: [
            { label: "کارگردان:", items: ["جیائوزی (饺子 — Jiǎozi)"] },
            { label: "نام واقعی:", items: ["یانگ یو (杨宇 — Yáng Yǔ)"] },
        ],
    },
    {
        slug: "jiang-ziya",
        title: "姜子牙",
        pinyin: "Jiāng Zǐyá",
        posterPath: `${assetRoot}/Jiang%20Ziya%20.jpg`,
        englishTitle: "Jiang Ziya",
        previewImagePath: `${assetRoot}/Jiang%20Ziya%201.jpeg`,
        year: 2020,
        country: "چین",
        synopsis: [
            "انیمیشن «جیانگ زیا» دربارهٔ جنگجویی افسانه‌ای است که پس از مأموریتی مهم، به‌دلیل یک تصمیم بحث‌برانگیز از جایگاهش سقوط می‌کند.",
            "او برای بازگشت به حقیقت و گذشتهٔ خودش سفر می‌کند و در مسیر با رازهای پنهان و انتخاب‌هایی روبه‌رو می‌شود که مرز میان درست و غلط را برایش تغییر می‌دهند.",
        ],
        genres: ["انیمیشن", "فانتزی", "اکشن", "ماجراجویی"],
        directors: [
            "چنگ تنگ (程腾 — Chéng Téng)",
            "لی وی (李炜 — Lǐ Wěi)",
        ],
        cast: [],
        credits: [{
            label: "کارگردان:",
            items: ["چنگ تنگ (程腾 — Chéng Téng)", "لی وی (李炜 — Lǐ Wěi)"],
        }],
    },
    {
        slug: "da-hu-fa",
        title: "大护法",
        pinyin: "Dà Hù Fǎ",
        posterPath: `${assetRoot}/da_hu_fa-926020162-large.jpg`,
        englishTitle: "The Guardian",
        previewImagePath: `${assetRoot}/大护法2.jpeg`,
        year: 2017,
        country: "چین",
        synopsis: [
            "انیمیشن «محافظ اعظم» دربارهٔ محافظی مرموز است که برای پیدا کردن شاهزاده‌ای گمشده وارد سرزمینی عجیب می‌شود؛ جایی که ساکنانش با ظاهری یکسان زندگی می‌کنند و هیچ‌چیز آن‌طور که به نظر می‌رسد نیست.",
            "پشت روایت فانتزی و اکشن فیلم، نقدی اجتماعی و فلسفی دربارهٔ اختیار، ترس و هویت جریان دارد و فضای بصری متفاوت آن بخشی مهم از تجربهٔ اثر است.",
        ],
        genres: ["انیمیشن", "فانتزی", "اکشن", "هنری"],
        directors: ["بوسیفان (不思凡 — Bù Sīfán)"],
        cast: [],
        credits: [{ label: "کارگردان:", items: ["بوسیفان (不思凡 — Bù Sīfán)"] }],
    },
    {
        slug: "white-snake-origin",
        title: "白蛇：缘起",
        pinyin: "Bái Shé: Yuán Qǐ",
        posterPath: `${assetRoot}/白蛇：缘起%20.webp`,
        englishTitle: "White Snake: Origin",
        previewImagePath: `${assetRoot}/白蛇：缘起%201.jpeg`,
        year: 2019,
        country: "چین",
        synopsis: [
            "«مار سفید: سرآغاز» دربارهٔ دختری به نام بای است که حافظه‌اش را از دست داده و در کنار آ شوان برای شناخت گذشتهٔ خود سفر می‌کند.",
            "آن‌ها در این مسیر با پیوندی عاشقانه، نیروهای ناشناخته و چالش‌هایی روبه‌رو می‌شوند که سرنوشتشان را به افسانهٔ مار سفید گره می‌زند. فیلم افسانه و اسطورهٔ چینی را با ماجراجویی و احساس ترکیب می‌کند.",
        ],
        genres: ["انیمیشن", "فانتزی", "عاشقانه", "اکشن"],
        directors: [
            "هوانگ جیاکانگ (黄家康 — Huáng Jiākāng)",
            "ژائو جی (赵霁 — Zhào Jì)",
        ],
        cast: [],
        credits: [{
            label: "کارگردان:",
            items: ["هوانگ جیاکانگ (黄家康 — Huáng Jiākāng)", "ژائو جی (赵霁 — Zhào Jì)"],
        }],
    },
    {
        slug: "green-snake",
        title: "白蛇2：青蛇劫起",
        pinyin: "Bái Shé 2: Qīng Shé Jié Qǐ",
        posterPath: `${assetRoot}/白蛇2：青蛇劫起.jpeg`,
        englishTitle: "Green Snake",
        previewImagePath: `${assetRoot}/白蛇2：青蛇劫起1.jpeg`,
        year: 2021,
        country: "چین",
        synopsis: [
            "«مار سفید ۲: خیزش مار سبز» داستان شیاو چینگ را دنبال می‌کند؛ شخصیتی که پس از اتفاقی بزرگ وارد جهانی عجیب و متفاوت می‌شود، جایی که قوانینش با دنیای قبلی فرق دارد.",
            "او برای پیدا کردن راه بازگشت با خطرهای بیرونی و درونی روبه‌رو می‌شود. فضای مدرن‌تر و تمرکز بیشتر بر رشد شخصیت و استقلال، این قسمت را از فیلم نخست متمایز می‌کند.",
        ],
        genres: ["انیمیشن", "فانتزی", "اکشن", "ماجراجویی"],
        directors: ["هوانگ جیاکانگ (黄家康 — Huáng Jiākāng)"],
        cast: [],
        credits: [{ label: "کارگردان:", items: ["هوانگ جیاکانگ (黄家康 — Huáng Jiākāng)"] }],
    },
    {
        slug: "big-fish-and-begonia",
        title: "大鱼海棠",
        pinyin: "Dà Yú Hǎi Táng",
        posterPath: `${assetRoot}/大鱼海棠.jpeg`,
        englishTitle: "Big Fish & Begonia",
        previewImagePath: `${assetRoot}/大鱼海棠1.jpg`,
        year: 2016,
        country: "چین",
        synopsis: [
            "داستان در دنیایی افسانه‌ای جریان دارد؛ جایی که موجوداتی شبیه انسان زندگی می‌کنند و جهانشان زیر دنیای انسان‌هاست. دختری جوان وارد دنیای انسان‌ها می‌شود و یک اتفاق غیرمنتظره تصمیمی دشوار پیش روی او می‌گذارد.",
            "فیلم دربارهٔ عشق، فداکاری و پیامد انتخاب‌هاست و با تصویرسازی شاعرانه و پیوند با اسطوره‌های چینی، جهانی خیال‌انگیز می‌سازد.",
        ],
        genres: ["انیمیشن", "فانتزی", "عاشقانه", "درام"],
        directors: [
            "لیانگ شوان (梁旋 — Liáng Xuán)",
            "ژانگ چون (张春 — Zhāng Chūn)",
        ],
        cast: [],
        credits: [{
            label: "کارگردان:",
            items: ["لیانگ شوان (梁旋 — Liáng Xuán)", "ژانگ چون (张春 — Zhāng Chūn)"],
        }],
    },
    {
        slug: "boonie-bears-adventure-diary",
        title: "熊出没之探险日记",
        pinyin: "Xióng Chū Mò Zhī Tàn Xiǎn Rì Jì",
        posterPath: `${assetRoot}/熊出没之探险日记/20200723_140015.webp`,
        episodeCount: 52,
        episodeLabelStyle: "padded",
        episodeTitles: bearsEpisodeTitles,
        episodeImagePaths: bearsEpisodeImages,
        year: 2017,
        country: "چین",
        synopsis: [
            "در این فصل، شخصیت‌های اصلی وارد مجموعه‌ای از ماجراجویی‌های پیوسته در دل طبیعت می‌شوند. هر قسمت یک موقعیت تازه دارد؛ از حل یک مشکل و انجام مأموریت تا روبه‌روشدن با چالشی تازه در جنگل و محیط اطراف.",
            "داستان‌ها بر همکاری، خلاقیت و استفاده از تجربه‌های قبلی تأکید دارند و در کنار سرگرمی، دوستی و کار گروهی را برای مخاطب کودک پررنگ می‌کنند.",
        ],
        genres: ["ماجراجویی", "کمدی", "خانوادگی"],
        directors: ["تیم تولید استودیو Fantawild Animation"],
        cast: [],
        credits: [{ label: "کارگردان:", items: ["تیم تولید استودیو Fantawild Animation"] }],
    },
    {
        slug: "standards-for-being-a-good-pupil-season-1",
        title: "《中华弟子规》第一季",
        pinyin: "Zhōnghuá Dìzǐguī",
        posterPath: `${assetRoot}/hq720%20(1).jpg`,
        posterAspect: "landscape",
        detailTitleLines: ["《中华弟子规》", "第一季"],
        episodeCount: 60,
        episodeLabelStyle: "padded",
        episodeTitles: pupilEpisodeTitles,
        year: 2011,
        country: "چین",
        synopsis: [
            "این مجموعهٔ انیمیشنی بر اساس کتاب معروف «弟子规» ساخته شده؛ متنی کلاسیک از فرهنگ چین که به آموزش اخلاق، احترام به والدین، رفتار اجتماعی و نظم فردی می‌پردازد.",
            "هر قسمت یک آموزهٔ کوتاه و ساده را روایت می‌کند تا مفاهیم اخلاقی در قالب موقعیت‌های روزمره به تصویر کشیده شوند. این مجموعه مخصوصاً برای آشنایی هم‌زمان با زبان، فرهنگ و ارزش‌های سنتی چین مفید است.",
        ],
        genres: ["ماجراجویی", "کمدی", "خانوادگی"],
        directors: [],
        cast: [],
        credits: [{
            label: "تولیدکننده:",
            items: ["پروژهٔ مشترک چند نهاد فرهنگی و آموزشی چینی"],
        }],
    },
];

export const getCartoon = (slug: string | undefined): CartoonCatalogItem | undefined =>
    getScreenMediaItem(CARTOON_CATALOG, slug);
