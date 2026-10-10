import { describe, expect, it } from "vitest";
import { SYNONYMS_CATALOG, getSynonymsCourse } from "@/lib/synonymsCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("synonyms catalog", () => {
    it("contains the three reference courses in order", () => {
        expect(SYNONYMS_CATALOG.map((course) => course.slug)).toEqual([
            "baijia-talk-hsk5-synonyms",
            "qa-mandarin-synonyms",
            "free-to-learn-chinese-synonyms",
        ]);
        expect(SYNONYMS_CATALOG.map((course) => course.lessonCount)).toEqual([20, 5, 37]);
    });

    it("keeps similar-vocabulary courses separate from other uses of the same creators", () => {
        expect(getSynonymsCourse("baijia-talk-hsk5-synonyms")?.title).toContain("HSK5");
        expect(getSynonymsCourse("baijia-talk-grammar")).toBeUndefined();
    });

    it("maps every reference card to an episode label and topic", () => {
        for (const course of SYNONYMS_CATALOG) {
            expect(Object.keys(course.knownLessonTitles || {})).toHaveLength(course.lessonCount);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`第${course.lessonCount}集`);
        }
        const baijia = getSynonymsCourse("baijia-talk-hsk5-synonyms")!;
        expect(baijia.knownLessonSubtitles[1]).toBe("保留-保存");
        expect(baijia.knownLessonSubtitles[20]).toBe("促使-达到-导致");
        const qa = getSynonymsCourse("qa-mandarin-synonyms")!;
        expect(qa.knownLessonSubtitles[5]).toBe("“骄傲”和“自豪”的区别");
    });

    it("preserves the repeated 临时 / 暂时 topic at positions 28 and 37", () => {
        const free = getSynonymsCourse("free-to-learn-chinese-synonyms")!;
        expect(free.knownLessonSubtitles[28]).toBe("学会“临时”和“暂时”的区别");
        expect(free.knownLessonSubtitles[37]).toBe(free.knownLessonSubtitles[28]);
        expect(free.knownLessonSubtitles[34]).toContain("食用");
    });
});
