import { describe, expect, it } from "vitest";
import { getPronunciationCourse, getPronunciationLessonTitle, PRONUNCIATION_CATALOG } from "@/lib/pronunciationCatalog";

describe("pronunciation catalog", () => {
    it("keeps the three reference courses in their intended order and size", () => {
        expect(PRONUNCIATION_CATALOG.map((course) => course.slug)).toEqual([
            "yoyo-chinese", "grace-mandarin", "yang-mandarin",
        ]);
        expect(PRONUNCIATION_CATALOG.map((course) => course.lessonCount)).toEqual([27, 14, 19]);
        expect(getPronunciationCourse("yoyo-chinese")?.practiceCount).toBe(4);
    });

    it("uses only lesson names confirmed by the reference", () => {
        expect(getPronunciationCourse("yoyo-chinese")?.knownLessonSubtitles[1]).toBe("What is Pinyin?");
        expect(getPronunciationCourse("grace-mandarin")?.knownLessonSubtitles[2]).toBe('Master Chinese "zh ch sh r"');
        expect(getPronunciationLessonTitle(19)).toBe("第19课");
    });
});
