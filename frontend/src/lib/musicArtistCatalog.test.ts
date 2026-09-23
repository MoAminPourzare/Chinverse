import { describe, expect, it } from "vitest";
import { getMusicArtist, MUSIC_ARTIST_CATALOG } from "@/lib/musicArtistCatalog";
import { getFirstPublishedScreenMediaLesson } from "@/lib/screenMediaCatalog";

describe("music artist catalog", () => {
    it("matches the four owner-reference cards in display order", () => {
        expect(MUSIC_ARTIST_CATALOG.map((artist) => [artist.slug, artist.title, artist.displayName])).toEqual([
            ["jay-chou", "周杰伦", "Jay Chou"],
            ["gem", "邓紫棋", "G. E. M"],
            ["jj-lin", "林俊杰", "JJ Lin"],
            ["auro", "阿若 Auro", "Auro"],
        ]);
    });

    it("keeps profile content complete without inventing ratings or duration", () => {
        for (const artist of MUSIC_ARTIST_CATALOG) {
            expect(artist.pinyin).toBeTruthy();
            expect(artist.portraitPath).toBeTruthy();
            expect(artist.biography.length).toBeGreaterThan(0);
            expect(artist.styles.length).toBeGreaterThan(0);
            expect(artist).not.toHaveProperty("rating");
            expect(artist).not.toHaveProperty("duration");
        }
        expect(getMusicArtist("auro")?.pinyin).toBe("ā ruò");
        expect(getMusicArtist("missing")).toBeUndefined();
    });

    it("links playback only to a media-backed published track", () => {
        const course = {
            id: 18,
            title: "music",
            description: "",
            level: "music",
            sections: [
                { id: 2, order_index: 2, lessons: [{ id: 42, media_id: 9 }] },
                { id: 1, order_index: 1, lessons: [{ id: 41, media_id: null }] },
            ],
        };
        expect(getFirstPublishedScreenMediaLesson(course)?.id).toBe(42);
        expect(getFirstPublishedScreenMediaLesson({ ...course, sections: [{ id: 1, lessons: [{ id: 41, media_id: null }] }] })).toBeUndefined();
    });
});
