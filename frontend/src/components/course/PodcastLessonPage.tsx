"use client";

import { useParams } from "next/navigation";
import CatalogEntryPage from "@/components/course/CatalogEntryPage";
import { getPodcast } from "@/lib/podcastCatalog";
import { getPublishedPodcastGroupLesson } from "@/lib/podcastPublished";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function PodcastLessonPage() {
    const params = useParams<{ id: string; lesson?: string; level?: string }>();
    const podcast = getPodcast(params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse("podcasts", podcast);
    const group = podcast?.groups?.find((item) => item.slug === params?.level);
    const position = Number(params?.lesson);
    const count = podcast?.episodeTitles?.length || 0;
    const validEpisode = podcast && !params?.level && Number.isInteger(position) && position >= 1 && position <= count;
    const entry = group && podcast ? { collectionTitle: podcast.title, title: group.title, summary: `${group.episodeCount} اپیزود در این سطح` }
        : validEpisode ? { collectionTitle: podcast.title, title: `第${position}集`, subtitle: podcast.episodeTitles?.[position - 1] } : undefined;
    const lesson = group ? getPublishedPodcastGroupLesson(publishedCourse, group) : validEpisode ? getPublishedSeriesEpisode(publishedCourse, position) : undefined;
    const backHref = podcast ? `/podcasts/${podcast.slug}` : "/explore/podcasts";
    return <CatalogEntryPage entry={entry} backHref={backHref} isLoading={isLoading} hasError={hasError}
        watchHref={publishedCourse && lesson ? `/watch/podcasts/${publishedCourse.id}?lesson=${lesson.id}` : undefined}
        previousHref={validEpisode && position > 1 ? `${backHref}/lesson/${position - 1}` : undefined}
        nextHref={validEpisode && position < count ? `${backHref}/lesson/${position + 1}` : undefined}
    />;
}
