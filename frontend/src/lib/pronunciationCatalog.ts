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
        // The source list labels both review parts 3 and 4 as 第24课.
        knownLessonTitles: { 25: "第24课" },
        knownLessonSubtitles: {
            1: "What is Pinyin?",
            2: "An Introduction to Tones",
            3: "The First and Second Tones",
            4: "The Third and Forth Tones",
            5: "Tone Change & the Neutral Tone",
            6: "Tone Pairs – Part 1",
            7: "Tone Pairs – Part 2",
            8: "Tone Pairs – Part 3",
            9: "Tone Pairs – Part 4",
            10: 'Finals – Group "a" Sounds',
            11: 'Group "e" Sounds',
            12: 'Group "i" Sounds (part 1)',
            13: 'Finals – Group "i" Sounds (part 2)',
            14: 'Finals – Group "o" Sounds',
            15: 'Group "u" Sounds (Part 1)',
            16: 'Finals – Group "u" Sounds (Part 2)',
            17: "Letter ü Pronunciation & Spelling Rules",
            18: 'Finals – Group "ü"',
            19: 'Initials – Group "j q x" Sounds',
            20: 'Initials – Group "zh, ch, sh, r" Sounds',
            21: 'Initials – Group "z, c, s" Sounds',
            22: "Comprehensive Review–Part 1",
            23: "Comprehensive Review–Part 2",
            24: "Comprehensive Review–Part 3",
            25: "Comprehensive Review–Part 4",
            26: "Comprehensive Review–Part 5",
            27: "Comprehensive Review–Part 6",
            28: "1st Tone Combinations",
            29: "2nd Tone Combinations",
            30: "3rd Tone Combinations",
            31: "4nd Tone Combinations",
        },
        knownLessonThumbnails: Object.fromEntries(
            Array.from({ length: 10 }, (_, index) => [index + 1, `${assetRoot}/Yoyo Chinese/${index + 1}.png`]),
        ),
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
        knownLessonSubtitles: {
            1: "Master Chinese Tones",
            2: 'Master Chinese "zh ch sh r"',
            3: 'Master Chinese "j q x" and "zh ch sh"',
            4: 'Master Chinese "z c s"',
            5: "Master All Chinese Consonants",
            6: 'Master Chinese Vowels – "i, u, ü, a, o"',
            7: 'Master Chinese Pronunciation – "en eng / in ing / an ang"',
            8: "How I Improved My Pronunciation",
            9: "When do Chinese Tones Change?",
            10: 'The Chinese “e” has FIVE different sounds?!',
            11: "Are You Making These Pronunciation Mistakes?",
            12: "Does Chinese Have Word Stress?",
            13: "Master Chinese Compound Finals",
            14: "The Secret of The Neutral Tone",
        },
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
        knownLessonSubtitles: {
            1: "Basic knowledge of Chinese Mandarin syllables",
            2: "Basic knowledge of Chinese Mandarin tones",
            3: "Initials and finals of Chinese syllables",
            4: "Pronunciation and Tones of Mandarin Chinese",
            5: "Mandarin pronunciation training: b - p",
            6: "Mandarin pronunciation training: m - f",
            7: "Mandarin Pronunciation training: d - t",
            8: "Mandarin Pronunciation training: n - l",
            9: "Mandarin Pronunciation training: z - ch",
            10: "Mandarin Pronunciation training: g - k",
            11: "Mandarin Pronunciation training: h - j",
            12: "Mandarin Pronunciation training: q - x",
            13: "Mandarin Pronunciation Training: zh - z",
            14: "Mandarin pronunciation training: r-y-w",
            15: "Mandarin pronunciation training: ch & c",
            16: "Mandarin pronunciation training: sh - s",
            17: "Mandarin pronunciation--ing & in",
            18: 'The final "ü"',
            19: "Singing Chinese song--I will be okay",
        },
    },
];

export const getPronunciationCourse = (slug: string | undefined): PronunciationCatalogCourse | undefined =>
    getPlannedCourse(PRONUNCIATION_CATALOG, slug);

export const getPronunciationLessonTitle = (position: number): string => `第${position}课`;
