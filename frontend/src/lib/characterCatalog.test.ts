import { describe, expect, it } from "vitest";
import { CHARACTER_CATALOG, getCharacterCourse } from "@/lib/characterCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("character catalog", () => {
    it("contains the three reference courses in order", () => {
        expect(CHARACTER_CATALOG.map((course) => course.slug)).toEqual([
            "yoyo-chinese-character", "grace-mandarin-character", "baijia-talk-hanzi",
        ]);
        expect(CHARACTER_CATALOG.map((course) => course.lessonCount)).toEqual([20, 7, 8]);
    });

    it("preserves the known lesson labels without inventing later titles", () => {
        const talk = getCharacterCourse("baijia-talk-hanzi")!;
        expect(getPlannedLessonTitle(talk, 1)).toBe("引言");
        expect(getPlannedLessonTitle(talk, 2)).toBe("第2课");
        expect(getCharacterCourse("grace-mandarin-character")?.knownLessonSubtitles[1]).toBe("How to learn Chinese");
    });
});
