import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/courses";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { getTeaCultureCourse, TEA_CULTURE_CATALOG } from "@/lib/teaCultureCatalog";
import { TEA_CULTURE_LESSONS } from "@/lib/teaCultureLessonTopics";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

describe("tea culture catalog", () => {
    it("contains the exact reference course and lesson count", () => {
        expect(TEA_CULTURE_CATALOG).toHaveLength(1);
        expect(TEA_CULTURE_CATALOG[0]).toMatchObject({
            slug: "yinsong8-chinese-tea-culture",
            title: "yinsong8_com",
            subtitle: "（中國茶文化）",
            coverPath: "/assets/chinverse/course-profiles/yinsong8_com.jpeg",
            lessonCount: 58,
            chapterCount: 43,
            countSummary: "۴۳ درس · ۵۸ بخش",
        });
        expect(existsSync(join(process.cwd(), "public", TEA_CULTURE_CATALOG[0].coverPath))).toBe(true);
    });

    it("creates numbered lessons without invented rating or duration metadata", () => {
        const course = getTeaCultureCourse("yinsong8-chinese-tea-culture");
        expect(course).toBeDefined();
        expect(getPlannedLessonTitle(course!, 1)).toBe("第1课");
        expect(getPlannedLessonTitle(course!, 58)).toBe("第43课");
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(getTeaCultureCourse("missing")).toBeUndefined();
    });

    it("covers all 43 chapters and retains every multipart row", () => {
        const chapters = TEA_CULTURE_LESSONS.map((lesson) => lesson.chapter);
        expect([...new Set(chapters)]).toEqual(Array.from({ length: 43 }, (_, index) => index + 1));
        const multipart = [5, 6, 8, 9, 12, 13, 26, 32, 34, 37, 38, 42];
        expect(multipart.map((chapter) => chapters.filter((value) => value === chapter).length)).toEqual([2, 3, 2, 2, 2, 3, 2, 3, 2, 2, 2, 2]);
        const course = TEA_CULTURE_CATALOG[0];
        expect(Object.keys(course.knownLessonTitles!)).toHaveLength(58);
        expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(58);
        expect(Object.values(course.knownLessonSubtitles).every((topic) => topic.trim())).toBe(true);
    });

    it("keeps the reference boundaries and duplicate lesson 32 upper parts", () => {
        const course = TEA_CULTURE_CATALOG[0];
        expect(course.knownLessonSubtitles[1]).toBe("课程简介");
        expect(course.knownLessonSubtitles[58]).toBe("中国茶往何处去");
        expect([41, 42, 43].map((position) => getPlannedLessonTitle(course, position))).toEqual(["第32课", "第32课", "第32课"]);
        expect([41, 42, 43].map((position) => course.knownLessonSubtitles[position])).toEqual(["茶文学概述（上）", "茶文学概述（上）", "茶文学概述（下）"]);
        expect([7, 8, 9].map((position) => course.knownLessonSubtitles[position])).toEqual(["饮茶法的演变（上）", "饮茶法的演变（中）", "饮茶法的演变（下）"]);
        expect(course.knownLessonSubtitles[39]).toBe("茶之用情 不易用茶情景");
    });
});

describe("tea culture multipart playback", () => {
    const course: Course = { id: 80, title: "yinsong8_com", description: "", level: "tea-culture" };

    it("links identical reference labels by their distinct row positions", () => {
        const published = { ...course, sections: [{ id: 1, lessons: [
            { id: 141, media_id: 1, metadata_json: { lesson_index: 41 } },
            { id: 142, media_id: 2, metadata_json: { episode_index: 42 } },
            { id: 158, media_id: 3, metadata_json: { lesson_index: 58 } },
        ] }] };
        expect(getPublishedSeriesEpisode(published, 41)?.id).toBe(141);
        expect(getPublishedSeriesEpisode(published, 42)?.id).toBe(142);
        expect(getPublishedSeriesEpisode(published, 58)?.id).toBe(158);
    });

    it("leaves chapter-only, missing-media and ambiguous parts unlinked", () => {
        for (const lessons of [
            [{ id: 141, media_id: 1, metadata_json: { chapter_index: 32 } }],
            [{ id: 141, media_id: null, metadata_json: { lesson_index: 41 } }],
            [141, 142].map((id) => ({ id, media_id: id, metadata_json: { lesson_index: 41 } })),
        ]) expect(getPublishedSeriesEpisode({ ...course, sections: [{ id: 1, lessons }] }, 41)).toBeUndefined();
    });
});
