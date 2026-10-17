import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/courses";
import { CALLIGRAPHY_CATALOG } from "@/lib/calligraphyCatalog";
import { getPublishedCalligraphyLevelLesson } from "@/lib/calligraphyPublished";

describe("calligraphy level playback", () => {
    const [beginner, advanced] = CALLIGRAPHY_CATALOG[1].levels!;
    const course: Course = { id: 70, title: "陳忠建", description: "", level: "calligraphy" };

    it("separates identical lesson numbers in explicitly identified levels", () => {
        const published = { ...course, sections: [
            { id: 1, metadata_json: { level_slug: beginner.slug }, lessons: [{ id: 101, media_id: 1, metadata_json: { lesson_index: 1 } }] },
            { id: 2, metadata_json: { group_slug: advanced.slug }, lessons: [{ id: 201, media_id: 2, metadata_json: { episode_index: 1 } }] },
        ] };
        expect(getPublishedCalligraphyLevelLesson(published, beginner, 1)?.id).toBe(101);
        expect(getPublishedCalligraphyLevelLesson(published, advanced, 1)?.id).toBe(201);
    });

    it("requires media and a unique explicit local lesson number", () => {
        for (const lessons of [
            [{ id: 101, media_id: 1 }],
            [{ id: 101, media_id: null, metadata_json: { lesson_index: 1 } }],
            [101, 102].map((id) => ({ id, media_id: id, metadata_json: { lesson_index: 1 } })),
        ]) {
            expect(getPublishedCalligraphyLevelLesson({ ...course, sections: [{ id: 1, metadata_json: { level_slug: beginner.slug }, lessons }] }, beginner, 1)).toBeUndefined();
        }
    });

    it("rejects unknown, duplicate or conflicting level identities", () => {
        const lessons = [{ id: 101, media_id: 1, metadata_json: { lesson_index: 1 } }];
        for (const sections of [
            [{ id: 1, lessons }],
            [{ id: 1, metadata_json: { level_slug: advanced.slug }, lessons }],
            [{ id: 1, metadata_json: { level_slug: beginner.slug, group_slug: advanced.slug }, lessons }],
            [1, 2].map((id) => ({ id, metadata_json: { level_slug: beginner.slug }, lessons })),
        ]) expect(getPublishedCalligraphyLevelLesson({ ...course, sections }, beginner, 1)).toBeUndefined();
    });

    it("guards unpublished courses and positions outside the selected level", () => {
        expect(getPublishedCalligraphyLevelLesson(undefined, beginner, 1)).toBeUndefined();
        const published = { ...course, sections: [{ id: 1, metadata_json: { level_slug: beginner.slug }, lessons: [
            { id: 101, media_id: 1, metadata_json: { lesson_index: 18 } },
            { id: 102, media_id: 2, metadata_json: { lesson_index: 19 } },
        ] }] };
        expect(getPublishedCalligraphyLevelLesson(published, beginner, 18)?.id).toBe(101);
        for (const position of [0, -1, 1.5, 19, NaN]) expect(getPublishedCalligraphyLevelLesson(published, beginner, position)).toBeUndefined();
    });
});
