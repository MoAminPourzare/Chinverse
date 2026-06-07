// ==================== Shared Video & Lesson Utilities ====================

// Video thumbnails (YouTube placeholders for development)
const thumbnails = [
    "https://i.ytimg.com/vi/RuGmc662HDg/mqdefault.jpg",
    "https://i.ytimg.com/vi/3hLmDS179YE/mqdefault.jpg",
    "https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg",
    "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
];

/**
 * Get a development video thumbnail based on lesson ID.
 * In production, this would resolve to `/videos/{domain}/{courseId}/{lessonId}.jpg`
 */
export const getVideoThumbnail = (lessonId: number): string => {
    return thumbnails[lessonId % thumbnails.length];
};

/**
 * Resolve the video asset path for a given domain, course, and lesson.
 * Currently returns a placeholder; in production, points to `/videos/{domain}/{courseId}/lesson_{lessonId}.mp4`
 */
export const getVideoAssetPath = (domain: string, courseId: number, lessonId: number): string => {
    return `/videos/${domain}/${courseId}/lesson_${lessonId}.mp4`;
};

// Sample Chinese titles for HSK lessons
export const lessonChineseTitles: Record<number, string> = {
    1: "周末你有什么打算？",
    2: "他什么时候回来？",
    3: "桌子上放着很多饮料。",
    4: "她总是笑着跟客人说话。",
    5: "你去哪儿我就去哪儿",
    6: "除了这个还有别的吗？",
    7: "你看起来很高兴",
    8: "我听了三遍才听懂",
    9: "这个字怎么念？",
    10: "你把书放在桌子上",
    11: "我把作业做完了",
    12: "他被老师批评了",
};

// Persian ordinal numbers for lesson labels
export const persianNumbers = [
    "اول", "دوم", "سوم", "چهارم", "پنجم",
    "ششم", "هفتم", "هشتم", "نهم", "دهم",
    "یازدهم", "دوازدهم",
];
