import type { Course, LessonSummary } from "@/lib/courses";
import type { MusicReleaseCatalogItem } from "@/lib/musicReleaseCatalog";

const matchesRelease = (metadata: Record<string, unknown> | undefined, release: MusicReleaseCatalogItem): boolean => {
    const slugs = [metadata?.release_slug, metadata?.[release.kind === "album" ? "album_slug" : "track_slug"]]
        .filter((slug) => slug !== undefined && slug !== null);
    return slugs.length > 0 && slugs.every((slug) => slug === release.slug);
};

/** Resolve the selected release explicitly; never send every card to the artist's first track. */
export function getPublishedMusicReleaseLesson(course: Course | undefined, release: MusicReleaseCatalogItem): LessonSummary | undefined {
    if (!course) return undefined;
    const sections = [...(course.sections || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    if (release.kind === "album") {
        const albumSections = sections.filter((section) => matchesRelease(section.metadata_json, release));
        if (albumSections.length > 1) return undefined;
        if (albumSections.length === 1) return albumSections[0].lessons?.find((lesson) => Boolean(lesson.media_id));
    }
    const tracks = sections.flatMap((section) => section.lessons || [])
        .filter((lesson) => Boolean(lesson.media_id) && matchesRelease(lesson.metadata_json, release));
    if (release.kind === "song" && tracks.length !== 1) return undefined;
    return tracks[0];
}
