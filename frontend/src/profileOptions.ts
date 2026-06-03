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

export const PRIMARY_COUNTRY_OPTIONS = [
    "ایران",
    "چین",
    "افغانستان",
    "تاجیکستان",
    "ترکیه",
    "امارات",
    "آلمان",
    "کانادا",
    "آمریکا",
    "استرالیا",
    "انگلستان",
];

export const IRAN_PROVINCE_OPTIONS = [
    "آذربایجان شرقی",
    "آذربایجان غربی",
    "اردبیل",
    "اصفهان",
    "البرز",
    "ایلام",
    "بوشهر",
    "تهران",
    "چهارمحال و بختیاری",
    "خراسان جنوبی",
    "خراسان رضوی",
    "خراسان شمالی",
    "خوزستان",
    "زنجان",
    "سمنان",
    "سیستان و بلوچستان",
    "فارس",
    "قزوین",
    "قم",
    "کردستان",
    "کرمان",
    "کرمانشاه",
    "کهگیلویه و بویراحمد",
    "گلستان",
    "گیلان",
    "لرستان",
    "مازندران",
    "مرکزی",
    "هرمزگان",
    "همدان",
    "یزد",
];

export const LOCATION_FILTER_OPTIONS = [
    ...PRIMARY_COUNTRY_OPTIONS,
    ...IRAN_PROVINCE_OPTIONS.map((province) => `ایران / ${province}`),
];

export const EDUCATION_DEGREE_OPTIONS = [
    "دیپلم",
    "کاردانی",
    "کارشناسی",
    "کارشناسی ارشد",
    "دکتری",
    "دوره آزاد زبان چینی",
    "دوره تخصصی ترجمه",
    "دوره تخصصی تجارت با چین",
];

export const UNIVERSITY_OPTIONS = [
    "دانشگاه تهران",
    "دانشگاه شهید بهشتی",
    "دانشگاه علامه طباطبایی",
    "دانشگاه فردوسی مشهد",
    "دانشگاه اصفهان",
    "دانشگاه شیراز",
    "دانشگاه تبریز",
    "دانشگاه زبان و فرهنگ پکن",
    "دانشگاه پکن",
    "دانشگاه فودان",
    "دانشگاه شانگهای جیاتونگ",
    "دانشگاه نرمال پکن",
    "دانشگاه مطالعات خارجی پکن",
    "دانشگاه مطالعات بین‌المللی شانگهای",
];

export function isKnownProfileHeadline(value?: string | null) {
    if (!value) return false;
    return PROFILE_HEADLINE_OPTIONS.includes(value.trim());
}

export function isKnownCountry(value?: string | null) {
    if (!value) return false;
    return PRIMARY_COUNTRY_OPTIONS.includes(value.trim());
}

export function isKnownIranProvince(value?: string | null) {
    if (!value) return false;
    return IRAN_PROVINCE_OPTIONS.includes(value.trim());
}
