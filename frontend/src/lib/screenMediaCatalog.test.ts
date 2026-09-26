import { describe, expect, it } from "vitest";
import type { Course, LessonSummary } from "@/lib/courses";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

const withLessons = (lessons: LessonSummary[]): Course => ({
    id: 1, title: "Reference series", description: "", level: "series",
    sections: [{ id: 1, lessons }],
});

describe("published episode identity", () => {
    it("accepts either explicit index and agreeing aliases", () => {
        const course = withLessons([
            { id: 11, media_id: 1, metadata_json: { episode_index: 1 } },
            { id: 12, media_id: 2, metadata_json: { lesson_index: 2 } },
            { id: 13, media_id: 3, metadata_json: { episode_index: 3, lesson_index: 3 } },
        ]);
        expect([1, 2, 3].map((position) => getPublishedSeriesEpisode(course, position)?.id)).toEqual([11, 12, 13]);
    });

    it("requires media and an explicit numeric position rather than a matching title", () => {
        const course = withLessons([
            { id: 11, media_id: null, metadata_json: { episode_index: 1 } },
            { id: 12, media_id: 2, title: "第1集" },
            { id: 13, media_id: 3, metadata_json: { episode_index: "1" } },
        ]);
        expect(getPublishedSeriesEpisode(course, 1)).toBeUndefined();
    });

    it("does not attach one video to two episodes with contradictory index metadata", () => {
        for (const metadata_json of [{ episode_index: 1, lesson_index: 2 }, { episode_index: "1", lesson_index: 1 }]) {
            const course = withLessons([{ id: 11, media_id: 1, metadata_json }]);
            expect(getPublishedSeriesEpisode(course, 1)).toBeUndefined();
            expect(getPublishedSeriesEpisode(course, 2)).toBeUndefined();
        }
    });

    it("rejects duplicate matches and invalid requested positions", () => {
        const course = withLessons([1, 2].map((id) => ({ id, media_id: id, metadata_json: { episode_index: 1 } })));
        for (const position of [1, 0, -1, 1.5, NaN, Infinity]) expect(getPublishedSeriesEpisode(course, position)).toBeUndefined();
        expect(getPublishedSeriesEpisode(undefined, 1)).toBeUndefined();
    });
});
