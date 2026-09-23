import { describe, expect, it } from "vitest";
import { CARTOON_CATALOG, getCartoon } from "@/lib/cartoonCatalog";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

describe("cartoon catalog", () => {
    it("matches the eight owner-reference cards in display order", () => {
        expect(CARTOON_CATALOG.map((item) => [item.slug, item.title, item.episodeCount || item.year])).toEqual([
            ["nezha-birth-of-the-demon-child", "哪吒之魔童降世", 2019],
            ["jiang-ziya", "姜子牙", 2020],
            ["da-hu-fa", "大护法", 2017],
            ["white-snake-origin", "白蛇：缘起", 2019],
            ["green-snake", "白蛇2：青蛇劫起", 2021],
            ["big-fish-and-begonia", "大鱼海棠", 2016],
            ["boonie-bears-adventure-diary", "熊出没之探险日记", 52],
            ["standards-for-being-a-good-pupil-season-1", "《中华弟子规》第一季", 60],
        ]);
    });

    it("keeps animation metadata complete without inventing ratings or duration", () => {
        for (const item of CARTOON_CATALOG) {
            expect(item.pinyin).toBeTruthy();
            expect(item.synopsis.length).toBeGreaterThan(0);
            expect(item.genres.length).toBeGreaterThan(0);
            expect(item.credits?.length).toBeGreaterThan(0);
            expect(item).not.toHaveProperty("rating");
            expect(item).not.toHaveProperty("duration");
        }
        expect(getCartoon("green-snake")?.year).toBe(2021);
        expect(getCartoon("missing")).toBeUndefined();
    });

    it("maps series episodes only by a unique index with registered media", () => {
        const course = {
            id: 20,
            title: "cartoon",
            description: "",
            level: "cartoon",
            sections: [{
                id: 1,
                lessons: [
                    { id: 31, media_id: 8, metadata_json: { episode_index: 2 } },
                    { id: 32, media_id: 9, metadata_json: { lesson_index: 3 } },
                    { id: 33, media_id: null, metadata_json: { episode_index: 4 } },
                ],
            }],
        };
        expect(getPublishedSeriesEpisode(course, 2)?.id).toBe(31);
        expect(getPublishedSeriesEpisode(course, 3)?.id).toBe(32);
        expect(getPublishedSeriesEpisode(course, 4)).toBeUndefined();
    });
});
