import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { TOPIC_TALKS_CATALOG, getTopicTalksCourse } from "@/lib/topicTalksCatalog";

describe("topic talks catalog", () => {
    it("contains the three reference collections in order with exact talk counts", () => {
        expect(TOPIC_TALKS_CATALOG.map((course) => course.slug)).toEqual([
            "dr-yuni-xia",
            "jishi-shuo",
            "documentary-literature-hall",
        ]);
        expect(TOPIC_TALKS_CATALOG.map((course) => course.lessonCount)).toEqual([106, 46, 21]);
    });

    it("keeps the reference images and complete descriptions", () => {
        expect(decodeURIComponent(getTopicTalksCourse("dr-yuni-xia")!.coverPath)).toContain("两娃妈夏博士Dr. Yuni Xia.jpeg");
        for (const course of TOPIC_TALKS_CATALOG) {
            expect(existsSync(join(process.cwd(), "public", decodeURIComponent(course.coverPath))), course.coverPath).toBe(true);
            expect(course.description.length).toBeGreaterThanOrEqual(3);
            expect(course.audience.length).toBeGreaterThanOrEqual(3);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("uses talk labels throughout every planned collection", () => {
        for (const course of TOPIC_TALKS_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("第1集");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`第${course.lessonCount}集`);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
            expect(Object.values(course.knownLessonSubtitles).every(Boolean)).toBe(true);
        }
    });

    it("preserves the reference endpoints and repeated Dr. Xia topics", () => {
        const drXia = getTopicTalksCourse("dr-yuni-xia")!.knownLessonSubtitles;
        expect(drXia[82]).toBe("AI奥赛 宝藏资料 全网首发！AI奥赛独家深度讲解 高手都在看这篇");
        expect(drXia[92]).toBe(drXia[64]);
        expect(drXia[106]).toBe("顶级富豪里面，是富二代更多还是白手起家的更多？");
        expect(getTopicTalksCourse("jishi-shuo")?.knownLessonSubtitles[46]).toBe("段永平说了实话：年轻人躺平，是因为根本不敢努力？");
        expect(getTopicTalksCourse("documentary-literature-hall")?.knownLessonSubtitles[21]).toBe("为什么美国华侨老了以后，都想回到中国安享晚年？");
        expect(getTopicTalksCourse("unknown")).toBeUndefined();
    });
});
