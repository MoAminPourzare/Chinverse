import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { COOKING_CATALOG, getCookingCourse } from "@/lib/cookingCatalog";

describe("cooking catalog", () => {
    it("contains the four reference shows in order with exact episode counts", () => {
        expect(COOKING_CATALOG.map((course) => course.slug)).toEqual([
            "wanneng-gongjuren-a-wei",
            "meishi-zuojia-wang-gang",
            "lao-fan-gu",
            "zhongguo-meishi-pindao",
        ]);
        expect(COOKING_CATALOG.map((course) => course.lessonCount)).toEqual([46, 16, 21, 34]);
    });

    it("keeps separate Chinese titles, pinyin and the reference covers", () => {
        expect(getCookingCourse("wanneng-gongjuren-a-wei")?.subtitle).toBe("Wànnéng gōngjù rén a Wěi");
        expect(getCookingCourse("meishi-zuojia-wang-gang")?.coverPath).toContain("美食作家王刚.png");
        for (const course of COOKING_CATALOG) {
            expect(course.subtitle).toBeTruthy();
            expect(course.description.length).toBeGreaterThanOrEqual(3);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
            expect(existsSync(path.join(process.cwd(), "public", decodeURIComponent(course.coverPath)))).toBe(true);
        }
    });

    it("uses episode labels from the first through last planned item", () => {
        for (const course of COOKING_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("第1集");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`第${course.lessonCount}集`);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
            for (let position = 1; position <= course.lessonCount; position++) {
                expect(course.knownLessonSubtitles[position]?.trim()).toBeTruthy();
            }
        }
    });

    it("preserves the reference endpoints and repeated topics in all 117 episodes", () => {
        expect(COOKING_CATALOG.reduce((count, course) => count + course.lessonCount, 0)).toBe(117);
        expect(COOKING_CATALOG.map((course) => course.knownLessonSubtitles[1])).toEqual([
            "Pickled chili squid | 泡椒鱿鱼", "Bullfrog with pickled peppers | 泡椒牛蛙",
            "Lamb Pilaf | 手抓饭", "巧克力蛋糕",
        ]);
        expect(COOKING_CATALOG.map((course) => course.knownLessonSubtitles[course.lessonCount])).toEqual([
            "Crispy pickled cucumber | 脆泡黄瓜", "Sichuan Chili Beef Tripe | 鲜椒千层肚",
            "Oil-Braised Jumbo Prawns | 油焖大虾", "红枣糯米糕",
        ]);
        const desserts = getCookingCourse("zhongguo-meishi-pindao")!;
        expect(desserts.knownLessonSubtitles[2]).toBe(desserts.knownLessonSubtitles[24]);
        expect(getCookingCourse("lao-fan-gu")?.knownLessonSubtitles[8]).toBe("Phoenix-Tail Shrimp | 凤尾虾啫粉丝");
    });

    it("maps the sixteen Wang Gang thumbnails without inventing images for other shows", () => {
        const wang = getCookingCourse("meishi-zuojia-wang-gang")!;
        expect(wang.portraitCover).toBe(true);
        expect(Object.keys(wang.knownLessonThumbnails!)).toHaveLength(16);
        for (const thumbnail of Object.values(wang.knownLessonThumbnails!)) {
            expect(existsSync(path.join(process.cwd(), "public", decodeURIComponent(thumbnail)))).toBe(true);
        }
        expect(wang.knownLessonThumbnails?.[1]).toContain("fHhvLoS2n.png");
        expect(wang.knownLessonThumbnails?.[12]).toContain("fRxodnqMu.jpeg");
        expect(wang.knownLessonThumbnails?.[16]).toContain("fHh9nmF3v.png");
        expect(COOKING_CATALOG.filter((course) => course.slug !== wang.slug).every((course) => !course.knownLessonThumbnails)).toBe(true);
    });
});
