import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

export type PronunciationCatalogCourse = PlannedCatalogCourse;

const assetRoot = "/assets/chinverse/course-profiles";

/** This is an editorial plan; only the public courses API confirms published videos. */
export const PRONUNCIATION_CATALOG: PronunciationCatalogCourse[] = [
    {
        slug: "yoyo-chinese",
        title: "Yoyo Chinese (Pronunciation)",
        coverPath: `${assetRoot}/Yoyo Chinese.png`,
        lessonCount: 27,
        practiceCount: 4,
        description: [
            "یویو چاینیز مسیر آشنایی با پین‌یین، صداها و تن‌های زبان چینی را از پایه توضیح می‌دهد. درس‌ها برای کسی طراحی شده‌اند که می‌خواهد تلفظ را از آغاز درست یاد بگیرد و با شنیدن و تکرار تمرین کند.",
            "در این مجموعه، آموزش با نمونه‌های کوتاه و توضیح قدم‌به‌قدم پیش می‌رود تا تفاوت صداهای نزدیک به هم روشن‌تر شود.",
        ],
        audience: [
            "تازه‌کاری که می‌خواهد تلفظ را از پایه یاد بگیرد",
            "زبان‌آموزی که در پین‌یین و تن‌ها نیاز به مرور دارد",
        ],
        knownLessonSubtitles: { 1: "What is Pinyin?" },
        knownLessonThumbnails: { 1: `${assetRoot}/Yoyo Chinese/1.png` },
    },
    {
        slug: "grace-mandarin",
        title: "Grace Mandarin (Pronunciation)",
        coverPath: `${assetRoot}/Grace Mandarin.png`,
        lessonCount: 14,
        description: [
            "این مسیر روی شنیدن و گفتن صداهای ماندارین تمرکز دارد؛ از تن‌ها شروع می‌کند و به تلفظ صداهایی می‌رسد که معمولاً برای زبان‌آموزان دشوارند.",
        ],
        audience: [
            "مبتدی‌ای که می‌خواهد از پایه محکم شروع کند",
            "زبان‌آموزی که می‌خواهد تلفظش را دوباره بررسی کند",
            "کسی که قصد کار یا تحصیل در محیط چینی‌زبان دارد",
        ],
        knownLessonSubtitles: { 1: "Master Chinese Tones", 2: 'Master Chinese "zh ch sh r"' },
    },
    {
        slug: "yang-mandarin",
        title: "Yang Mandarin (Pronunciation)",
        coverPath: `${assetRoot}/Yang Mandarin.png`,
        lessonCount: 19,
        description: [
            "این دوره روی شکل‌گرفتن تلفظ ماندارین با توضیح منظم صداها و تمرین شنیداری تمرکز می‌کند. درس‌ها از ساختار هجا شروع می‌شوند و به تشخیص و تکرار صداها می‌رسند.",
            "هدف این است که زبان‌آموز بتواند صداهای نزدیک را دقیق‌تر بشنود و با اطمینان بیشتری بیان کند.",
        ],
        audience: [
            "تازه‌کاری که می‌خواهد تلفظ را اصولی یاد بگیرد",
            "زبان‌آموزی که هنوز در شنیدن یا گفتن بعضی صداها مشکل دارد",
            "کسی که می‌خواهد پیش از ادامهٔ درس‌ها، پایهٔ تلفظش را تقویت کند",
        ],
        knownLessonSubtitles: { 1: "Basic knowledge of Chinese Mandarin syllables" },
    },
];

export const getPronunciationCourse = (slug: string | undefined): PronunciationCatalogCourse | undefined =>
    getPlannedCourse(PRONUNCIATION_CATALOG, slug);

export const getPronunciationLessonTitle = (position: number): string => `第${position}课`;
