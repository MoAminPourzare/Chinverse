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
    pronunciation: { title: "تلفظ", detailPath: "/pronunciation", layout: "list", accentClass: "bg-blue-500" },
    characters: { title: "کاراکتر", detailPath: "/characters", layout: "list", accentClass: "bg-purple-500" },
    grammar: { title: "گرامر", detailPath: "/grammar", layout: "list", accentClass: "bg-emerald-500" },
    idioms: { title: "اصطلاحات", detailPath: "/idioms", layout: "list", accentClass: "bg-rose-500" },
    series: { title: "سریال‌ها", detailPath: "/series", layout: "portrait", countKeys: ["episodes_count"], countLabel: "قسمت" },
    movies: { title: "فیلم", detailPath: "/movies", layout: "portrait", countKeys: ["episodes_count"], countLabel: "بخش" },
    cartoons: { title: "کارتون و انیمیشن", detailPath: "/cartoons", layout: "portrait", countKeys: ["episodes_count"], countLabel: "بخش" },
    cooking: { title: "آشپزی", detailPath: "/cooking", layout: "square", countKeys: ["episodes_count"], countLabel: "قسمت" },
    podcasts: { title: "پادکست", detailPath: "/podcasts", layout: "square", countKeys: ["episodes_count"], countLabel: "اپیزود" },
    music: { title: "موسیقی", detailPath: "/music", layout: "square", countKeys: ["tracks_count"], countLabel: "آهنگ" },
    reality: { title: "ریالیتی شو", detailPath: "/reality", layout: "portrait", countKeys: ["episodes_count"], countLabel: "قسمت" },
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
