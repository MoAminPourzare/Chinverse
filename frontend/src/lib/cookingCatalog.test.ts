import { describe, expect, it } from "vitest";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { COOKING_CATALOG, getCookingCourse } from "@/lib/cookingCatalog";

describe("cooking catalog", () => {
    it("contains the four reference shows in order with exact episode counts", () => {
        expect(COOKING_CATALOG.map((course) => course.slug)).toEqual([
            "wanneng-gongjuren-a-wei",
            "meishi-zuojia-wang-gang",
            "lao-fan-gu",
            "zhongguo-meishi-pindao",
        ]);
        expect(COOKING_CATALOG.map((course) => course.lessonCount)).toEqual([46, 16, 21, 34]);
    });

    it("keeps separate Chinese titles, pinyin and the reference covers", () => {
        expect(getCookingCourse("wanneng-gongjuren-a-wei")?.subtitle).toBe("Wànnéng gōngjù rén ā Wěi");
        expect(getCookingCourse("meishi-zuojia-wang-gang")?.coverPath).toContain("美食作家王刚.png");
        for (const course of COOKING_CATALOG) {
            expect(course.subtitle).toBeTruthy();
            expect(course.description.length).toBeGreaterThanOrEqual(3);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("uses episode labels from the first through last planned item", () => {
        for (const course of COOKING_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("قسمت 1");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`قسمت ${course.lessonCount}`);
        }
    });
});
