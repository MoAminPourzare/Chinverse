import { describe, expect, it } from "vitest";
import { getPronunciationCourse, getPronunciationLessonTitle, PRONUNCIATION_CATALOG } from "@/lib/pronunciationCatalog";
import { getPlannedItemCount, getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("pronunciation catalog", () => {
    it("keeps the three reference courses in their intended order and size", () => {
        expect(PRONUNCIATION_CATALOG.map((course) => course.slug)).toEqual([
            "yoyo-chinese", "grace-mandarin", "yang-mandarin",
        ]);
        expect(PRONUNCIATION_CATALOG.map((course) => course.lessonCount)).toEqual([27, 14, 19]);
        expect(getPronunciationCourse("yoyo-chinese")?.practiceCount).toBe(4);
    });

    it("keeps every screenshot title in its displayed position", () => {
        const yoyo = getPronunciationCourse("yoyo-chinese")!;
        const grace = getPronunciationCourse("grace-mandarin")!;
        const yang = getPronunciationCourse("yang-mandarin")!;

        expect(yoyo.knownLessonSubtitles[1]).toBe("What is Pinyin?");
        expect(yoyo.knownLessonSubtitles[24]).toBe("Comprehensive Review–Part 3");
        expect(getPlannedLessonTitle(yoyo, 25)).toBe("第24课");
        expect(yoyo.knownLessonSubtitles[25]).toBe("Comprehensive Review–Part 4");
        expect(getPlannedItemCount(yoyo)).toBe(31);
        expect(getPlannedLessonTitle(yoyo, 28)).toBe("练习1");
        expect(yoyo.knownLessonSubtitles[31]).toBe("4nd Tone Combinations");
        expect(grace.knownLessonSubtitles[2]).toBe('Master Chinese "zh ch sh r"');
        expect(yang.knownLessonSubtitles[19]).toBe("Singing Chinese song--I will be okay");
        for (const course of PRONUNCIATION_CATALOG) {
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(getPlannedItemCount(course));
        }
        expect(getPronunciationLessonTitle(19)).toBe("第19课");
    });
});
