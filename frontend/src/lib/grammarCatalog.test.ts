import { describe, expect, it } from "vitest";
import { GRAMMAR_CATALOG, getGrammarCourse } from "@/lib/grammarCatalog";

describe("grammar catalog", () => {
    it("matches the four reference cards and lesson counts", () => {
        expect(GRAMMAR_CATALOG.map((course) => course.slug)).toEqual([
            "chinese-zero-to-hero-grammar",
            "baijia-talk-grammar",
            "yoyo-chinese-grammar",
            "grace-mandarin-grammar",
        ]);
        expect(GRAMMAR_CATALOG.map((course) => course.lessonCount)).toEqual([175, 7, 10, 7]);
    });

    it("keeps the course identities distinct across categories", () => {
        expect(getGrammarCourse("grace-mandarin-grammar")?.title).toBe("Grace Mandarin (Grammar)");
        expect(getGrammarCourse("grace-mandarin-character")).toBeUndefined();
    });
});
