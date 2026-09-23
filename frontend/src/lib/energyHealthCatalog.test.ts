import { describe, expect, it } from "vitest";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { ENERGY_HEALTH_CATALOG, getEnergyHealthCourse } from "@/lib/energyHealthCatalog";

describe("energy health catalog", () => {
    it("contains the two reference courses in order with exact exercise counts", () => {
        expect(ENERGY_HEALTH_CATALOG.map((course) => course.slug)).toEqual([
            "shi-heng-yi-what-is-qi-gong",
            "xue-guoxue-wang-baduanjin",
        ]);
        expect(ENERGY_HEALTH_CATALOG.map((course) => course.lessonCount)).toEqual([11, 20]);
    });

    it("uses the separate list and detail images for Baduanjin", () => {
        const baduanjin = getEnergyHealthCourse("xue-guoxue-wang-baduanjin");
        expect(getEnergyHealthCourse("shi-heng-yi-what-is-qi-gong")?.coverPath).toContain("Shi Heng Yi Online.jpeg");
        expect(baduanjin?.coverPath).toContain("学国学网.jpeg");
        expect(baduanjin?.detailCoverPath).toContain("《八段锦》.jpeg");
    });

    it("uses exercise labels without invented ratings or durations", () => {
        for (const course of ENERGY_HEALTH_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("تمرین 1");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`تمرین ${course.lessonCount}`);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });
});
