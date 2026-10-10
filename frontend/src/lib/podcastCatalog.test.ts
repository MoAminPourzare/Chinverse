import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/courses";
import { PODCAST_CATALOG, getPodcast, getPodcastEpisodeCount } from "@/lib/podcastCatalog";
import { getPublishedPodcastGroupLesson } from "@/lib/podcastPublished";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

describe("podcast reference catalog", () => {
    it("keeps each show's full range and the Daily level counts", () => {
        expect(PODCAST_CATALOG.map((show) => [show.slug, getPodcastEpisodeCount(show)])).toEqual([
            ["chinese-daily", 53], ["practical-mandarin", 31], ["chinese-podcast-zone", 27], ["da-peng", 80], ["bumingbai", 50],
        ]);
        expect(getPodcast("chinese-daily")?.groups?.map((group) => [group.title, group.episodeCount])).toEqual([
            ["初级 (HSK 1–3)", 34], ["中级 (HSK 3–4)", 14], ["高级 (HSK 5–6)", 5],
        ]);
        expect(getPodcast("chinese-daily")?.episodeTitles).toBeUndefined();
        expect(getPodcast("missing")).toBeUndefined();
    });

    it("preserves reference boundaries and repeated Practical Mandarin titles", () => {
        const practical = getPodcast("practical-mandarin")!.episodeTitles!;
        expect(practical[0]).toBe('"Moyu": China\'s Quiet Quitting');
        expect(practical[16]).toBe("吃瓜 Eating Melons is NOT Eating Melons??!");
        expect(practical[21]).toBe(practical[16]);
        expect(practical.at(-1)).toBe("穿秋裤 Why Your Mom Forces You to Wear QiūKù?");
        expect(getPodcast("chinese-podcast-zone")?.episodeTitles?.at(-1)).toBe("别在机场迷路！学会这些中文就够了");
        expect(getPodcast("da-peng")?.episodeTitles?.at(-1)).toBe("这个字用得最多，最常用的汉字！《汉字达人-1》");
        expect(getPodcast("bumingbai")?.episodeTitles?.at(-1)).toBe("王春翰：习近平是如何崛起的");
    });

    it("uses local covers, including the two-host Practical Mandarin cover", () => {
        for (const show of PODCAST_CATALOG) expect(existsSync(join(process.cwd(), "public", decodeURIComponent(show.coverPath))), show.coverPath).toBe(true);
        expect(decodeURIComponent(getPodcast("practical-mandarin")!.coverPath)).toContain("地道中文表达.jpeg");
    });
});

describe("podcast playback identity", () => {
    const course: Course = { id: 20, title: "podcasts", description: "", level: "podcasts", sections: [] };
    const group = getPodcast("chinese-daily")!.groups![1];

    it("opens the selected level's first available media and accepts level or group metadata", () => {
        for (const metadata of [{ group_slug: "intermediate" }, { level_slug: "intermediate" }, { group_slug: "intermediate", level_slug: "intermediate" }]) {
            const published = { ...course, sections: [
                { id: 1, metadata_json: { group_slug: "beginner" }, lessons: [{ id: 10, media_id: 1 }] },
                { id: 2, metadata_json: metadata, lessons: [{ id: 20, media_id: null }, { id: 21, media_id: 2 }] },
            ] };
            expect(getPublishedPodcastGroupLesson(published, group)?.id).toBe(21);
        }
    });

    it("leaves unknown, empty, unpublished or ambiguous levels unlinked", () => {
        expect(getPublishedPodcastGroupLesson(undefined, group)).toBeUndefined();
        for (const sections of [
            [{ id: 1, lessons: [{ id: 10, media_id: 1 }] }],
            [{ id: 1, metadata_json: { group_slug: "intermediate" }, lessons: [{ id: 10, media_id: null }] }],
            [1, 2].map((id) => ({ id, metadata_json: { group_slug: "intermediate" }, lessons: [{ id: id * 10, media_id: id }] })),
        ]) expect(getPublishedPodcastGroupLesson({ ...course, sections }, group)).toBeUndefined();
    });

    it("does not open a section carrying two contradictory level identities", () => {
        const published = { ...course, sections: [{ id: 1, metadata_json: {
            group_slug: "intermediate", level_slug: "beginner",
        }, lessons: [{ id: 10, media_id: 1 }] }] };
        for (const level of getPodcast("chinese-daily")!.groups!) {
            expect(getPublishedPodcastGroupLesson(published, level)).toBeUndefined();
        }
    });

    it("uses explicit episode numbers, even for repeated titles and out-of-order lessons", () => {
        const published = { ...course, sections: [{ id: 1, lessons: [
            { id: 22, media_id: 3, metadata_json: { episode_index: 22 } },
            { id: 1, media_id: 1 },
            { id: 17, media_id: 2, metadata_json: { lesson_index: 17 } },
            { id: 18, media_id: null, metadata_json: { episode_index: 18 } },
        ] }] };
        expect(getPublishedSeriesEpisode(published, 17)?.id).toBe(17);
        expect(getPublishedSeriesEpisode(published, 22)?.id).toBe(22);
        expect(getPublishedSeriesEpisode(published, 1)).toBeUndefined();
        expect(getPublishedSeriesEpisode(published, 18)).toBeUndefined();
        expect(getPublishedSeriesEpisode({ ...course, sections: [{ id: 1, lessons: [
            { id: 1, media_id: 1, metadata_json: { episode_index: 17 } },
            { id: 2, media_id: 2, metadata_json: { lesson_index: 17 } },
        ] }] }, 17)).toBeUndefined();
    });
});
