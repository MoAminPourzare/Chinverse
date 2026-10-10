import { getPlannedCourse, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

export type PronunciationCatalogCourse = PlannedCatalogCourse;

const assetRoot = "/assets/chinverse/course-profiles";

/** This is an editorial plan; only the public courses API confirms published videos. */
export const PRONUNCIATION_CATALOG: PronunciationCatalogCourse[] = [
    {
        slug: "yoyo-chinese",
        title: "Yoyo Chinese (Pronunciation)",
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Yoyo Chinese.png`,
        lessonCount: 27,
        practiceCount: 4,
        description: [
            "مدرس اصلیش یانگ‌یانگه، یه معلم چینی خیلی خوش‌بیان که صداها، پین‌یین و تن‌های چینی رو جوری توضیح میده که واقعاً می‌فهمی دهنت باید چطوری حرکت کنه.",
        ],
        audience: [
            "اگه تازه‌کاری و می‌خوای از همون اول تلفظ غلط یاد نگیری",
            "اگه دوست داری چینی رو طبیعی و قابل فهم صحبت کنی، نه رباتی",
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
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Grace Mandarin.png`,
        lessonCount: 14,
        description: [
            "گریس ماندارین یه دوره‌ی کاربردی و دقیق برای یادگیری تلفظ استاندارد زبان چینیه که توسط گریس، مدرس ماندارین از تایوان، تدریس میشه. سبک آموزش گریس خیلی واضح، منظم و قابل فهمه و تمرکزش روی اینه که کمک کنه از همون ابتدا صداها رو درست و اصولی یاد بگیری.",
            "توی این دوره، پین‌یین، تن‌ها و تفاوت صداهای مشابه به صورت مرحله‌به‌مرحله توضیح داده میشن. یکی از نقاط قوتش اینه که فقط به گفتن تلفظ اکتفا نمی‌کنه، بلکه نشون میده دهان، زبان و لب‌ها دقیقاً چه حالتی باید داشته باشن و تفاوت صداهای نزدیک به هم چیه. همین باعث میشه تلفظ‌ها رو عمیق‌تر درک کنی و راحت‌تر بتونی تقلیدشون کنی. برای کسایی که بین z / zh یا j / q قاطی می‌کنن، واقعاً نجات‌دهنده‌ست.",
            "نکته‌ی مهم اینه که چون گریس از تایوانه، علاوه بر پین‌یین، با سیستم Zhuyin (Bopomofo) هم آشنایی میده و در بعضی درس‌ها بهش اشاره می‌کنه. این برای کسایی که قصد کار با منابع تایوانی یا تحصیل در تایوان رو دارن یه امتیاز جدیه.",
        ],
        audience: [
            "اگه مبتدی هستی و می‌خوای از پایه محکم شروع کنی",
            "اگه قبلاً خوندی ولی حس می‌کنی تلفظت یه جاهایی می‌لنگه",
            "اگه قصد کار یا تحصیل تو تایوان رو داری",
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
        tagline: "یادگیری زبان چینی | از اساس",
        coverPath: `${assetRoot}/Yang Mandarin.png`,
        lessonCount: 19,
        description: [
            "توی این مجموعه، پین‌یین و تن‌ها به شکل منظم و بخش‌بندی‌شده آموزش داده میشن. مدرس صداها رو واضح و شمرده تلفظ می‌کنه و فرصت میده باهاش تکرار کنی. همین مکث‌ها و ریتم کنترل‌شده، باعث میشه ذهنت فرصت پردازش داشته باشه و اشتباهات رو همون لحظه اصلاح کنی.",
            "نکته مثبت این دوره اینه که روی تفاوت‌های ظریف صداها کار می‌کنه؛ همون جاهایی که معمولاً زبان‌آموزها اشتباه می‌کنن ولی خودشون متوجهش نیستن. تمرین‌ها کمک می‌کنن گوشت حساس‌تر بشه و گفتارت محکم‌تر و مطمئن‌تر شنیده بشه.",
        ],
        audience: [
            "اگه تازه شروع کردی و می‌خوای پایه‌ی گفتارت اصولی شکل بگیره",
            "اگه مدت‌ها خوندی ولی هنوز حس می‌کنی تلفظت «یه چیزی کم داره»",
            "اگه هدفت اینه که وقتی چینی صحبت می‌کنی، طرف مقابل بدون تلاش اضافه بفهمتت",
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
