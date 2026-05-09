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

export const learningItems: ExploreItem[] = [
    { title: "HSK", id: "hsk", href: "/explore/hsk", icon: BookOpen, color: "from-amber-500 to-orange-500" },
    { title: "تلفظ", id: "pronunciation", href: "/explore/pronunciation", icon: Play, color: "from-sky-500 to-cyan-500" },
    { title: "کاراکتر", id: "characters", href: "/explore/characters", icon: PencilLine, color: "from-violet-500 to-indigo-600" },
    { title: "گرامر", id: "grammar", href: "/explore/grammar", icon: Sparkles, color: "from-emerald-500 to-teal-500" },
    { title: "اصطلاح", id: "idioms", href: "/explore/idioms", icon: Flame, color: "from-rose-500 to-orange-500" },
    { title: "چینی کاربردی", id: "practical", href: "/explore/practical", icon: Headphones, color: "from-cyan-600 to-sky-600" },
    { title: "یادگیری با ولاگ", id: "vlogs", href: "/explore/vlogs", icon: Sparkles, color: "from-amber-600 to-orange-600" },
    { title: "واژگان هم معنی", id: "synonyms", href: "/explore/synonyms", icon: BookOpen, color: "from-sky-600 to-blue-600" },
    { title: "زبان چینی کلاسیک", id: "classical", href: "/explore/classical", icon: PencilLine, color: "from-slate-700 to-slate-900" },
];

export const entertainmentItems: ExploreItem[] = [
    { title: "سریال", id: "series", href: "/explore/series", icon: Play, color: "from-rose-500 to-pink-500" },
    { title: "فیلم", id: "movies", href: "/explore/movies", icon: Play, color: "from-red-500 to-orange-500" },
    { title: "کارتون و انیمیشن", id: "cartoons", href: "/explore/cartoons", icon: Sparkles, color: "from-violet-500 to-fuchsia-500" },
    { title: "پادکست", id: "podcasts", href: "/explore/podcasts", icon: Headphones, color: "from-indigo-500 to-sky-500" },
    { title: "موسیقی", id: "music", href: "/explore/music", icon: Flame, color: "from-teal-500 to-emerald-500" },
    { title: "گفتارهای موضوعی", id: "topic-talks", href: "/explore/topic-talks", icon: BookOpen, color: "from-fuchsia-500 to-rose-500" },
];

export const artSkillItems: ExploreItem[] = [
    { title: "آشپزی", id: "arts-cooking", href: "/explore/arts-cooking", icon: Flame, color: "from-orange-500 to-amber-500" },
    { title: "هنرهای رزمی", id: "martial-arts", href: "/explore/martial-arts", icon: Sparkles, color: "from-red-500 to-rose-600" },
    { title: "تمرینات انرژی و سلامت", id: "energy-health", href: "/explore/energy-health", icon: Headphones, color: "from-emerald-500 to-teal-600" },
    { title: "خطاطی", id: "calligraphy", href: "/explore/calligraphy", icon: PencilLine, color: "from-indigo-500 to-violet-600" },
    { title: "فرهنگ چای", id: "tea-culture", href: "/explore/tea-culture", icon: BookOpen, color: "from-amber-700 to-orange-700" },
];

export const cultureThoughtItems: ExploreItem[] = [
    { title: "متون کلاسیک آموزشی", id: "culture-texts", href: "/explore/culture-texts", icon: BookOpen, color: "from-slate-700 to-slate-900" },
    { title: "داستان های تاریخی", id: "historical-stories", href: "/explore/historical-stories", icon: Sparkles, color: "from-stone-600 to-zinc-700" },
    { title: "شعر و ادبیات کلاسیک", id: "classical-poetry", href: "/explore/classical-poetry", icon: PencilLine, color: "from-violet-500 to-purple-600" },
    { title: "آیین ها و جشن ها", id: "festivals-customs", href: "/explore/festivals-customs", icon: Flame, color: "from-fuchsia-500 to-rose-500" },
];

export const exploreSections: ExploreSection[] = [
    {
        title: "یادگیری زبان چینی",
        subtitle: "مسیرهای اصلی برای درس، تمرین و ساخت عادت روزانه.",
        id: "learning",
        tone: "from-rose-500 to-orange-500",
        items: learningItems,
    },
    {
        title: "سرگرمی چینی",
        subtitle: "یادگیری با فیلم، سریال، صدا و محتوای دیدنی.",
        id: "entertainment",
        tone: "from-indigo-500 to-sky-500",
        items: entertainmentItems,
    },
    {
        title: "هنر و مهارت های چینی",
        subtitle: "مهارت های فرهنگی و کاربردی برای تجربه عمیق تر.",
        id: "arts",
        tone: "from-emerald-500 to-teal-600",
        items: artSkillItems,
    },
    {
        title: "فرهنگ و اندیشه چینی",
        subtitle: "متون، داستان ها و آیین های کلاسیک و فرهنگی.",
        id: "culture",
        tone: "from-slate-700 to-slate-950",
        items: cultureThoughtItems,
    },
];

export function getExploreSection(id: string) {
    return exploreSections.find((section) => section.id === id);
}
