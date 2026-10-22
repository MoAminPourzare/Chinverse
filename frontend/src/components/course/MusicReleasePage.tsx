"use client";

import { useParams } from "next/navigation";
import CatalogEntryPage from "@/components/course/CatalogEntryPage";
import { getMusicArtist } from "@/lib/musicArtistCatalog";
import { getPublishedMusicReleaseLesson } from "@/lib/musicPublished";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function MusicReleasePage() {
    const params = useParams<{ id: string; release: string }>();
    const artist = getMusicArtist(params?.id);
    const release = artist?.releases.find((item) => item.slug === params?.release);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse("music", artist);
    const lesson = release ? getPublishedMusicReleaseLesson(publishedCourse, release) : undefined;
    return <CatalogEntryPage
        entry={artist && release ? { collectionTitle: artist.displayName, title: release.title, summary: release.kind === "album" ? `${release.year} · ${release.trackCount} آهنگ` : "آهنگ" } : undefined}
        backHref={artist ? `/music/${artist.slug}` : "/explore/music"} isLoading={isLoading} hasError={hasError}
        watchHref={publishedCourse && lesson ? `/watch/music/${publishedCourse.id}?lesson=${lesson.id}` : undefined}
    />;
}
