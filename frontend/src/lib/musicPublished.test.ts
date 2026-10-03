import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/courses";
import { getPublishedMusicReleaseLesson } from "@/lib/musicPublished";
import type { MusicReleaseCatalogItem } from "@/lib/musicReleaseCatalog";

const album: MusicReleaseCatalogItem = { kind: "album", slug: "jay", title: "Jay", year: 2000, trackCount: 10 };
const song: MusicReleaseCatalogItem = { kind: "song", slug: "daughter-love", title: "女儿情" };
const course: Course = { id: 18, title: "music", description: "", level: "music", sections: [] };

describe("published music release playback", () => {
    it("starts the selected album at its first available media track", () => {
        const published = { ...course, sections: [
            { id: 1, order_index: 1, lessons: [{ id: 10, media_id: 1 }] },
            { id: 2, order_index: 2, metadata_json: { album_slug: "jay" }, lessons: [
                { id: 20, media_id: null }, { id: 21, media_id: 2 }, { id: 22, media_id: 3 },
            ] },
        ] };
        expect(getPublishedMusicReleaseLesson(published, album)?.id).toBe(21);
    });

    it("accepts explicit lesson album metadata in section order", () => {
        const published = { ...course, sections: [
            { id: 2, order_index: 2, lessons: [{ id: 22, media_id: 3, metadata_json: { album_slug: "jay" } }] },
            { id: 1, order_index: 1, lessons: [{ id: 21, media_id: 2, metadata_json: { release_slug: "jay" } }] },
        ] };
        expect(getPublishedMusicReleaseLesson(published, album)?.id).toBe(21);
    });

    it("matches a song by its identity and registered media", () => {
        const published = { ...course, sections: [{ id: 1, lessons: [
            { id: 10, media_id: 1 },
            { id: 20, media_id: 2, metadata_json: { track_slug: "daughter-love" } },
            { id: 21, media_id: 3, metadata_json: { track_slug: "daughter-love-2" } },
        ] }] };
        expect(getPublishedMusicReleaseLesson(published, song)?.id).toBe(20);
        expect(getPublishedMusicReleaseLesson(published, { ...song, slug: "daughter-love-2" })?.id).toBe(21);
    });

    it("leaves unmatched, unpublished and ambiguous songs unlinked", () => {
        expect(getPublishedMusicReleaseLesson(undefined, song)).toBeUndefined();
        for (const lessons of [
            [{ id: 10, media_id: 1 }],
            [{ id: 20, media_id: null, metadata_json: { track_slug: "daughter-love" } }],
            [{ id: 20, media_id: 2, metadata_json: { track_slug: "daughter-love" } }, { id: 21, media_id: 3, metadata_json: { release_slug: "daughter-love" } }],
        ]) expect(getPublishedMusicReleaseLesson({ ...course, sections: [{ id: 1, lessons }] }, song)).toBeUndefined();
    });

    it("does not guess between duplicate album sections or play an unrelated album", () => {
        const published = { ...course, sections: [1, 2].map((id) => ({ id, metadata_json: { album_slug: "jay" }, lessons: [{ id: id * 10, media_id: id }] })) };
        expect(getPublishedMusicReleaseLesson(published, album)).toBeUndefined();
        expect(getPublishedMusicReleaseLesson(published, { ...album, slug: "other" })).toBeUndefined();
    });

    it("rejects conflicting release identities on album sections and individual tracks", () => {
        const albumMetadata = { release_slug: "other", album_slug: "jay" };
        const albumSection = { id: 1, metadata_json: albumMetadata, lessons: [{ id: 10, media_id: 1 }] };
        expect(getPublishedMusicReleaseLesson({ ...course, sections: [albumSection] }, album)).toBeUndefined();
        for (const release of [album, song]) {
            const specificKey = release.kind === "album" ? "album_slug" : "track_slug";
            const metadata_json = { release_slug: "other", [specificKey]: release.slug };
            const published = { ...course, sections: [{ id: 1, lessons: [{ id: 10, media_id: 1, metadata_json }] }] };
            expect(getPublishedMusicReleaseLesson(published, release)).toBeUndefined();
            expect(getPublishedMusicReleaseLesson(published, { ...release, slug: "other" })).toBeUndefined();
            metadata_json.release_slug = release.slug;
            expect(getPublishedMusicReleaseLesson(published, release)?.id).toBe(10);
        }
    });
});
