import { describe, expect, it } from "vitest";
import { VLOGS_CATALOG, getVlogsCourse } from "@/lib/vlogsCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("vlogs catalog", () => {
    it("contains five reference courses in order", () => {
        expect(VLOGS_CATALOG.map((course) => course.slug)).toEqual([
            "zhangkai-chinese-vlog",
            "hongcha-chinese-vlog",
            "free-to-learn-chinese-vlog",
            "hi-chinese-vlog",
            "zhangkai-chinese-short-videos",
        ]);
        expect(VLOGS_CATALOG.map((course) => course.lessonCount)).toEqual([55, 20, 14, 19, 22]);
    });

    it("keeps the two Zhangkai series separate", () => {
        expect(getVlogsCourse("zhangkai-chinese-vlog")?.coverPath).toBe(getVlogsCourse("zhangkai-chinese-short-videos")?.coverPath);
        expect(getVlogsCourse("zhangkai-chinese-vlog")?.lessonCount).not.toBe(getVlogsCourse("zhangkai-chinese-short-videos")?.lessonCount);
    });

    it("fills every visible vlog card with its episode label and subtitle", () => {
        for (const course of VLOGS_CATALOG) {
            expect(Object.keys(course.knownLessonTitles || {})).toHaveLength(course.lessonCount);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
        }
        const zhangkai = getVlogsCourse("zhangkai-chinese-vlog")!;
        expect(zhangkai.knownLessonSubtitles[1]).toBe("No Vocab Memorization, No Grammar Study");
        expect(zhangkai.knownLessonSubtitles[55]).toBe("Learn Chinese Through Chinese New Year");
        expect(zhangkai.knownLessonSubtitles[18]).toBe(zhangkai.knownLessonSubtitles[33]);
        expect(getPlannedLessonTitle(zhangkai, 10)).toBe("第10课");
        expect(getPlannedLessonTitle(zhangkai, 40)).toBe("第40课");
    });

    it("preserves the other four course endings and short-video numbering", () => {
        expect(getVlogsCourse("hongcha-chinese-vlog")?.knownLessonSubtitles[20]).toContain("CAR parts in Chinese");
        expect(getVlogsCourse("free-to-learn-chinese-vlog")?.knownLessonSubtitles[14]).toBe("带你过中国新年");
        expect(getVlogsCourse("hi-chinese-vlog")?.knownLessonSubtitles[19]).toContain("Fight Against the Coronavirus");
        const shorts = getVlogsCourse("zhangkai-chinese-short-videos")!;
        expect(getPlannedLessonTitle(shorts, 10)).toBe("第10课");
        expect(shorts.knownLessonSubtitles[22]).toBe("常用动词9");
    });
});
