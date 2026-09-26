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
            "این مجموعه شامل گفتارهای کوتاه و موضوعی Dr. Yuni Xia است. او دربارهٔ موضوع‌های گوناگون، از تجربه‌های روزمره و تربیت کودک تا هوش مصنوعی و زندگی اجتماعی، با زبانی روشن و صمیمی صحبت می‌کند.",
            "در معرفی این پادکست آمده است که دکتر شیا دکترای علوم کامپیوتر خود را از دانشگاه پردو گرفته و در آموزش برنامه‌نویسی و فعالیت‌های کارآفرینانه حضور داشته است. ویدیوهای کوتاه او برای تقویت شنیدار و درک مطلب طراحی شده‌اند.",
            "گفتار او طبیعی، واضح و قابل‌فهم است و گاهی ردّی از لهجهٔ هوبِی و ویژگی‌های گفتار محاوره‌ای در آن شنیده می‌شود؛ بنابراین شنونده با چینی واقعی و روزمره روبه‌رو می‌شود.",
        ],
        audience: [
            "متوسط و بالاتر",
            "کسی که می‌خواهد شنیدار و درک گفتار طبیعی را تقویت کند",
            "علاقه‌مندان به موضوع‌های روزمره، فناوری و سبک زندگی",
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
            "این پادکست بر پایهٔ گفت‌وگو، مصاحبه و روایت‌های واقعی ساخته شده است. هر قسمت موضوعی مشخص را پی می‌گیرد؛ از جامعه و تاریخ چین تا اقتصاد، فلسفه و چالش‌های زندگی امروز.",
            "لحن صحبت طبیعی و شبیه یک گفت‌وگوی واقعی است. دیدگاه‌های متفاوت مطرح می‌شوند و شنونده فرصت دارد واژگان و ساختارهای چینی را در بحثی پیوسته و معنادار دنبال کند.",
            "سرعت گفتار نسبتاً بالاست و زبان رسمی و روزمره در کنار هم به کار می‌روند؛ ویژگی‌ای که این مجموعه را برای تمرین شنیدن چینی طبیعی مناسب می‌کند.",
        ],
        audience: [
            "پیشرفته",
            "کسی که می‌خواهد بحث‌ها و گفت‌وگوهای واقعی را بهتر بفهمد",
            "علاقه‌مندان به موضوع‌های فکری، اجتماعی و چالشی",
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
            "این مجموعه سراغ موضوع‌های فرهنگی، تاریخی و اجتماعی می‌رود و آن‌ها را با روایت و گفت‌وگویی مستندگونه پیش می‌برد. هر گفتار فضایی برای آشنایی با زمینهٔ موضوع و دیدگاه‌های مختلف فراهم می‌کند.",
            "ساختار روایت منسجم است و واژگان رسمی‌تر در کنار گفتار طبیعی شنیده می‌شوند. همین ترکیب به شنونده کمک می‌کند زبان چینی را در متن بحث‌های فرهنگی و اجتماعی دنبال کند.",
            "برای زبان‌آموزی مناسب است که از گفت‌وگوی سطح بالاتر استقبال می‌کند و می‌خواهد درک شنیداری خود را با موضوع‌های جدی‌تر تقویت کند.",
        ],
        audience: [
            "پیشرفته",
            "کسی که می‌خواهد بحث‌ها و گفت‌وگوهای واقعی را یاد بگیرد",
            "علاقه‌مندان به موضوع‌های فرهنگی و چالشی",
        ],
        knownLessonTitles: talkLabels("documentary-literature-hall"),
        knownLessonSubtitles: talkSubtitles("documentary-literature-hall"),
    },
];

export const getTopicTalksCourse = (slug: string | undefined): PlannedCatalogCourse | undefined =>
    getPlannedCourse(TOPIC_TALKS_CATALOG, slug);
