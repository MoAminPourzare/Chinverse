import { describe, expect, it } from "vitest";
import { CLASSICAL_CATALOG, getClassicalCourse } from "@/lib/classicalCatalog";

describe("classical Chinese catalog", () => {
    it("lists every visible section across the eight chapters", () => {
        expect(CLASSICAL_CATALOG.map((course) => [course.slug, course.chapterCount, course.lessonCount])).toEqual([
            ["baijia-talk-classical-chinese-introduction", 8, 41],
        ]);

        const course = CLASSICAL_CATALOG[0];
        expect(Object.keys(course.knownLessonTitles ?? {})).toHaveLength(41);
        expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(41);
        expect(course.knownLessonTitles?.[1]).toBe("第1课");
        expect(course.knownLessonSubtitles[1]).toBe("1.1 古汉语概说");
        expect(course.knownLessonTitles?.[41]).toBe("第8课");
        expect(course.knownLessonSubtitles[41]).toBe("8.5 古汉语常识（七）");
        expect([course.knownLessonSubtitles[38], course.knownLessonSubtitles[39]]).toEqual([
            "8.3 狼（三）",
            "8.3 狼（三）",
        ]);
    });

    it("does not mix classical Chinese with the classical poetry category", () => {
        expect(getClassicalCourse("baijia-talk-classical-chinese-introduction")?.title).toContain("古代汉语入门");
        expect(getClassicalCourse("classical-poetry")).toBeUndefined();
    });
});
