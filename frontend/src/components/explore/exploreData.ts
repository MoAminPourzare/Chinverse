import type { LucideIcon } from "lucide-react";
import { BookOpen, Flame, Headphones, PencilLine, Play, Sparkles } from "lucide-react";

export interface ExploreItem {
    title: string;
    id: string;
    href: string;
    icon: LucideIcon;
    color: string;
}

export interface ExploreSection {
    title: string;
    subtitle: string;
    id: string;
    tone: string;
    items: ExploreItem[];
}

const blue = "from-[#155aa6] to-[#0f4e92]";
const sky = "from-[#4f9de8] to-[#155aa6]";
const jade = "from-[#50bca4] to-[#15806f]";
const gold = "from-[#ffb74d] to-[#d88713]";
const slate = "from-[#64748b] to-[#334155]";
const cyan = "from-[#38bdf8] to-[#0f7f88]";

export const learningItems: ExploreItem[] = [
    { title: "HSK", id: "hsk", href: "/explore/hsk", icon: BookOpen, color: blue },
    { title: "تلفظ", id: "pronunciation", href: "/explore/pronunciation", icon: Play, color: sky },
    { title: "کاراکتر", id: "characters", href: "/explore/characters", icon: PencilLine, color: jade },
    { title: "گرامر", id: "grammar", href: "/explore/grammar", icon: Sparkles, color: gold },
    { title: "اصطلاح", id: "idioms", href: "/explore/idioms", icon: Flame, color: slate },
    { title: "چینی کاربردی", id: "practical", href: "/explore/practical", icon: Headphones, color: cyan },
    { title: "یادگیری با ولاگ", id: "vlogs", href: "/explore/vlogs", icon: Sparkles, color: jade },
    { title: "واژگان هم‌معنی", id: "synonyms", href: "/explore/synonyms", icon: BookOpen, color: sky },
    { title: "زبان چینی کلاسیک", id: "classical", href: "/explore/classical", icon: PencilLine, color: slate },
];

export const entertainmentItems: ExploreItem[] = [
    { title: "سریال", id: "series", href: "/explore/series", icon: Play, color: blue },
    { title: "فیلم", id: "movies", href: "/explore/movies", icon: Play, color: sky },
    { title: "کارتون و انیمیشن", id: "cartoons", href: "/explore/cartoons", icon: Sparkles, color: gold },
    { title: "پادکست", id: "podcasts", href: "/explore/podcasts", icon: Headphones, color: jade },
    { title: "موسیقی", id: "music", href: "/explore/music", icon: Flame, color: cyan },
    { title: "گفتارهای موضوعی", id: "topic-talks", href: "/explore/topic-talks", icon: BookOpen, color: slate },
];

export const artSkillItems: ExploreItem[] = [
    { title: "آشپزی", id: "arts-cooking", href: "/explore/arts-cooking", icon: Flame, color: gold },
    { title: "هنرهای رزمی", id: "martial-arts", href: "/explore/martial-arts", icon: Sparkles, color: blue },
    { title: "تمرینات انرژی و سلامت", id: "energy-health", href: "/explore/energy-health", icon: Headphones, color: jade },
    { title: "خطاطی", id: "calligraphy", href: "/explore/calligraphy", icon: PencilLine, color: slate },
    { title: "فرهنگ چای", id: "tea-culture", href: "/explore/tea-culture", icon: BookOpen, color: cyan },
];

export const cultureThoughtItems: ExploreItem[] = [
    { title: "متون کلاسیک آموزشی", id: "culture-texts", href: "/explore/culture-texts", icon: BookOpen, color: slate },
    { title: "داستان‌های تاریخی", id: "historical-stories", href: "/explore/historical-stories", icon: Sparkles, color: gold },
    { title: "شعر و ادبیات کلاسیک", id: "classical-poetry", href: "/explore/classical-poetry", icon: PencilLine, color: blue },
    { title: "آیین‌ها و جشن‌ها", id: "festivals-customs", href: "/explore/festivals-customs", icon: Flame, color: jade },
];

export const exploreSections: ExploreSection[] = [
    {
        title: "یادگیری زبان چینی",
        subtitle: "مسیرهای اصلی برای درس، تمرین و ساخت عادت روزانه.",
        id: "learning",
        tone: "border-[#d5e1ef] bg-[#f8fbff]",
        items: learningItems,
    },
    {
        title: "سرگرمی چینی",
        subtitle: "یادگیری با فیلم، سریال، صدا و محتوای دیدنی.",
        id: "entertainment",
        tone: "border-[#f4dfb8] bg-[#fffaf0]",
        items: entertainmentItems,
    },
    {
        title: "هنر و مهارت‌های چینی",
        subtitle: "مهارت‌های فرهنگی و کاربردی برای تجربه عمیق‌تر.",
        id: "arts",
        tone: "border-[#cceadf] bg-[#f5fffb]",
        items: artSkillItems,
    },
    {
        title: "فرهنگ و اندیشه چینی",
        subtitle: "متون، داستان‌ها و آیین‌های کلاسیک و فرهنگی.",
        id: "culture",
        tone: "border-[#e1e6ee] bg-[#fbfcff]",
        items: cultureThoughtItems,
    },
];

export function getExploreSection(id: string) {
    return exploreSections.find((section) => section.id === id);
}
