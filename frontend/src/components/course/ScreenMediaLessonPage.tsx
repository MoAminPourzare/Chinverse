"use client";

import { useParams } from "next/navigation";
import CatalogEntryPage from "@/components/course/CatalogEntryPage";
import { getFirstPublishedScreenMediaLesson, getPublishedSeriesEpisode, getScreenMediaItem, type ScreenMediaCatalogItem } from "@/lib/screenMediaCatalog";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function ScreenMediaLessonPage({ domain, catalog }: { domain: string; catalog: ScreenMediaCatalogItem[] }) {
    const params = useParams<{ id: string; lesson: string }>();
    const item = getScreenMediaItem(catalog, params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse(domain, item);
    const position = Number(params?.lesson);
    const count = item?.episodeCount || 1;
    const valid = item && Number.isInteger(position) && position >= 1 && position <= count;
    const lesson = valid ? item.episodeCount ? getPublishedSeriesEpisode(publishedCourse, position) : getFirstPublishedScreenMediaLesson(publishedCourse) : undefined;
    const backHref = item ? `/${domain}/${item.slug}` : `/explore/${domain}`;
    const entryHref = item ? `/${domain}/${item.slug}/lesson/` : "";
    return <CatalogEntryPage
        entry={valid ? { collectionTitle: item.title, title: item.episodeCount ? `قسمت ${position}` : item.title, subtitle: item.episodeTitles?.[position - 1] } : undefined}
        backHref={backHref} isLoading={isLoading} hasError={hasError}
        watchHref={publishedCourse && lesson ? `/watch/${domain}/${publishedCourse.id}?lesson=${lesson.id}` : undefined}
        previousHref={valid && position > 1 ? `${entryHref}${position - 1}` : undefined}
        nextHref={valid && position < count ? `${entryHref}${position + 1}` : undefined}
    />;
}
