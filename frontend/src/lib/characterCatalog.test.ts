import { describe, expect, it } from "vitest";
import { CHARACTER_CATALOG, getCharacterCourse } from "@/lib/characterCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("character catalog", () => {
    it("contains the three reference courses in order", () => {
        expect(CHARACTER_CATALOG.map((course) => course.slug)).toEqual([
            "yoyo-chinese-character", "grace-mandarin-character", "baijia-talk-hanzi",
        ]);
        expect(CHARACTER_CATALOG.map((course) => course.lessonCount)).toEqual([20, 7, 34]);
        expect(getCharacterCourse("baijia-talk-hanzi")?.chapterCount).toBe(8);
    });

    it("keeps each screenshot card's chapter label and topic", () => {
        const yoyo = getCharacterCourse("yoyo-chinese-character")!;
        const grace = getCharacterCourse("grace-mandarin-character")!;
        const talk = getCharacterCourse("baijia-talk-hanzi")!;
        expect(getPlannedLessonTitle(talk, 1)).toBe("引言");
        expect(getPlannedLessonTitle(talk, 2)).toBe("第1课");
        expect(talk.knownLessonSubtitles[2]).toBe("1.1 汉字的性质");
        expect(getPlannedLessonTitle(talk, 25)).toBe("第5课");
        expect(talk.knownLessonSubtitles[25]).toBe("5.8 “爱上汉字”之《三十六个字》");
        expect(getPlannedLessonTitle(talk, 34)).toBe("第8课");
        expect(talk.knownLessonSubtitles[34]).toBe("8.2 《文字蒙求》及王筠的识字教育理念");
        expect(yoyo.knownLessonSubtitles[20]).toBe("Review for Lessons 15-19");
        expect(grace.knownLessonSubtitles[7]).toBe("The ULTIMATE Guide to Learning Chinese Characters");
        expect(Object.keys(yoyo.knownLessonSubtitles)).toHaveLength(yoyo.lessonCount);
        expect(Object.keys(grace.knownLessonSubtitles)).toHaveLength(grace.lessonCount);
        expect(Object.keys(talk.knownLessonSubtitles)).toHaveLength(talk.lessonCount);
    });
});
