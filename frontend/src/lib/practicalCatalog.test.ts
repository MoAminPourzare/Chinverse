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
        expect(PRACTICAL_CATALOG.map((course) => course.lessonCount)).toEqual([9, 48, 69]);
    });

    it("maps all nine office sentence ranges", () => {
        const office = getPracticalCourse("hoa-ngu-nam-khanh-office-sentences")!;
        expect(getPlannedLessonTitle(office, 1)).toBe("第1集");
        expect(getPlannedLessonTitle(office, 9)).toBe("第9集");
        expect(office.knownLessonSubtitles[1]).toBe("公司里常用句型 01~05");
        expect(office.knownLessonSubtitles[9]).toBe("公司里常用句型 41~45");
    });

    it("keeps eight cards for each of the six business lessons", () => {
        const business = getPracticalCourse("hoa-ngu-nam-khanh-business-chinese")!;
        expect(business.chapterCount).toBe(6);
        expect(getPlannedLessonTitle(business, 8)).toBe("第1课");
        expect(getPlannedLessonTitle(business, 9)).toBe("第2课");
        expect(business.knownLessonSubtitles[12]).toBe("3.4重点词和句型");
        expect(getPlannedLessonTitle(business, 48)).toBe("第6课");
        expect(business.knownLessonSubtitles[48]).toBe("6.8听力练习");
    });

    it("fills every Love Chinese vocabulary card through episode 69", () => {
        const love = getPracticalCourse("love-chinese-vocabulary")!;
        expect(love.knownLessonSubtitles[1]).toBe("60 Common Chinese Words about Maritime Shipping");
        expect(love.knownLessonSubtitles[69]).toBe("Learn Chinese Flower Names");
        expect(getPlannedLessonTitle(love, 10)).toBe("第10课");
        expect(getPlannedLessonTitle(love, 40)).toBe("第40课");
    });

    it("has a title and subtitle for every practical card", () => {
        for (const course of PRACTICAL_CATALOG) {
            expect(Object.keys(course.knownLessonTitles || {})).toHaveLength(course.lessonCount);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
        }
    });
});
