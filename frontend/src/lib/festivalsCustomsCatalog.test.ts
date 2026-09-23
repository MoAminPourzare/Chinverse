import { describe, expect, it } from "vitest";
import { FESTIVALS_CUSTOMS_CATALOG, getFestivalsCustomsCourse } from "@/lib/festivalsCustomsCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("festivals and customs catalog", () => {
    it("contains the exact reference series, images, and lesson count", () => {
        expect(FESTIVALS_CUSTOMS_CATALOG).toHaveLength(1);
        expect(FESTIVALS_CUSTOMS_CATALOG[0]).toMatchObject({
            slug: "sanmiao-wonderful-traditional-festivals",
            title: "三淼儿童官方频道",
            subtitle: "【精彩的传统节日】",
            coverPath: "/assets/chinverse/course-profiles/三淼儿童官方频道.jpeg",
            detailCoverPath: "/assets/chinverse/course-profiles/精彩的传统节日.jpeg",
            lessonCount: 10,
        });
    });

    it("creates numbered lessons without invented rating or duration metadata", () => {
        const course = getFestivalsCustomsCourse("sanmiao-wonderful-traditional-festivals");
        expect(course).toBeDefined();
        expect(getPlannedLessonTitle(course!, 1)).toBe("درس 1");
        expect(getPlannedLessonTitle(course!, 10)).toBe("درس 10");
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(getFestivalsCustomsCourse("missing")).toBeUndefined();
    });
});
