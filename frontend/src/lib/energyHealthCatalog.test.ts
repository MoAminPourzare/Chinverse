import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { ENERGY_HEALTH_CATALOG, getEnergyHealthCourse } from "@/lib/energyHealthCatalog";

describe("energy health catalog", () => {
    it("contains the two reference courses in order with exact exercise counts", () => {
        expect(ENERGY_HEALTH_CATALOG.map((course) => course.slug)).toEqual([
            "shi-heng-yi-what-is-qi-gong",
            "xue-guoxue-wang-baduanjin",
        ]);
        expect(ENERGY_HEALTH_CATALOG.map((course) => course.lessonCount)).toEqual([11, 20]);
    });

    it("uses the separate list and detail images for Baduanjin", () => {
        const baduanjin = getEnergyHealthCourse("xue-guoxue-wang-baduanjin");
        expect(decodeURIComponent(getEnergyHealthCourse("shi-heng-yi-what-is-qi-gong")!.coverPath)).toContain("Shi Heng Yi Online.jpeg");
        expect(baduanjin?.coverPath).toContain("学国学网.jpeg");
        expect(baduanjin?.detailCoverPath).toContain("《八段锦》.jpeg");
        expect(baduanjin?.detailCoverPosition).toBe("right");
        for (const course of ENERGY_HEALTH_CATALOG) {
            for (const cover of [course.coverPath, course.detailCoverPath].filter(Boolean)) {
                expect(existsSync(path.join(process.cwd(), "public", decodeURIComponent(cover!)))).toBe(true);
            }
        }
    });

    it("uses exercise labels without invented ratings or durations", () => {
        for (const course of ENERGY_HEALTH_CATALOG) {
            const unit = course.slug === "xue-guoxue-wang-baduanjin" ? "节" : "集";
            expect(getPlannedLessonTitle(course, 1)).toBe(`第1${unit}`);
            expect(getPlannedLessonTitle(course, course.lessonCount)).toBe(`第${course.lessonCount}${unit}`);
            expect(Object.keys(course.knownLessonSubtitles)).toHaveLength(course.lessonCount);
            for (let position = 1; position <= course.lessonCount; position++) {
                expect(course.knownLessonSubtitles[position]?.trim()).toBeTruthy();
            }
            expect(course).not.toHaveProperty("rating");
            expect(course).not.toHaveProperty("duration");
        }
    });

    it("keeps all eleven Qi Gong topics, including the reference spelling and mixed languages", () => {
        const course = getEnergyHealthCourse("shi-heng-yi-what-is-qi-gong")!;
        expect(course.cardTitle).toBe("Shi Heng Yi Online");
        expect(course.cardSubtitle).toBe("(What is Qi Gong? )");
        expect(course.knownLessonSubtitles[1]).toBe("Purpose and Discovery");
        expect(course.knownLessonSubtitles[6]).toBe("Time To Breath");
        expect(course.knownLessonSubtitles[7]).toBe("五松· Wu Song (5 Relaxation / Loosening / Releasing Methods)");
        expect(course.knownLessonSubtitles[10]).toBe("罗汉十三式气功 Luohan Postures Soft Fist Form");
        expect(course.knownLessonSubtitles[11]).toBe("十三拳· Shi San Quan");
    });

    it("keeps all twenty Baduanjin topics and distinguishes the breathing practice", () => {
        const course = getEnergyHealthCourse("xue-guoxue-wang-baduanjin")!;
        expect(course.cardTitle).toBe("学国学网");
        expect(course.cardSubtitle).toBe("《八段锦》");
        expect(course.knownLessonSubtitles[1]).toBe("发刊词：古法养生，激活自身免疫力");
        expect(course.knownLessonSubtitles[7]).toBe("八段锦阶段动作训练（前四式）");
        expect(course.knownLessonSubtitles[12]).toBe("八段锦完整动作练习");
        expect(course.knownLessonSubtitles[13]).toBe("八段锦完整动作练习（呼吸版）");
        expect(course.knownLessonSubtitles[20]).toBe("吴蔓老师八段锦直播互动回放");
        expect(new Set(Object.values(course.knownLessonSubtitles)).size).toBe(20);
        expect(ENERGY_HEALTH_CATALOG.reduce((count, item) => count + item.lessonCount, 0)).toBe(31);
        expect(getEnergyHealthCourse("missing")).toBeUndefined();
    });
});
