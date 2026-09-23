import { describe, expect, it } from "vitest";
import { VLOGS_CATALOG, getVlogsCourse } from "@/lib/vlogsCatalog";

describe("vlogs catalog", () => {
    it("contains five reference courses in order", () => {
        expect(VLOGS_CATALOG.map((course) => course.slug)).toEqual([
            "zhangkai-chinese-vlog",
            "hongcha-chinese-vlog",
            "free-to-learn-chinese-vlog",
            "hi-chinese-vlog",
            "zhangkai-chinese-short-videos",
        ]);
        expect(VLOGS_CATALOG.map((course) => course.lessonCount)).toEqual([55, 20, 14, 19, 22]);
    });

    it("keeps the two Zhangkai series separate", () => {
        expect(getVlogsCourse("zhangkai-chinese-vlog")?.coverPath).toBe(getVlogsCourse("zhangkai-chinese-short-videos")?.coverPath);
        expect(getVlogsCourse("zhangkai-chinese-vlog")?.lessonCount).not.toBe(getVlogsCourse("zhangkai-chinese-short-videos")?.lessonCount);
    });
});
