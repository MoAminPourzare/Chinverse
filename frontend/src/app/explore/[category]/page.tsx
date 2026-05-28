"use client";

import { useParams } from "next/navigation";
import CourseExplorePage from "@/components/course/CourseExplorePage";

const categoryConfig: Record<string, {
    title: string;
    detailPath: string;
    layout: "list" | "portrait" | "square";
    countKeys?: string[];
    countLabel?: string;
    accentClass?: string;
}> = {
    pronunciation: { title: "تلفظ", detailPath: "/pronunciation", layout: "list", countLabel: "درس", accentClass: "bg-blue-500" },
    characters: { title: "کاراکتر", detailPath: "/characters", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    grammar: { title: "گرامر", detailPath: "/grammar", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    idioms: { title: "اصطلاحات", detailPath: "/idioms", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    practical: { title: "چینی کاربردی", detailPath: "/practical", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    vlogs: { title: "یادگیری با ولاگ", detailPath: "/vlogs", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    synonyms: { title: "واژگان هم معنی", detailPath: "/synonyms", layout: "list", countLabel: "درس", accentClass: "bg-sky-600" },
    classical: { title: "زبان چینی کلاسیک", detailPath: "/classical", layout: "list", countLabel: "درس", accentClass: "bg-slate-700" },
    "arts-cooking": { title: "آشپزی", detailPath: "/arts-cooking", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    "martial-arts": { title: "هنرهای رزمی", detailPath: "/martial-arts", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    "energy-health": { title: "تمرینات انرژی و سلامت", detailPath: "/energy-health", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    calligraphy: { title: "خطاطی", detailPath: "/calligraphy", layout: "list", countLabel: "درس", accentClass: "bg-indigo-600" },
    "tea-culture": { title: "فرهنگ چای", detailPath: "/tea-culture", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    "culture-texts": { title: "متون کلاسیک آموزشی", detailPath: "/culture-texts", layout: "list", countLabel: "درس", accentClass: "bg-slate-700" },
    "historical-stories": { title: "داستان‌های تاریخی", detailPath: "/historical-stories", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    "classical-poetry": { title: "شعر و ادبیات کلاسیک", detailPath: "/classical-poetry", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    "festivals-customs": { title: "آیین‌ها و جشن‌ها", detailPath: "/festivals-customs", layout: "list", countLabel: "درس", accentClass: "bg-blue-700" },
    series: { title: "سریال‌ها", detailPath: "/series", layout: "portrait", countKeys: ["episodes_count"], countLabel: "قسمت" },
    movies: { title: "فیلم", detailPath: "/movies", layout: "portrait", countKeys: ["episodes_count"], countLabel: "بخش" },
    cartoons: { title: "کارتون و انیمیشن", detailPath: "/cartoons", layout: "portrait", countKeys: ["episodes_count"], countLabel: "بخش" },
    cooking: { title: "آشپزی", detailPath: "/cooking", layout: "square", countKeys: ["episodes_count"], countLabel: "قسمت" },
    podcasts: { title: "پادکست", detailPath: "/podcasts", layout: "square", countKeys: ["episodes_count"], countLabel: "اپیزود" },
    music: { title: "موسیقی", detailPath: "/music", layout: "square", countKeys: ["tracks_count"], countLabel: "آهنگ" },
    reality: { title: "ریالیتی شو", detailPath: "/reality", layout: "portrait", countKeys: ["episodes_count"], countLabel: "قسمت" },
    "topic-talks": { title: "گفتارهای موضوعی", detailPath: "/topic-talks", layout: "square", countKeys: ["episodes_count"], countLabel: "گفتار" },
};

export default function CategoryPage() {
    const params = useParams();
    const category = params?.category as string;
    const config = categoryConfig[category] || {
        title: category,
        detailPath: `/${category}`,
        layout: "square" as const,
    };

    return (
        <CourseExplorePage
            title={config.title}
            subcategorySlug={category}
            detailPath={config.detailPath}
            layout={config.layout}
            countKeys={config.countKeys}
            countLabel={config.countLabel}
            accentClass={config.accentClass}
        />
    );
}
