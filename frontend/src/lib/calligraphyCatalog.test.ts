import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CALLIGRAPHY_CATALOG, getCalligraphyCourse } from "@/lib/calligraphyCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";

describe("calligraphy catalog", () => {
    it("contains the three reference courses in order with exact lesson counts", () => {
        expect(CALLIGRAPHY_CATALOG.map((course) => course.slug)).toEqual([
            "chen-zhongjian-calligraphy-beginners",
            "chen-zhongjian-ouyang-xun-structure",
            "chen-zhongjian-yan-zhenqing-duobao-pagoda",
        ]);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.lessonCount)).toEqual([14, 36, 23]);
    });

    it("uses the shared Chen Zhongjian portrait and exact course labels", () => {
        expect(CALLIGRAPHY_CATALOG.every((course) => course.coverPath === "/assets/chinverse/course-profiles/陳忠建.jpeg")).toBe(true);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.title)).toEqual(["陳忠建", "陳忠建", "陳忠建"]);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.subtitle)).toEqual([
            "零基础自学书法入门",
            "欧阳询(结构)",
            "颜真卿(多宝塔碑)",
        ]);
        expect(CALLIGRAPHY_CATALOG.map((course) => course.cardSubtitle)).toEqual(CALLIGRAPHY_CATALOG.map((course) => course.subtitle));
        for (const course of CALLIGRAPHY_CATALOG) expect(existsSync(join(process.cwd(), "public", course.coverPath))).toBe(true);
    });

    it("preserves Chinese lesson labels without inventing rating or duration metadata", () => {
        for (const course of CALLIGRAPHY_CATALOG) {
            expect(getPlannedLessonTitle(course, 1)).toBe("第1课");
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`第${course.lessonCount}课`);
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("includes all 37 reference topics and keeps the repeated practice characters", () => {
        const beginners = CALLIGRAPHY_CATALOG[0].knownLessonSubtitles;
        const duobao = CALLIGRAPHY_CATALOG[2].knownLessonSubtitles;
        expect(Object.keys(beginners)).toHaveLength(14);
        expect(Object.keys(duobao)).toHaveLength(23);
        expect(beginners[1]).toBe("保姆级书法萌新选笔指南");
        expect(beginners[14]).toBe("入门解惑集，必看防弯路！（下一季再见啦）");
        expect(duobao[3]).toBe("上上十止");
        expect(duobao[7]).toBe("日日目");
        expect(duobao[23]).toBe("多宝塔特征6 向势、背势交换运用");
        for (const topics of [beginners, duobao]) expect(Object.values(topics).every((topic) => topic.trim())).toBe(true);
    });

    it("splits Ouyang structure into the two reference levels without invented topics", () => {
        const structure = CALLIGRAPHY_CATALOG[1];
        expect(structure.levels).toEqual([
            { slug: "beginner", title: "入门 欧阳询结构", lessonCount: 18 },
            { slug: "advanced", title: "进阶 欧体结构", lessonCount: 18 },
        ]);
        expect(structure.levels?.reduce((sum, level) => sum + level.lessonCount, 0)).toBe(structure.lessonCount);
        expect(structure.countSummary).toBe("۲ سطح · ۳۶ درس");
        expect(structure.knownLessonSubtitles).toEqual({});
    });

    it("resolves a course by slug", () => {
        expect(getCalligraphyCourse("chen-zhongjian-ouyang-xun-structure")?.lessonCount).toBe(36);
        expect(getCalligraphyCourse("missing")).toBeUndefined();
    });
});
