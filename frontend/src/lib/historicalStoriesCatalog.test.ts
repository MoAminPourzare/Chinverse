import { describe, expect, it } from "vitest";
import { getHistoricalStoriesCourse, HISTORICAL_STORIES_CATALOG } from "@/lib/historicalStoriesCatalog";
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

    it("creates numbered lessons without invented rating or duration metadata", () => {
        const course = getHistoricalStoriesCourse("chinese-tales-with-xiao-lin");
        expect(course).toBeDefined();
        expect(getPlannedLessonTitle(course!, 1)).toBe("درس 1");
        expect(getPlannedLessonTitle(course!, 18)).toBe("درس 18");
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(getHistoricalStoriesCourse("missing")).toBeUndefined();
    });
});
