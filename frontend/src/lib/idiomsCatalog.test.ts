import { describe, expect, it } from "vitest";
import { IDIOMS_CATALOG, getIdiomsCourse } from "@/lib/idiomsCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("idioms catalog", () => {
    it("contains the five reference courses in order", () => {
        expect(IDIOMS_CATALOG.map((course) => course.slug)).toEqual([
            "beckybunny-idiom-stories",
            "national-library-idiom-stories",
            "sanmiao-kids-idiom-stories",
            "youpeng-chinese-idioms",
            "dapeng-chinese-idioms",
        ]);
        expect(IDIOMS_CATALOG.map((course) => course.lessonCount)).toEqual([85, 50, 20, 5, 34]);
    });

    it("keeps similar source names in distinct courses", () => {
        expect(getIdiomsCourse("youpeng-chinese-idioms")?.title).toContain("Youpeng Chinese");
        expect(getIdiomsCourse("dapeng-chinese-idioms")?.title).toContain("大鹏说中文");
    });

    it("has a subtitle and episode label for every reference card", () => {
        for (const course of IDIOMS_CATALOG) {
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
            expect(Object.keys(course.knownLessonTitles || {})).toHaveLength(course.lessonCount);
        }
        const bunny = getIdiomsCourse("beckybunny-idiom-stories")!;
        expect(bunny.knownLessonSubtitles[1]).toBe("专心致志");
        expect(bunny.knownLessonSubtitles[85]).toBe("夸父逐日");
        expect(getPlannedLessonTitle(bunny, 10)).toBe("第10课");
        const library = getIdiomsCourse("national-library-idiom-stories")!;
        expect(library.knownLessonSubtitles[50]).toBe("沧海一粟");
        expect(getPlannedLessonTitle(library, 40)).toBe("第40课");
        const sanmiao = getIdiomsCourse("sanmiao-kids-idiom-stories")!;
        expect(sanmiao.knownLessonSubtitles[20]).toBe("抛砖引玉");
        const youpeng = getIdiomsCourse("youpeng-chinese-idioms")!;
        expect(youpeng.knownLessonSubtitles[5]).toBe("汉语常用歇后语");
    });

    it("preserves the repeated episode 19 card in the 大鹏 reference", () => {
        const dapeng = getIdiomsCourse("dapeng-chinese-idioms")!;
        expect(getPlannedLessonTitle(dapeng, 19)).toBe("第19集");
        expect(getPlannedLessonTitle(dapeng, 20)).toBe("第19集");
        expect(dapeng.knownLessonSubtitles[19]).toBe("想法 VS 看法");
        expect(dapeng.knownLessonSubtitles[20]).toBe("想法 VS 看法");
        expect(getPlannedLessonTitle(dapeng, 34)).toBe("第33集");
        expect(dapeng.knownLessonSubtitles[34]).toBe("出头");
    });
});
