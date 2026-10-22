import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLASSICAL_POETRY_CATALOG, getClassicalPoetryCourse } from "@/lib/classicalPoetryCatalog";
import { CLASSICAL_POETRY_LESSON_TOPICS } from "@/lib/classicalPoetryLessonTopics";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("classical poetry catalog", () => {
    it("contains the reference collection and sixty-five episodes", () => {
        expect(CLASSICAL_POETRY_CATALOG).toHaveLength(1);
        expect(CLASSICAL_POETRY_CATALOG[0]).toMatchObject({
            slug: "rabbit-classical-poetry", title: "兔小贝", subtitle: "(古诗大全)",
            cardSubtitle: "(古诗大全)", lessonCount: 65,
        });
    });

    it("uses the rabbit profile for the card and the complete landscape detail cover", () => {
        const course = CLASSICAL_POETRY_CATALOG[0];
        expect(course.coverPath).toBe("/assets/chinverse/course-profiles/兔小贝Beckybunny.jpeg");
        expect(course.detailCoverPath).toBe("/assets/chinverse/course-profiles/兔小贝古诗大全.jpeg");
        expect(course.detailImageAspect).toBe("video");
        for (const cover of [course.coverPath, course.detailCoverPath!]) expect(existsSync(join(process.cwd(), "public", cover))).toBe(true);
    });

    it("provides every numbered episode without adding a second copy of the overlapping episode 63", () => {
        const course = CLASSICAL_POETRY_CATALOG[0];
        expect(CLASSICAL_POETRY_LESSON_TOPICS).toHaveLength(65);
        expect(Object.keys(course.knownLessonTitles!)).toHaveLength(65);
        expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(65);
        expect(Array.from({ length: 65 }, (_, index) => getPlannedLessonTitle(course, index + 1))).toEqual(
            Array.from({ length: 65 }, (_, index) => `第${index + 1}集`),
        );
        expect(Object.values(course.knownLessonSubtitles).every((topic) => topic.trim())).toBe(true);
        expect(course.knownLessonSubtitles[63]).toBe("月夜");
        expect(course.knownLessonSubtitles[64]).toBe("早秋");
        expect(course.knownLessonSubtitles[65]).toBe("子夜秋歌");
    });

    it("keeps the reference titles and repeated poems at their separate positions", () => {
        const topics = CLASSICAL_POETRY_CATALOG[0].knownLessonSubtitles;
        expect([topics[1], topics[3], topics[28], topics[45], topics[57], topics[58]]).toEqual([
            "江雪", "九月九日忆山东兄弟", "送杜少府之任蜀州", "黄鹤楼送孟浩然之广陵", "宿王昌龄隐居", "夜上受降城闻笛",
        ]);
        expect([topics[11], topics[53]]).toEqual(["望岳", "望岳"]);
        expect([topics[17], topics[59]]).toEqual(["夜雨寄北", "夜雨寄北"]);
        expect([topics[27], topics[62]]).toEqual(["游子吟", "游子吟"]);
    });

    it("does not invent ratings, durations or proficiency levels, or mix with classical Chinese", () => {
        const course = getClassicalPoetryCourse("rabbit-classical-poetry");
        expect(course).not.toHaveProperty("rating");
        expect(course).not.toHaveProperty("duration");
        expect(course).not.toHaveProperty("level");
        expect(getClassicalPoetryCourse("baijia-talk-classical-chinese-introduction")).toBeUndefined();
        expect(getClassicalPoetryCourse("missing")).toBeUndefined();
        expect(getClassicalPoetryCourse(undefined)).toBeUndefined();
    });
});
