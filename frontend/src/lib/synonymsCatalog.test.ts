import { describe, expect, it } from "vitest";
import { SYNONYMS_CATALOG, getSynonymsCourse } from "@/lib/synonymsCatalog";

describe("synonyms catalog", () => {
    it("contains the three reference courses in order", () => {
        expect(SYNONYMS_CATALOG.map((course) => course.slug)).toEqual([
            "baijia-talk-hsk5-synonyms",
            "qa-mandarin-synonyms",
            "free-to-learn-chinese-synonyms",
        ]);
        expect(SYNONYMS_CATALOG.map((course) => course.lessonCount)).toEqual([20, 5, 37]);
    });

    it("keeps similar-vocabulary courses separate from other uses of the same creators", () => {
        expect(getSynonymsCourse("baijia-talk-hsk5-synonyms")?.title).toContain("HSK5");
        expect(getSynonymsCourse("baijia-talk-grammar")).toBeUndefined();
    });
});
