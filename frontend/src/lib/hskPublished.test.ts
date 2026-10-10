import { describe, expect, it } from "vitest";
import { getHskCourse } from "@/lib/hskCatalog";
import { findPublishedHskCourse, findPublishedHskLesson, getPublishedHskLessonHref } from "@/lib/hskPublished";
import type { Course } from "@/lib/courses";

const catalog = getHskCourse("hsk-4-xia")!;
const course: Course = {
    id: 82,
    title: "HSK 4下",
    slug: "hsk-4-xia",
    subcategory_slug: "hsk",
    description: "",
    level: "intermediate",
    sections: [{ id: 1, lessons: [
        { id: 301, title: "第11课（下）", metadata_json: { lesson_index: 1 } },
        { id: 302, title: "第12课（下）", metadata_json: { lesson_index: 2 } },
    ] }],
};

describe("published HSK mapping", () => {
    it("matches only the exact HSK catalog slug", () => {
        expect(findPublishedHskCourse([{ ...course, subcategory_slug: "series" }, { ...course, slug: "hsk-4-shang" }, course], catalog)?.id).toBe(82);
        expect(findPublishedHskCourse([{ ...course, slug: "hsk-4-shang" }], catalog)).toBeUndefined();
    });

    it("routes only uniquely numbered published lessons to the player", () => {
        expect(findPublishedHskLesson(course, 1)?.id).toBe(301);
        expect(getPublishedHskLessonHref(course, findPublishedHskLesson(course, 1)!)).toBe("/watch/hsk/82?lesson=301");
        expect(findPublishedHskLesson(course, 3)).toBeUndefined();
        expect(findPublishedHskLesson({ ...course, sections: [{ id: 1, lessons: [
            { id: 301, metadata_json: { lesson_index: 1 } },
            { id: 302, metadata_json: { lesson_index: 1 } },
        ] }] }, 1)).toBeUndefined();
    });
});
