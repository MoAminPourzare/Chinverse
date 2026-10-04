import type { LucideIcon } from "lucide-react";
import {
    ArrowLeftRight, AudioLines, BookOpenText, Braces, Brush, Clapperboard,
    Coffee, CookingPot, Feather, GraduationCap, HeartPulse, Landmark,
    MessageCircle, Mic2, Music2, PartyPopper, PenLine, Podcast, Quote,
    Rabbit, ScrollText, Swords, Tv, Video,
} from "lucide-react";

export interface ExploreItem {
    title: string;
    id: string;
    href: string;
    icon: LucideIcon;
}

export interface ExploreSection {
    title: string;
    subtitle: string;
    id: string;
    items: ExploreItem[];
}

export const learningItems: ExploreItem[] = [
    { title: "HSK", id: "hsk", href: "/explore/hsk", icon: GraduationCap },
    { title: "تلفظ", id: "pronunciation", href: "/explore/pronunciation", icon: AudioLines },
    { title: "کاراکتر", id: "characters", href: "/explore/characters", icon: PenLine },
    { title: "گرامر", id: "grammar", href: "/explore/grammar", icon: Braces },
    { title: "اصطلاح", id: "idioms", href: "/explore/idioms", icon: Quote },
    { title: "چینی کاربردی", id: "practical", href: "/explore/practical", icon: MessageCircle },
    { title: "یادگیری با ولاگ", id: "vlogs", href: "/explore/vlogs", icon: Video },
    { title: "واژگان هم‌معنی", id: "synonyms", href: "/explore/synonyms", icon: ArrowLeftRight },
    { title: "زبان چینی کلاسیک", id: "classical", href: "/explore/classical", icon: BookOpenText },
];

export const entertainmentItems: ExploreItem[] = [
    { title: "سریال", id: "series", href: "/explore/series", icon: Tv },
    { title: "فیلم", id: "movies", href: "/explore/movies", icon: Clapperboard },
    { title: "کارتون و انیمیشن", id: "cartoons", href: "/explore/cartoons", icon: Rabbit },
    { title: "پادکست", id: "podcasts", href: "/explore/podcasts", icon: Podcast },
    { title: "موسیقی", id: "music", href: "/explore/music", icon: Music2 },
    { title: "گفتارهای موضوعی", id: "topic-talks", href: "/explore/topic-talks", icon: Mic2 },
];

export const artSkillItems: ExploreItem[] = [
    { title: "آشپزی", id: "cooking", href: "/explore/cooking", icon: CookingPot },
    { title: "هنرهای رزمی", id: "martial-arts", href: "/explore/martial-arts", icon: Swords },
    { title: "تمرینات انرژی و سلامت", id: "energy-health", href: "/explore/energy-health", icon: HeartPulse },
    { title: "خطاطی", id: "calligraphy", href: "/explore/calligraphy", icon: Brush },
    { title: "فرهنگ چای", id: "tea-culture", href: "/explore/tea-culture", icon: Coffee },
];

export const cultureThoughtItems: ExploreItem[] = [
    { title: "متون کلاسیک آموزشی", id: "culture-texts", href: "/explore/culture-texts", icon: ScrollText },
    { title: "داستان‌های کهن", id: "historical-stories", href: "/explore/historical-stories", icon: Landmark },
    { title: "شعر و ادبیات کلاسیک", id: "classical-poetry", href: "/explore/classical-poetry", icon: Feather },
    { title: "آیین‌ها و جشن‌ها", id: "festivals-customs", href: "/explore/festivals-customs", icon: PartyPopper },
];

export const exploreSections: ExploreSection[] = [
    {
        title: "یادگیری زبان چینی",
        subtitle: "مسیرهای اصلی برای درس، تمرین و ساخت عادت روزانه.",
        id: "learning",
        items: learningItems,
    },
    {
        title: "سرگرمی چینی",
        subtitle: "یادگیری با فیلم، سریال، صدا و محتوای دیدنی.",
        id: "entertainment",
        items: entertainmentItems,
    },
    {
        title: "هنر و مهارت‌های چینی",
        subtitle: "مهارت‌های فرهنگی و کاربردی برای تجربه عمیق‌تر.",
        id: "arts",
        items: artSkillItems,
    },
    {
        title: "فرهنگ و اندیشه چینی",
        subtitle: "متون، داستان‌ها و آیین‌های کلاسیک و فرهنگی.",
        id: "culture",
        items: cultureThoughtItems,
    },
];

export function getExploreSection(id: string) {
    return exploreSections.find((section) => section.id === id);
}
