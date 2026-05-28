export const PROFILE_HEADLINE_OPTIONS = [
    "مترجم زبان چینی",
    "مدرس زبان چینی",
    "زبان‌آموز چینی",
    "دانشجوی زبان چینی",
    "راهنمای تور چین",
    "تولیدکننده محتوای چینی",
    "مشاور تحصیل در چین",
    "بازرگان و واردات از چین",
    "متخصص فرهنگ چین",
    "زیرنویس و دوبله چینی",
];

export function isKnownProfileHeadline(value?: string | null) {
    if (!value) return false;
    return PROFILE_HEADLINE_OPTIONS.includes(value.trim());
}
