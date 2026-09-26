import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { MARTIAL_ARTS_CATALOG, getMartialArtsCourse } from "@/lib/martialArtsCatalog";

describe("martial arts catalog", () => {
    it("contains the three reference courses in order with exact episode counts", () => {
        expect(MARTIAL_ARTS_CATALOG.map((course) => course.slug)).toEqual([
            "xue-guoxue-wang-eight-form-taijiquan",
            "lee-wushu-basic-staff",
            "taichi-wei-kung-fu-fan",
        ]);
        expect(MARTIAL_ARTS_CATALOG.map((course) => course.lessonCount)).toEqual([13, 10, 13]);
    });

    it("uses the separate list and detail images shown in the reference", () => {
        const taiji = getMartialArtsCourse("xue-guoxue-wang-eight-form-taijiquan");
        expect(taiji?.coverPath).toContain("学国学网.jpeg");
        expect(taiji?.detailCoverPath).toContain("八式太极拳.jpeg");
        expect(getMartialArtsCourse("lee-wushu-basic-staff")?.coverPath).toContain("channels4_profile.png");
        expect(getMartialArtsCourse("taichi-wei-kung-fu-fan")?.coverPath).toContain("fR3W0dty9.jpeg");
        expect(taiji?.portraitCover).toBe(true);
        for (const course of MARTIAL_ARTS_CATALOG) {
            for (const cover of [course.coverPath, course.detailCoverPath].filter(Boolean)) {
                expect(existsSync(path.join(process.cwd(), "public", decodeURIComponent(cover!)))).toBe(true);
            }
        }
    });

    it("uses episode labels without invented ratings or durations", () => {
        for (const course of MARTIAL_ARTS_CATALOG) {
            const unit = course.slug === "xue-guoxue-wang-eight-form-taijiquan" ? "节" : "集";
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

    it("preserves the eight-form topics and both stage practices", () => {
        const topics = getMartialArtsCourse("xue-guoxue-wang-eight-form-taijiquan")!.knownLessonSubtitles;
        expect(topics[1]).toBe("发刊词：零基础学会太极拳，越练越健康");
        expect(topics[3]).toBe("卷肱式：灵活关节，畅通气血");
        expect(topics[7]).toBe("太极拳第一阶段完整动作训练（前四式）");
        expect(topics[12]).toBe("太极拳第二阶段完整动作训练（后四式）");
        expect(topics[13]).toBe("八式太极拳完整动作训练");
        expect(new Set(Object.values(topics)).size).toBe(13);
    });

    it("keeps repeated staff and fan labels and the shorter first staff topic", () => {
        const staff = getMartialArtsCourse("lee-wushu-basic-staff")!.knownLessonSubtitles;
        expect(staff[1]).toBe("基础棍术");
        expect(Object.values(staff).slice(1)).toEqual(Array(9).fill("基础棍术 教学"));
        const fan = getMartialArtsCourse("taichi-wei-kung-fu-fan")!;
        expect(Object.values(fan.knownLessonSubtitles)).toEqual(Array(13).fill("太极功夫扇"));
        expect(fan.cardTitle).toBe("立新舞太极");
        expect(fan.cardSubtitle).toBe("Taichi Wei");
        expect(fan.subtitle).toBe("(太极功夫扇)");
        expect(MARTIAL_ARTS_CATALOG.reduce((count, course) => count + course.lessonCount, 0)).toBe(36);
        expect(getMartialArtsCourse("missing")).toBeUndefined();
    });
});
