import { describe, expect, it } from "vitest";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { getTeaCultureCourse, TEA_CULTURE_CATALOG } from "@/lib/teaCultureCatalog";

describe("tea culture catalog", () => {
    it("contains the exact reference course and lesson count", () => {
        expect(TEA_CULTURE_CATALOG).toHaveLength(1);
        expect(TEA_CULTURE_CATALOG[0]).toMatchObject({
            slug: "yinsong8-chinese-tea-culture",
            title: "yinsong8_com",
            subtitle: "（中國茶文化）",
            coverPath: "/assets/chinverse/course-profiles/yinsong8_com.jpeg",
            lessonCount: 43,
        });
    });

    it("creates numbered lessons without invented rating or duration metadata", () => {
        const course = getTeaCultureCourse("yinsong8-chinese-tea-culture");
        expect(course).toBeDefined();
        expect(getPlannedLessonTitle(course!, 1)).toBe("درس 1");
        expect(getPlannedLessonTitle(course!, 43)).toBe("درس 43");
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(getTeaCultureCourse("missing")).toBeUndefined();
    });
});
