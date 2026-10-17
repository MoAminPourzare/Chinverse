import type { Course, LessonSummary } from "@/lib/courses";
import type { PodcastLevelGroup } from "@/lib/podcastCatalog";

/** A level starts only in its explicitly identified section, never in another level. */
export function getPublishedPodcastGroupLesson(course: Course | undefined, group: PodcastLevelGroup): LessonSummary | undefined {
    const sections = course?.sections?.filter((section) => {
        const slugs = [section.metadata_json?.group_slug, section.metadata_json?.level_slug]
            .filter((slug) => slug !== undefined && slug !== null);
        return slugs.length > 0 && slugs.every((slug) => slug === group.slug);
    }) || [];
    return sections.length === 1 ? sections[0].lessons?.find((lesson) => Boolean(lesson.media_id)) : undefined;
}
