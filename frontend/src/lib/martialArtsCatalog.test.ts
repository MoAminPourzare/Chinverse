import { describe, expect, it } from "vitest";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { MARTIAL_ARTS_CATALOG, getMartialArtsCourse } from "@/lib/martialArtsCatalog";

describe("martial arts catalog", () => {
    it("contains the three reference courses in order with exact episode counts", () => {
        expect(MARTIAL_ARTS_CATALOG.map((course) => course.slug)).toEqual([
            "xue-guoxue-wang-eight-form-taijiquan",
            "lee-wushu-basic-staff",
            "taichi-wei-kung-fu-fan",
        ]);
        expect(MARTIAL_ARTS_CATALOG.map((course) => course.lessonCount)).toEqual([13, 10, 13]);
    });

    it("uses the separate list and detail images shown in the reference", () => {
        const taiji = getMartialArtsCourse("xue-guoxue-wang-eight-form-taijiquan");
        expect(taiji?.coverPath).toContain("学国学网.jpeg");
        expect(taiji?.detailCoverPath).toContain("八式太极拳.jpeg");
        expect(getMartialArtsCourse("lee-wushu-basic-staff")?.coverPath).toContain("channels4_profile.png");
        expect(getMartialArtsCourse("taichi-wei-kung-fu-fan")?.coverPath).toContain("fR3W0dty9.jpeg");
    });

    it("uses episode labels without invented ratings or durations", () => {
        for (const course of MARTIAL_ARTS_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("قسمت 1");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`قسمت ${course.lessonCount}`);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });
});
