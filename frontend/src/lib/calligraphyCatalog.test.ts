import { describe, expect, it } from "vitest";
import { CALLIGRAPHY_CATALOG, getCalligraphyCourse } from "@/lib/calligraphyCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("calligraphy catalog", () => {
    it("contains the three reference courses in order with exact lesson counts", () => {
        expect(CALLIGRAPHY_CATALOG.map((course) => course.slug)).toEqual([
            "chen-zhongjian-calligraphy-beginners",
            "chen-zhongjian-ouyang-xun-structure",
            "chen-zhongjian-yan-zhenqing-duobao-pagoda",
        ]);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.lessonCount)).toEqual([14, 36, 23]);
    });

    it("uses the shared Chen Zhongjian portrait and exact course labels", () => {
        expect(CALLIGRAPHY_CATALOG.every((course) => course.coverPath === "/assets/chinverse/course-profiles/陳忠建.jpeg")).toBe(true);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.title)).toEqual(["陳忠建", "陳忠建", "陳忠建"]);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.subtitle)).toEqual([
            "零基础自学书法入门",
            "欧阳询(结构)",
            "颜真卿(多宝塔碑)",
        ]);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.cardSubtitle)).toEqual(CALLIGRAPHY_CATALOG.map((course) => course.subtitle));
    });

    it("creates generic lesson titles without inventing rating or duration metadata", () => {
        for (const course of CALLIGRAPHY_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("درس 1");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`درس ${course.lessonCount}`);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("resolves a course by slug", () => {
        expect(getCalligraphyCourse("chen-zhongjian-ouyang-xun-structure")?.lessonCount).toBe(36);
        expect(getCalligraphyCourse("missing")).toBeUndefined();
    });
});
