import { describe, expect, it } from "vitest";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { TOPIC_TALKS_CATALOG, getTopicTalksCourse } from "@/lib/topicTalksCatalog";

describe("topic talks catalog", () => {
    it("contains the three reference collections in order with exact talk counts", () => {
        expect(TOPIC_TALKS_CATALOG.map((course) => course.slug)).toEqual([
            "dr-yuni-xia",
            "jishi-shuo",
            "documentary-literature-hall",
        ]);
        expect(TOPIC_TALKS_CATALOG.map((course) => course.lessonCount)).toEqual([106, 44, 21]);
    });

    it("keeps the reference images and complete descriptions", () => {
        expect(getTopicTalksCourse("dr-yuni-xia")?.coverPath).toContain("两娃妈夏博士Dr. Yuni Xia.jpeg");
        for (const course of TOPIC_TALKS_CATALOG) {
            expect(course.description.length).toBeGreaterThanOrEqual(3);
            expect(course.audience.length).toBeGreaterThanOrEqual(3);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("uses talk labels throughout every planned collection", () => {
        for (const course of TOPIC_TALKS_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("گفتار 1");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`گفتار ${course.lessonCount}`);
        }
    });
});
