import { describe, expect, it } from "vitest";
import { CLASSICAL_CATALOG, getClassicalCourse } from "@/lib/classicalCatalog";

describe("classical Chinese catalog", () => {
    it("contains the single eight-lesson reference course", () => {
        expect(CLASSICAL_CATALOG.map((course) => [course.slug, course.lessonCount])).toEqual([
            ["baijia-talk-classical-chinese-introduction", 8],
        ]);
    });

    it("does not mix classical Chinese with the classical poetry category", () => {
        expect(getClassicalCourse("baijia-talk-classical-chinese-introduction")?.title).toContain("古代汉语入门");
        expect(getClassicalCourse("classical-poetry")).toBeUndefined();
    });
});
