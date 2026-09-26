import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FESTIVALS_CUSTOMS_CATALOG, getFestivalsCustomsCourse } from "@/lib/festivalsCustomsCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("festivals and customs catalog", () => {
    it("contains the exact reference series, images, and lesson count", () => {
        expect(FESTIVALS_CUSTOMS_CATALOG).toHaveLength(1);
        expect(FESTIVALS_CUSTOMS_CATALOG[0]).toMatchObject({
            slug: "sanmiao-wonderful-traditional-festivals",
            title: "三淼儿童官方频道",
            subtitle: "[精彩的传统节日]",
            cardSubtitle: "[精彩的传统节日]",
            coverPath: "/assets/chinverse/course-profiles/三淼儿童官方频道.jpeg",
            detailCoverPath: "/assets/chinverse/course-profiles/精彩的传统节日.jpeg",
            detailImageAspect: "square",
            lessonCount: 10,
        });
    });

    it("preserves all ten reference festivals in their numbered episode order", () => {
        const course = getFestivalsCustomsCourse("sanmiao-wonderful-traditional-festivals")!;
        expect(Object.keys(course.knownLessonTitles!)).toHaveLength(10);
        expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(10);
        expect(Array.from({ length: 10 }, (_, index) => getPlannedLessonTitle(course, index + 1))).toEqual(
            Array.from({ length: 10 }, (_, index) => `第${index + 1}集`),
        );
        expect(Object.values(course.knownLessonSubtitles)).toEqual([
            "春龙节", "清明节", "端午节", "七夕节", "中秋节", "重阳节", "腊八节", "祭灶节", "除夕节", "元宵节",
        ]);
    });

    it("uses existing reference covers", () => {
        const course = FESTIVALS_CUSTOMS_CATALOG[0];
        for (const cover of [course.coverPath, course.detailCoverPath!]) expect(existsSync(join(process.cwd(), "public", cover))).toBe(true);
    });

    it("does not invent rating or duration metadata or match unknown slugs", () => {
        const course = getFestivalsCustomsCourse("sanmiao-wonderful-traditional-festivals");
        expect(course).toBeDefined();
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(getFestivalsCustomsCourse("missing")).toBeUndefined();
        expect(getFestivalsCustomsCourse(undefined)).toBeUndefined();
    });
});
