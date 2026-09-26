import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getHistoricalStoriesCourse, HISTORICAL_STORIES_CATALOG } from "@/lib/historicalStoriesCatalog";
import { HISTORICAL_STORIES_LESSON_TOPICS } from "@/lib/historicalStoriesLessonTopics";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("historical stories catalog", () => {
    it("contains the exact reference series and lesson count", () => {
        expect(HISTORICAL_STORIES_CATALOG).toHaveLength(1);
        expect(HISTORICAL_STORIES_CATALOG[0]).toMatchObject({
            slug: "chinese-tales-with-xiao-lin",
            title: "Chinese Tales with Xiao Lin",
            coverPath: "/assets/chinverse/course-profiles/Chinese Tales with Xiao Lin.jpeg",
            lessonCount: 18,
        });
    });

    it("numbers every episode and supplies all eighteen reference topics", () => {
        const course = getHistoricalStoriesCourse("chinese-tales-with-xiao-lin")!;
        expect(HISTORICAL_STORIES_LESSON_TOPICS).toHaveLength(18);
        expect(Object.keys(course.knownLessonTitles!)).toHaveLength(18);
        expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(18);
        expect(Array.from({ length: 18 }, (_, index) => getPlannedLessonTitle(course, index + 1))).toEqual(
            Array.from({ length: 18 }, (_, index) => `第${index + 1}集`),
        );
        expect(Object.values(course.knownLessonSubtitles).every((topic) => topic.trim() && topic.includes(" | "))).toBe(true);
    });

    it("preserves mixed-language reference titles, punctuation and spelling", () => {
        const topics = HISTORICAL_STORIES_CATALOG[0].knownLessonSubtitles;
        expect(topics[1]).toBe("The Bird Who Longed for the Sea | 想回大海的鸟");
        expect(topics[7]).toBe("The Schoolar in The Goose Cage | 鹅笼书生");
        expect(topics[10]).toBe("The Emperor's favorite food was actually...?! | 天底下最美味的食物");
        expect(topics[14]).toBe('China\'s "Reincarnation Village" Mystery | 坪阳再生人');
        expect(topics[17]).toBe("Miscellaneous Morsels from Youyang | 酉阳杂俎");
        expect(topics[18]).toBe("A Basket of Moonlight? | 一篮月光");
    });

    it("uses an existing reference cover", () => {
        expect(existsSync(join(process.cwd(), "public", HISTORICAL_STORIES_CATALOG[0].coverPath))).toBe(true);
    });

    it("does not invent rating or duration metadata or match unknown slugs", () => {
        const course = getHistoricalStoriesCourse("chinese-tales-with-xiao-lin");
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(getHistoricalStoriesCourse("missing")).toBeUndefined();
        expect(getHistoricalStoriesCourse(undefined)).toBeUndefined();
    });
});
