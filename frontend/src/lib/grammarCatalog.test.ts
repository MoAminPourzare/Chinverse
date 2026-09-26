import { describe, expect, it } from "vitest";
import { GRAMMAR_CATALOG, getGrammarCourse } from "@/lib/grammarCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("grammar catalog", () => {
    it("matches the four reference cards and lesson counts", () => {
        expect(GRAMMAR_CATALOG.map((course) => course.slug)).toEqual([
            "chinese-zero-to-hero-grammar",
            "baijia-talk-grammar",
            "yoyo-chinese-grammar",
            "grace-mandarin-grammar",
        ]);
        expect(GRAMMAR_CATALOG.map((course) => course.lessonCount)).toEqual([7, 29, 10, 7]);
    });

    it("keeps the course identities distinct across categories", () => {
        expect(getGrammarCourse("grace-mandarin-grammar")?.title).toBe("Grace Mandarin (Grammar)");
        expect(getGrammarCourse("grace-mandarin-character")).toBeUndefined();
    });

    it("shows the seven HSK grammar collections with their reference counts and images", () => {
        const zero = getGrammarCourse("chinese-zero-to-hero-grammar")!;
        expect(zero.countSummary).toBe("7 سطح · 175 درس");
        expect(getPlannedLessonTitle(zero, 1)).toBe("HSK1 Grammar");
        expect(getPlannedLessonTitle(zero, 7)).toBe("HSK7-9 Grammar");
        expect(Object.values(zero.knownLessonSubtitles)).toEqual(["23课", "29课", "31课", "34课", "32课", "21课", "5课"]);
        expect(Object.values(zero.lessonGroupCounts || {}).reduce((sum, count) => sum + count, 0)).toBe(175);
        expect(Object.keys(zero.knownLessonThumbnails || {})).toHaveLength(7);
    });

    it("aligns repeated 百家Talk chapter labels with each grammar topic", () => {
        const talk = getGrammarCourse("baijia-talk-grammar")!;
        expect(talk.chapterCount).toBe(7);
        expect(getPlannedLessonTitle(talk, 1)).toBe("第1课");
        expect(talk.knownLessonSubtitles[1]).toBe("1.1 能愿动词1：想、要");
        expect(getPlannedLessonTitle(talk, 25)).toBe("第6课");
        expect(talk.knownLessonSubtitles[29]).toBe("7.4 疑问代词表示任指");
        expect(Object.keys(talk.knownLessonSubtitles)).toHaveLength(talk.lessonCount);
    });

    it("includes every visible Yoyo and Grace lesson title", () => {
        const yoyo = getGrammarCourse("yoyo-chinese-grammar")!;
        const grace = getGrammarCourse("grace-mandarin-grammar")!;
        expect(yoyo.knownLessonSubtitles[10]).toContain("些 (xiē)");
        expect(grace.knownLessonSubtitles[7]).toBe("When 了 (le) is NOT Needed for Completed Actions in Chinese");
        expect(Object.keys(yoyo.knownLessonSubtitles)).toHaveLength(yoyo.lessonCount);
        expect(Object.keys(grace.knownLessonSubtitles)).toHaveLength(grace.lessonCount);
    });
});
