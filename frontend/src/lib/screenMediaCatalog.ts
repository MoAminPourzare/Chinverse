import type { Course, LessonSummary } from "@/lib/courses";

export interface ScreenMediaCatalogItem {
    slug: string;
    title: string;
    pinyin: string;
    posterPath: string;
    englishTitle?: string;
    previewImagePath?: string;
    posterAspect?: "landscape";
    detailTitleLines?: string[];
    showYearInDetail?: boolean;
    showGenresInDetail?: boolean;
    year: number;
    country: string;
    synopsis: string[];
    genres: string[];
    directors: string[];
    cast: string[];
    episodeCount?: number;
    episodeImagePaths?: string[];
    episodeTitles?: string[];
    episodeLabelStyle?: "padded";
    credits?: Array<{
        label: string;
        items: string[];
    }>;
}

export const getScreenMediaItem = <T extends ScreenMediaCatalogItem>(
    catalog: T[], slug: string | undefined,
): T | undefined => catalog.find((item) => item.slug === slug);

export const getFirstPublishedScreenMediaLesson = (course: Course | undefined): LessonSummary | undefined => {
    if (!course) return undefined;
    return [...(course.sections || [])]
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .flatMap((section) => section.lessons || [])
        .find((lesson) => Boolean(lesson.media_id));
};

export const getPublishedSeriesEpisode = (course: Course | undefined, position: number): LessonSummary | undefined => {
    if (!course || !Number.isInteger(position) || position < 1) return undefined;
    const matches = course.sections?.flatMap((section) => section.lessons || []).filter((lesson) => {
        const metadata = lesson.metadata_json || {};
        const positions = [metadata.episode_index, metadata.lesson_index]
            .filter((index) => index !== undefined && index !== null);
        return Boolean(lesson.media_id) && positions.length > 0 && positions.every((index) => index === position);
    }) || [];
    return matches.length === 1 ? matches[0] : undefined;
};
