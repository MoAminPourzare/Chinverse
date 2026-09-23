import { describe, expect, it } from "vitest";
import { CULTURE_TEXTS_CATALOG, getCultureTextsCourse } from "@/lib/cultureTextsCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("culture texts catalog", () => {
    it("contains the six reference collections in order with exact lesson counts", () => {
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.slug)).toEqual([
            "rabbit-sanzijing",
            "rabbit-dizigui",
            "rabbit-qianziwen",
            "xue-guoxue-baijiaxing-recitation",
            "national-library-baijiaxing",
            "baijia-talk-tao-te-ching-analysis",
        ]);
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.lessonCount)).toEqual([62, 34, 31, 5, 48, 11]);
    });

    it("uses shared list portraits and distinct detail images exactly where shown", () => {
        const rabbitCourses = CULTURE_TEXTS_CATALOG.slice(0, 3);
        expect(rabbitCourses.every((course) => course.coverPath.endsWith("兔小贝Beckybunny.jpeg"))).toBe(true);
        expect(rabbitCourses.map((course) => course.detailCoverPath)).toEqual([
            "/assets/chinverse/course-profiles/三字经.jpeg",
            "/assets/chinverse/course-profiles/弟子规.jpeg",
            "/assets/chinverse/course-profiles/千字文.jpeg",
        ]);
        expect(getCultureTextsCourse("xue-guoxue-baijiaxing-recitation")?.detailCoverPath).toContain("经典诵读·百家姓.jpeg");
        expect(getCultureTextsCourse("national-library-baijiaxing")?.detailCoverPath).toContain("百家姓.jpeg");
        expect(getCultureTextsCourse("baijia-talk-tao-te-ching-analysis")?.detailCoverPath).toContain("道德经.jpeg");
        expect(CULTURE_TEXTS_CATALOG.every((course) => course.detailImageAspect === "video")).toBe(true);
    });

    it("preserves separate card and detail labels from the reference", () => {
        expect(CULTURE_TEXTS_CATALOG[0]).toMatchObject({ title: "兔小贝国学", cardTitle: "兔小贝", subtitle: "《三字经》" });
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.cardSubtitle)).toEqual(CULTURE_TEXTS_CATALOG.map((course) => course.subtitle));
        expect(CULTURE_TEXTS_CATALOG.at(-1)?.introductionHeading).toBe("معرفی دوره:");
    });

    it("creates numbered lessons without invented rating or duration metadata", () => {
        for (const course of CULTURE_TEXTS_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("درس 1");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`درس ${course.lessonCount}`);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });
});
