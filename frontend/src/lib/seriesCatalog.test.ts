import { describe, expect, it } from "vitest";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";
import { getSeries, SERIES_CATALOG } from "@/lib/seriesCatalog";

describe("series catalog", () => {
    it("matches the five owner-reference cards in display order", () => {
        expect(SERIES_CATALOG.map((series) => [series.slug, series.title, series.episodeCount])).toEqual([
            ["hidden-love", "偷偷藏不住", 25],
            ["go-ahead", "以家人之名", 40],
            ["love-between-fairy-and-devil", "苍兰诀", 36],
            ["reset", "开端", 15],
            ["you-are-my-glory", "你是我的荣耀", 32],
        ]);
    });

    it("keeps complete detail metadata without inventing ratings or duration", () => {
        for (const series of SERIES_CATALOG) {
            expect(series.pinyin).toBeTruthy();
            expect(series.synopsis.length).toBeGreaterThan(0);
            expect(series.genres.length).toBeGreaterThan(0);
            expect(series.directors.length).toBeGreaterThan(0);
            expect(series.cast.length).toBeGreaterThan(0);
            expect(series).not.toHaveProperty("rating");
            expect(series).not.toHaveProperty("duration");
        }
        expect(getSeries("reset")?.year).toBe(2022);
        expect(getSeries("missing")).toBeUndefined();
    });

    it("maps a unique media-backed lesson by episode_index or lesson_index", () => {
        const course = {
            id: 12,
            title: "series",
            description: "",
            level: "series",
            sections: [{
                id: 1,
                lessons: [
                    { id: 21, media_id: 8, metadata_json: { episode_index: 2 } },
                    { id: 22, media_id: 9, metadata_json: { lesson_index: 3 } },
                    { id: 23, media_id: null, metadata_json: { episode_index: 4 } },
                ],
            }],
        };
        expect(getPublishedSeriesEpisode(course, 2)?.id).toBe(21);
        expect(getPublishedSeriesEpisode(course, 3)?.id).toBe(22);
        expect(getPublishedSeriesEpisode(course, 4)).toBeUndefined();
    });
});
