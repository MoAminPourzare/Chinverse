import { describe, expect, it } from "vitest";
import { PRACTICAL_CATALOG, getPracticalCourse } from "@/lib/practicalCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("practical Chinese catalog", () => {
    it("contains the three reference courses in order", () => {
        expect(PRACTICAL_CATALOG.map((course) => course.slug)).toEqual([
            "hoa-ngu-nam-khanh-office-sentences",
            "hoa-ngu-nam-khanh-business-chinese",
            "love-chinese-vocabulary",
        ]);
        expect(PRACTICAL_CATALOG.map((course) => course.lessonCount)).toEqual([9, 6, 69]);
    });

    it("preserves only the first visible lesson label", () => {
        const course = getPracticalCourse("hoa-ngu-nam-khanh-office-sentences")!;
        expect(getPlannedLessonTitle(course, 1)).toBe("第1集");
        expect(course.knownLessonSubtitles[1]).toBe("公司里常用句型 01~05");
        expect(getPlannedLessonTitle(course, 2)).toBe("第2课");
    });
});
