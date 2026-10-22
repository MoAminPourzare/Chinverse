import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/courses";
import { CULTURE_TEXTS_CATALOG, getCultureTextsCourse } from "@/lib/cultureTextsCatalog";
import { CULTURE_TEXT_LESSONS } from "@/lib/cultureTextsLessonTopics";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

describe("culture texts catalog", () => {
    it("contains the six reference collections in order with exact lesson counts", () => {
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.slug)).toEqual([
            "rabbit-sanzijing",
            "rabbit-dizigui",
            "rabbit-qianziwen",
            "xue-guoxue-baijiaxing-recitation",
            "national-library-baijiaxing",
            "baijia-talk-tao-te-ching-analysis",
        ]);
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.lessonCount)).toEqual([63, 34, 31, 5, 48, 52]);
        expect(CULTURE_TEXTS_CATALOG.reduce((total, course) => total + course.lessonCount, 0)).toBe(233);
    });

    it("uses shared list portraits and distinct detail images exactly where shown", () => {
        const rabbitCourses = CULTURE_TEXTS_CATALOG.slice(0, 3);
        expect(rabbitCourses.every((course) => course.coverPath.endsWith("兔小贝Beckybunny.jpeg"))).toBe(true);
        expect(rabbitCourses.map((course) => course.detailCoverPath)).toEqual([
            "/assets/chinverse/course-profiles/三字经.jpeg",
            "/assets/chinverse/course-profiles/弟子规.jpeg",
            "/assets/chinverse/course-profiles/千字文.jpeg",
        ]);
        expect(getCultureTextsCourse("xue-guoxue-baijiaxing-recitation")?.detailCoverPath).toContain("经典诵读·百家姓.jpeg");
        expect(getCultureTextsCourse("national-library-baijiaxing")?.detailCoverPath).toContain("百家姓.jpeg");
        expect(getCultureTextsCourse("baijia-talk-tao-te-ching-analysis")?.detailCoverPath).toContain("道德经.jpeg");
        expect(CULTURE_TEXTS_CATALOG.slice(0, 5).every((course) => course.detailImageAspect === "video")).toBe(true);
        expect(CULTURE_TEXTS_CATALOG.at(-1)?.detailImageAspect).toBe("square");
        for (const course of CULTURE_TEXTS_CATALOG) {
            for (const cover of [course.coverPath, course.detailCoverPath!]) expect(existsSync(join(process.cwd(), "public", cover))).toBe(true);
        }
    });

    it("preserves separate card and detail labels from the reference", () => {
        expect(CULTURE_TEXTS_CATALOG[0]).toMatchObject({ title: "兔小贝国学", cardTitle: "兔小贝", subtitle: "《三字经》" });
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.cardSubtitle)).toEqual(CULTURE_TEXTS_CATALOG.map((course) => course.subtitle));
        expect(CULTURE_TEXTS_CATALOG.at(-1)?.introductionHeading).toBe("معرفی دوره:");
    });

    it("keeps reference numbering and complete topics without invented ratings or durations", () => {
        expect(CULTURE_TEXTS_CATALOG.map((course) => getPlannedLessonTitle(course, 1))).toEqual(["第1集", "第1集", "第1集", "第1节", "第1讲", "第1课"]);
        expect(CULTURE_TEXTS_CATALOG.map((course) => getPlannedLessonTitle(course, course.lessonCount))).toEqual(["第62集", "第34集", "第31集", "第5节", "第48讲", "第11课"]);
        for (const course of CULTURE_TEXTS_CATALOG) {
            expect(Object.keys(course.knownLessonTitles!)).toHaveLength(course.lessonCount);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
            expect(Object.values(course.knownLessonSubtitles).every((topic) => topic.trim())).toBe(true);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("preserves the repeated Sanzijing row and the surname label exceptions", () => {
        const sanzijing = CULTURE_TEXT_LESSONS["rabbit-sanzijing"];
        expect(sanzijing[33]).toEqual({ title: "第34集", topic: "经子通，读诸史" });
        expect(sanzijing[34]).toEqual(sanzijing[33]);
        expect(sanzijing[35].title).toBe("第35集");
        const surnames = CULTURE_TEXT_LESSONS["national-library-baijiaxing"];
        expect(surnames[43]).toEqual({ title: "第44课", topic: "姜姓" });
        expect(surnames[38].topic).toBe(surnames[47].topic);
        expect(surnames[20].topic).toBe("刘姓");
        expect(surnames[36].topic).toBe("海姓");
    });

    it("expands the eleven Daodejing chapters into all 52 reference parts", () => {
        const course = getCultureTextsCourse("baijia-talk-tao-te-ching-analysis")!;
        expect(course.chapterCount).toBe(11);
        expect(course.countSummary).toBe("۱۱ درس · ۵۲ بخش");
        expect(Array.from({ length: 11 }, (_, chapter) => Object.values(course.knownLessonTitles!).filter((title) => title === `第${chapter + 1}课`).length)).toEqual([8, 7, 6, 2, 2, 6, 7, 3, 3, 7, 1]);
        expect(course.knownLessonSubtitles[1]).toBe("1.1 课程的内容定位和方法定位");
        expect(course.knownLessonSubtitles[52]).toBe("11 显质第八十一及课程总结");
        expect(CULTURE_TEXTS_CATALOG[0]).toMatchObject({ chapterCount: 62, countSummary: "۶۲ درس · ۶۳ بخش" });
    });

    it("retains each collection's reference endpoints", () => {
        expect(CULTURE_TEXTS_CATALOG.map((course) => course.knownLessonSubtitles[course.lessonCount])).toEqual([
            "勤有功，戏无益", "房室清", "指薪修祜", "公孙仲孙", "干姓", "11 显质第八十一及课程总结",
        ]);
        expect(getCultureTextsCourse("missing")).toBeUndefined();
    });
});

describe("culture texts playback identity", () => {
    const course: Course = { id: 90, title: "兔小贝国学", description: "", level: "culture-texts" };

    it("uses distinct part positions for the duplicated episode label", () => {
        const published = { ...course, sections: [{ id: 1, lessons: [
            { id: 134, media_id: 1, metadata_json: { lesson_index: 34 } },
            { id: 135, media_id: 2, metadata_json: { episode_index: 35 } },
        ] }] };
        expect(getPublishedSeriesEpisode(published, 34)?.id).toBe(134);
        expect(getPublishedSeriesEpisode(published, 35)?.id).toBe(135);
    });

    it("requires media and unique explicit positions rather than matching chapter titles", () => {
        for (const lessons of [
            [{ id: 1, title: "第34集", media_id: 1 }],
            [{ id: 1, media_id: null, metadata_json: { lesson_index: 34 } }],
            [1, 2].map((id) => ({ id, media_id: id, metadata_json: { lesson_index: 34 } })),
        ]) expect(getPublishedSeriesEpisode({ ...course, sections: [{ id: 1, lessons }] }, 34)).toBeUndefined();
    });
});
