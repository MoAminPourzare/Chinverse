import type { Course, LessonSummary } from "@/lib/courses";

interface SluggedCatalogItem {
    slug: string;
}

export const findPublishedPlannedCourse = (
    courses: Course[], subcategorySlug: string, catalog: SluggedCatalogItem,
): Course | undefined => courses.find((course) =>
    course.subcategory_slug === subcategorySlug && course.slug === catalog.slug,
);

/** lesson_index is the one-based position in this planned course. */
export const findPublishedPlannedLesson = (course: Course | undefined, position: number): LessonSummary | undefined => {
    if (!course || !Number.isInteger(position) || position < 1) return undefined;
    const matches = course.sections?.flatMap((section) => section.lessons || []).filter((lesson) =>
        lesson.metadata_json?.lesson_index === position,
    ) || [];
    return matches.length === 1 ? matches[0] : undefined;
};

export const getPublishedPlannedLessonHref = (domain: string, course: Course, lesson: LessonSummary): string =>
    `/watch/${domain}/${course.id}?lesson=${lesson.id}`;
