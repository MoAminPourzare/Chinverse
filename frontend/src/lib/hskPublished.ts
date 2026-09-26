import type { Course, LessonSummary } from "@/lib/courses";
import type { HskCatalogCourse } from "@/lib/hskCatalog";

/** A published HSK course joins a catalog slot only through its exact slug. */
export const findPublishedHskCourse = (courses: Course[], catalog: HskCatalogCourse): Course | undefined =>
    courses.find((course) => course.subcategory_slug === "hsk" && course.slug === catalog.slug);

/** lesson_index is the 1-based position within this book, not the printed lesson number. */
export const findPublishedHskLesson = (course: Course | undefined, position: number): LessonSummary | undefined => {
    if (!course || !Number.isInteger(position) || position < 1) return undefined;
    const matches = course.sections?.flatMap((section) => section.lessons || []).filter((lesson) =>
        lesson.metadata_json?.lesson_index === position,
    ) || [];
    return matches.length === 1 ? matches[0] : undefined;
};

export const getPublishedHskLessonHref = (course: Course, lesson: LessonSummary): string =>
    `/watch/hsk/${course.id}?lesson=${lesson.id}`;
