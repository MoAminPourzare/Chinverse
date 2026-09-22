import { describe, expect, it } from "vitest";
import { getHskCourse, getHskLessonTitle, HSK_CATALOG } from "@/lib/hskCatalog";

describe("HSK catalog", () => {
    it("contains the nine ordered standard-course levels", () => {
        expect(HSK_CATALOG).toHaveLength(9);
        expect(HSK_CATALOG.map((course) => course.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(new Set(HSK_CATALOG.map((course) => course.slug)).size).toBe(9);
        expect(HSK_CATALOG.every((course) => course.coverPath.startsWith("/assets/chinverse/course-profiles/HSK/"))).toBe(true);
    });

    it("keeps the upper and lower book lesson numbering continuous", () => {
        const upper = getHskCourse("hsk-4-shang");
        const lower = getHskCourse("hsk-4-xia");

        expect(upper && getHskLessonTitle(upper, 0)).toBe("第1课（上）");
        expect(upper && getHskLessonTitle(upper, 9)).toBe("第10课（上）");
        expect(lower && getHskLessonTitle(lower, 0)).toBe("第11课（下）");
        expect(lower && getHskLessonTitle(lower, 9)).toBe("第20课（下）");
    });
});
