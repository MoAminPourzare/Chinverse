import type { Course, LessonSummary } from "@/lib/courses";
import type { CalligraphyLevel } from "@/lib/calligraphyCatalog";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

/** Positions are local to an explicitly identified level, never inferred from section order. */
export function getPublishedCalligraphyLevelLesson(
    course: Course | undefined, level: CalligraphyLevel, position: number,
): LessonSummary | undefined {
    if (!course || !Number.isInteger(position) || position < 1 || position > level.lessonCount) return undefined;
    const sections = course.sections?.filter((section) => {
        const slugs = [section.metadata_json?.level_slug, section.metadata_json?.group_slug]
            .filter((slug) => slug !== undefined && slug !== null);
        return slugs.length > 0 && slugs.every((slug) => slug === level.slug);
    }) || [];
    return sections.length === 1 ? getPublishedSeriesEpisode({ ...course, sections }, position) : undefined;
}
