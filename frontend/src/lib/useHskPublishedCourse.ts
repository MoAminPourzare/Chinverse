"use client";

import { useEffect, useState } from "react";
import { fetchCoursesBySubcategory, type Course } from "@/lib/courses";
import type { HskCatalogCourse } from "@/lib/hskCatalog";
import { findPublishedHskCourse } from "@/lib/hskPublished";

export function useHskPublishedCourse(catalog: HskCatalogCourse | undefined) {
    const [state, setState] = useState<{ slug: string; course?: Course; error: boolean } | null>(null);

    useEffect(() => {
        if (!catalog) return;
        let cancelled = false;
        const slug = catalog.slug;
        fetchCoursesBySubcategory("hsk")
            .then((courses) => {
                if (!cancelled) setState({ slug, course: findPublishedHskCourse(courses, catalog), error: false });
            })
            .catch(() => {
                if (!cancelled) setState({ slug, error: true });
            });
        return () => { cancelled = true; };
    }, [catalog]);

    return {
        publishedCourse: state?.slug === catalog?.slug ? state?.course : undefined,
        isLoading: Boolean(catalog && state?.slug !== catalog.slug),
        hasError: Boolean(catalog && state?.slug === catalog.slug && state?.error),
    };
}
