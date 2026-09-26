import { describe, expect, it } from "vitest";
import { getHskCourse, getHskLessonTitle, getHskLessonTopic, HSK_CATALOG } from "@/lib/hskCatalog";

describe("HSK catalog", () => {
    it("contains the nine ordered standard-course levels", () => {
        expect(HSK_CATALOG).toHaveLength(9);
        expect(HSK_CATALOG.map((course) => course.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(new Set(HSK_CATALOG.map((course) => course.slug)).size).toBe(9);
        expect(HSK_CATALOG.every((course) => course.coverPath.startsWith("/assets/chinverse/course-profiles/HSK/"))).toBe(true);
    });

    it("lists both parts of every chapter in each upper and lower book", () => {
        for (const level of [4, 5, 6]) {
            const upper = getHskCourse(`hsk-${level}-shang`);
            const lower = getHskCourse(`hsk-${level}-xia`);
            expect(upper).toBeDefined();
            expect(lower).toBeDefined();
            if (!upper || !lower) continue;

            const upperChapters = upper.lessonCount / 2;
            expect(upper.lessonCount).toBe(lower.lessonCount);
            expect(getHskLessonTitle(upper, 0)).toBe("第1课（上）");
            expect(getHskLessonTitle(upper, 1)).toBe("第1课（下）");
            expect(getHskLessonTitle(upper, upper.lessonCount - 1)).toBe(`第${upperChapters}课（下）`);
            expect(getHskLessonTitle(lower, 0)).toBe(`第${upperChapters + 1}课（上）`);
            expect(getHskLessonTitle(lower, lower.lessonCount - 1)).toBe(`第${upperChapters * 2}课（下）`);
        }
    });

    it("keeps the screenshot topics aligned with each card", () => {
        const hsk1 = getHskCourse("hsk-1");
        const hsk3 = getHskCourse("hsk-3");
        const hsk5 = getHskCourse("hsk-5-xia");
        const hsk6 = getHskCourse("hsk-6-xia");
        expect(hsk1 && getHskLessonTopic(hsk1, 0)).toBe("你好！");
        expect(hsk1 && getHskLessonTopic(hsk1, 14)).toBe("");
        expect(hsk3 && getHskLessonTopic(hsk3, 19)).toBe("我被他影响了。");
        expect(hsk5 && getHskLessonTopic(hsk5, 0)).toBe("家乡的萝卜饼");
        expect(hsk5 && getHskLessonTopic(hsk5, 1)).toBe("家乡的萝卜饼");
        expect(hsk6 && getHskLessonTopic(hsk6, 39)).toBe("人类超能力会改变世界纪录吗？");

        for (const course of HSK_CATALOG) {
            for (let index = 0; index < course.lessonCount; index++) {
                if (course.slug === "hsk-1" && index === 14) continue;
                expect(getHskLessonTopic(course, index), `${course.slug} card ${index + 1}`).not.toBe("");
            }
        }
    });
});
