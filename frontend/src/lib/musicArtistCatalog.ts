import { MUSIC_RELEASE_CATALOG, type MusicReleaseCatalogItem } from "@/lib/musicReleaseCatalog";

export interface MusicArtistCatalogItem {
    slug: string;
    title: string;
    displayName: string;
    pinyin: string;
    portraitPath: string;
    detailPortraitPath?: string;
    portraitAspect?: "portrait";
    releases: MusicReleaseCatalogItem[];
    biography: string[];
    styles: string[];
}

export const MUSIC_ARTIST_CATALOG: MusicArtistCatalogItem[] = [
    {
        slug: "jay-chou",
        title: "周杰伦",
        displayName: "Jay Chou",
        pinyin: "zhōu jiélún",
        portraitPath: "/assets/chinverse/course-profiles/موسیقی/周杰伦 Jay/周杰伦.jpg",
        detailPortraitPath: "/assets/chinverse/course-profiles/موسیقی/周杰伦 Jay/110a9f6b433d4177ab23db9f7ef62c9f.webp",
        portraitAspect: "portrait",
        releases: MUSIC_RELEASE_CATALOG["jay-chou"],
        biography: [
            "ژو جیه‌لون، خواننده، ترانه‌سرا، آهنگساز و تهیه‌کنندهٔ تایوانی، در ۱۸ ژانویهٔ ۱۹۷۹ به دنیا آمد. مادرش معلم پیانو بود و از کودکی او را به موسیقی تشویق کرد؛ او از چهار سالگی پیانو نواخت و بعدها ویولنسل را نیز آموخت.",
            "مسیر حرفه‌ای او ابتدا با آهنگسازی برای دیگر خوانندگان شکل گرفت. نخستین آلبومش با نام «Jay» در سال ۲۰۰۰ منتشر شد و ترکیب ملودی‌های چینی با R&B و هیپ‌هاپ، صدای شخصی و اثرگذار او را در ماندوپاپ ساخت.",
            "آثار او اغلب روایت‌محورند و از سازها و تصویرهای فرهنگی چین در کنار تنظیم مدرن استفاده می‌کنند؛ رویکردی که به شناخته‌شدن سبک «中国风» یا موسیقی پاپ با حال‌وهوای چینی کمک کرد.",
        ],
        styles: ["ماندوپاپ", "R&B", "هیپ‌هاپ", "中国风 (پاپ با عناصر سنتی چینی)"],
    },
    {
        slug: "gem",
        title: "邓紫棋",
        displayName: "G. E. M",
        pinyin: "dèng zǐqí",
        portraitPath: "/assets/chinverse/course-profiles/موسیقی/G.E.M/gem-profile.jpg",
        releases: MUSIC_RELEASE_CATALOG.gem,
        biography: [
            "دِنگ زی‌چی با نام انگلیسی G.E.M. و نام اصلی Gloria Tang، در سال ۱۹۹۱ در شانگهای و در خانواده‌ای اهل موسیقی به دنیا آمد. او در کودکی همراه خانواده به هنگ‌کنگ رفت، از سال‌های نخست پیانو آموخت و خیلی زود به خواندن و ترانه‌نویسی علاقه‌مند شد.",
            "او در نوجوانی وارد فعالیت حرفه‌ای شد و نخستین EP خود را در سال ۲۰۰۸ منتشر کرد. کنترل صوتی، دامنهٔ گسترده و اجرای پرقدرت، صدای او را در ماندوپاپ متمایز کرده است.",
            "ترانه‌هایی مانند Where Did U Go، 泡沫 (The Bubble) و 光年之外 (Light Years Away) از آثار شناخته‌شدهٔ او هستند. او علاوه بر خوانندگی، در ترانه‌نویسی و ساخت موسیقی آثارش نیز نقش دارد.",
        ],
        styles: ["پاپ", "R&B", "بالادهای احساسی"],
    },
    {
        slug: "jj-lin",
        title: "林俊杰",
        displayName: "JJ Lin",
        pinyin: "Lín Jùnjié",
        portraitPath: "/assets/chinverse/course-profiles/موسیقی/林俊杰 JJ Lin/ChatGPT%20Image%20May%209%2C%202026%2C%2011_24_16%20AM.png",
        releases: MUSIC_RELEASE_CATALOG["jj-lin"],
        biography: [
            "لین جون‌جیه، مشهور به JJ Lin، در سال ۱۹۸۱ در سنگاپور و در خانواده‌ای علاقه‌مند به موسیقی به دنیا آمد. او از کودکی پیانو آموخت و بعدها فعالیت حرفه‌ای خود را در آهنگسازی، ترانه‌نویسی و تولید موسیقی ادامه داد.",
            "پیش از شناخته‌شدن به‌عنوان خواننده، برای هنرمندان دیگر قطعه می‌ساخت. نخستین آلبوم رسمی‌اش 乐行者 (Music Voyager) در سال ۲۰۰۳ منتشر شد و ترانهٔ 江南 (River South) در آلبوم دوم، شهرت گسترده‌ای برای او به همراه آورد.",
            "بالادهای احساسی، ملودی‌های روشن و کنترل دقیق صدا هستهٔ کار او را می‌سازند. در کنار موسیقی، در تولید هنری و فعالیت‌های مرتبط با سرگرمی و ورزش‌های الکترونیک نیز حضور داشته است.",
        ],
        styles: ["پاپ", "بالادهای احساسی", "R&B", "موسیقی الکترونیک و آینده‌گرایانه"],
    },
    {
        slug: "auro",
        title: "阿若 Auro",
        displayName: "Auro",
        pinyin: "ā ruò",
        portraitPath: "/assets/chinverse/course-profiles/موسیقی/Auro/auro-profile.png",
        releases: MUSIC_RELEASE_CATALOG.auro,
        biography: [
            "Auro یک شخصیت موسیقایی مبتنی بر هوش مصنوعی است که قطعه‌های قدیمی چینی را با رنگ صوتی تازه و تنظیم‌های پاپ بازآفرینی می‌کند. در معرفی این پروژه، هدف اصلی پیوند دادن حال‌وهوای سنتی با شنوندهٔ امروز است.",
            "بازخوانی‌هایی از قطعاتی مانند 彩云追月 (Cǎiyún Zhuīyuè) و 一剪梅 (Yī Jiǎn Méi) نمونه‌ای از این رویکردند. فضای صوتی Auro از موسیقی چینی، بالادهای احساسی و C-pop الهام می‌گیرد.",
            "این صفحه Auro را به‌عنوان یک هویت هنری دیجیتال معرفی می‌کند؛ تصویر، صدا و سبک آن بخشی از طراحی همین شخصیت مجازی‌اند.",
        ],
        styles: ["ماندوپاپ", "بالادهای احساسی", "C-pop", "AI Music"],
    },
];

export const getMusicArtist = (slug: string | undefined): MusicArtistCatalogItem | undefined =>
    MUSIC_ARTIST_CATALOG.find((artist) => artist.slug === slug);
