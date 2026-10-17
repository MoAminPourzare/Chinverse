"use client";

import { useEffect, useState } from "react";
import { fetchCoursesBySubcategory, type Course } from "@/lib/courses";
import { findPublishedPlannedCourse } from "@/lib/plannedCoursePublished";

interface SluggedCatalogItem {
    slug: string;
}

export function usePublishedPlannedCourse(subcategorySlug: string, catalog: SluggedCatalogItem | undefined) {
    const [state, setState] = useState<{ slug: string; course?: Course; error: boolean } | null>(null);

    useEffect(() => {
        if (!catalog) return;
        let cancelled = false;
        const slug = catalog.slug;
        fetchCoursesBySubcategory(subcategorySlug)
            .then((courses) => {
                if (!cancelled) setState({ slug, course: findPublishedPlannedCourse(courses, subcategorySlug, catalog), error: false });
            })
            .catch(() => {
                if (!cancelled) setState({ slug, error: true });
            });
        return () => { cancelled = true; };
    }, [catalog, subcategorySlug]);

    return {
        publishedCourse: state?.slug === catalog?.slug ? state?.course : undefined,
        isLoading: Boolean(catalog && state?.slug !== catalog.slug),
        hasError: Boolean(catalog && state?.slug === catalog.slug && state?.error),
    };
}
