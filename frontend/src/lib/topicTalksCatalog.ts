import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { TOPIC_TALK_TOPICS } from "@/lib/topicTalkLessonTopics";

const assetRoot = "/assets/chinverse/course-profiles";
const talkLabels = (slug: string): Record<number, string> =>
    Object.fromEntries(TOPIC_TALK_TOPICS[slug].map((_, index) => [index + 1, `第${index + 1}集`]));
const talkSubtitles = (slug: string): Record<number, string> =>
    Object.fromEntries(TOPIC_TALK_TOPICS[slug].map((topic, index) => [index + 1, topic]));

/** Owner-reference page plan; the public courses API confirms published talks. */
export const TOPIC_TALKS_CATALOG: PlannedCatalogCourse[] = [
    {
        slug: "dr-yuni-xia",
        title: "两娃妈夏博士 Dr. Yuni Xia",
        cardTitle: "两娃妈夏博士",
        cardSubtitle: "Dr. Yuni Xia",
        subtitle: "Dr. Yuni Xia",
        coverPath: `${assetRoot}/${encodeURIComponent("两娃妈夏博士Dr. Yuni Xia.jpeg")}`,
        lessonCount: TOPIC_TALK_TOPICS["dr-yuni-xia"].length,
        fallbackLessonTitle: "گفتار",
        description: [
            "این دوره شامل گفتارهای کوتاه و موضوعی 两娃妈夏博士 / Dr. Yuni Xia هست. اون توی این مجموعه درباره داستان‌های کارآفرینی پشت برندهای کوچک و آشنای زندگی روزمره صحبت می‌کنه؛ مثل خوراکی‌ها، نوشیدنی‌ها، محصولات ساده و برندهایی که شاید هر روز ببینیم، ولی داستان پشتشون رو ندونیم. لحنش صمیمی، روون و طبیعیه و کمک می‌کنه بدون حس کلاس رسمی، با سبک واقعی و روزمره‌ی حرف زدن به چینی آشنا بشی.",
            "دکتر یونی دکتری کامپیوتر از دانشگاه پردو داره، قبلاً استاد دانشگاه ایندیانا بوده، مربی تیم ملی المپیاد کامپیوتر آمریکا بوده و بنیان‌گذار EasyFunCoding هست. برای همین توی محتواهاش هم تجربه‌ی زندگی، هم نگاه آموزشی و هم موضوعات مربوط به یادگیری و تربیت بچه‌ها دیده می‌شه.",
            "ویدیوها معمولاً کوتاه و روان‌اند و برای تقویت شنیدار، درک مطلب و یاد گرفتن عبارت‌های طبیعی خیلی مناسبن. او بیشتر با ماندارین معیار صحبت می‌کنه و تلفظش واضح و قابل‌فهمه، چون اهل 湖北 استان Hubei هست، ممکنه گاهی اثری از لهجه‌ی محلی، مخصوصاً در صداهایی مثل n و l شنیده بشه؛ پس این دوره برای شنیدن چینی طبیعی عالیه، ولی برای تمرین تلفظ بهتره نیتیوهای معیار رو ملاک اصلی قرار بدی."
        ],
        audience: [
            "متوسط رو به بالا",
            "کسایی که می‌خوان شنیدار و درک گفتار رو تقویت کنن",
            "علاقه‌مندان به موضوعات روزمره و سبک زندگی"
        ],
        knownLessonTitles: talkLabels("dr-yuni-xia"),
        knownLessonSubtitles: talkSubtitles("dr-yuni-xia"),
    },
    {
        slug: "jishi-shuo",
        title: "纪实说",
        coverPath: `${assetRoot}/纪实说.jpeg`,
        lessonCount: TOPIC_TALK_TOPICS["jishi-shuo"].length,
        fallbackLessonTitle: "گفتار",
        description: [
            "این برنامه بیشتر شبیه گفت‌وگوهای تلویزیونی و برنامه‌های بحثه؛ چند تا کارشناس یا استاد دور هم جمع می‌شن و درباره یه موضوع خاص صحبت می‌کنن. موضوع‌ها معمولاً فکری و چالشی‌ان، مثل مسائل فلسفی، اجتماعی یا حتی چیزایی مثل وجود روح و هرکدوم از زاویه دید خودشون نظر می‌دن.",
            "سبک صحبت‌ها طبیعی اما نسبتاً جدی‌تره و چون چند نفر با دیدگاه‌های مختلف حرف می‌زنن، برای تقویت درک شنیداری در بحث‌های واقعی و چندنفره خیلی مفیده.",
            "از نظر زبانی بیشتر ماندارین معیار استفاده میشه، ولی به‌خاطر حالت بحث، سرعت صحبت گاهی بالاتر میره و نیاز به تمرکز بیشتری داره."
        ],
        audience: [
            "پیشرفته",
            "کسایی که می‌خوان چینی رو در بحث‌ها و گفت‌وگوهای واقعی یاد بگیرن",
            "علاقه‌مندان به موضوعات فکری و چالشی"
        ],
        knownLessonTitles: talkLabels("jishi-shuo"),
        knownLessonSubtitles: talkSubtitles("jishi-shuo"),
    },
    {
        slug: "documentary-literature-hall",
        title: "纪实文学馆",
        coverPath: `${assetRoot}/纪实文学馆.jpeg`,
        lessonCount: TOPIC_TALK_TOPICS["documentary-literature-hall"].length,
        fallbackLessonTitle: "گفتار",
        description: [
            "این برنامه بیشتر شبیه یه میزگرد یا گفت‌وگوی گروهیه که چند نفر دور هم جمع می‌شن و درباره یه موضوع خاص صحبت می‌کنن؛ موضوع‌ها هم معمولاً حالت فکری، فرهنگی یا حتی مسائل فلسفی.",
            "فضا خیلی شبیه برنامه‌های تلویزیونیه، هر کس نظر خودش رو میگه، گاهی بحث شکل می‌گیره و همین باعث میشه با جریان واقعی گفت‌وگوهای چندنفره آشنا بشی. این مدل برنامه‌ها معمولاً برای انتقال دیدگاه‌ها و بحث‌های فرهنگی ساخته می‌شن.",
            "از نظر زبانی ماندارین معیار استفاده میشه، ولی چون چند نفر با هم حرف می‌زنن، سرعت و تنوع لحن بالاتره و یه کم چالش‌برانگیزتره."
        ],
        audience: [
            "پیشرفته",
            "کسایی که می‌خوان چینی رو در بحث‌ها و گفت‌وگوهای واقعی یاد بگیرن",
            "علاقه‌مندان به موضوعات فکری و چالشی"
        ],
        knownLessonTitles: talkLabels("documentary-literature-hall"),
        knownLessonSubtitles: talkSubtitles("documentary-literature-hall"),
    },
];

export const getTopicTalksCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(TOPIC_TALKS_CATALOG, slug);
