import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/courses";
import { getPronunciationCourse } from "@/lib/pronunciationCatalog";
import {
    findPublishedPlannedCourse,
    findPublishedPlannedLesson,
    getPublishedPlannedLessonHref,
} from "@/lib/plannedCoursePublished";

const catalog = getPronunciationCourse("grace-mandarin")!;
const course: Course = {
    id: 91,
    title: "Grace Mandarin",
    slug: "grace-mandarin",
    subcategory_slug: "pronunciation",
    description: "",
    level: "beginner",
    sections: [{ id: 1, lessons: [
        { id: 301, title: "Master Chinese Tones", metadata_json: { lesson_index: 1 } },
        { id: 302, title: "zh ch sh r", metadata_json: { lesson_index: 2 } },
    ] }],
};

describe("published pronunciation mapping", () => {
    it("matches only the exact pronunciation slug", () => {
        expect(findPublishedPlannedCourse([{ ...course, subcategory_slug: "hsk" }, course], "pronunciation", catalog)?.id).toBe(91);
        expect(findPublishedPlannedCourse([{ ...course, slug: "yoyo-chinese" }], "pronunciation", catalog)).toBeUndefined();
    });

    it("opens the right lesson only when its published position is unique", () => {
        const lesson = findPublishedPlannedLesson(course, 2);
        expect(lesson?.id).toBe(302);
        expect(getPublishedPlannedLessonHref("pronunciation", course, lesson!)).toBe("/watch/pronunciation/91?lesson=302");
        expect(findPublishedPlannedLesson(course, 3)).toBeUndefined();
        expect(findPublishedPlannedLesson({ ...course, sections: [{ id: 1, lessons: [
            { id: 301, metadata_json: { lesson_index: 1 } },
            { id: 302, metadata_json: { lesson_index: 1 } },
        ] }] }, 1)).toBeUndefined();
    });
});
