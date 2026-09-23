import { describe, expect, it } from "vitest";
import { IDIOMS_CATALOG, getIdiomsCourse } from "@/lib/idiomsCatalog";

describe("idioms catalog", () => {
    it("contains the five reference courses in order", () => {
        expect(IDIOMS_CATALOG.map((course) => course.slug)).toEqual([
            "beckybunny-idiom-stories",
            "national-library-idiom-stories",
            "sanmiao-kids-idiom-stories",
            "youpeng-chinese-idioms",
            "dapeng-chinese-idioms",
        ]);
        expect(IDIOMS_CATALOG.map((course) => course.lessonCount)).toEqual([85, 50, 20, 5, 33]);
    });

    it("keeps similar source names in distinct courses", () => {
        expect(getIdiomsCourse("youpeng-chinese-idioms")?.title).toContain("Youpeng Chinese");
        expect(getIdiomsCourse("dapeng-chinese-idioms")?.title).toContain("大鹏说中文");
    });
});
