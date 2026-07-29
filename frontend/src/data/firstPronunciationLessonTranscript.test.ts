import { describe, expect, it } from "vitest";
import { firstPronunciationLessonTranscript } from "./firstPronunciationLessonTranscript";

describe("first pronunciation lesson transcript", () => {
  it("has unique, ordered, non-empty synchronized cues", () => {
    const ids = new Set<number>();

    firstPronunciationLessonTranscript.forEach((cue, index) => {
      expect(ids.has(cue.id)).toBe(false);
      ids.add(cue.id);
      expect(cue.start).toBeGreaterThanOrEqual(0);
      expect(cue.end).toBeGreaterThan(cue.start);
      expect(cue.chinese.trim()).not.toBe("");
      if (typeof cue.pinyin !== "string") {
        throw new Error(`Cue ${cue.id} is missing pinyin`);
      }
      expect(cue.pinyin.trim()).not.toBe("");
      expect(cue.persian.trim()).not.toBe("");

      const nextCue = firstPronunciationLessonTranscript[index + 1];
      if (nextCue) {
        expect(nextCue.start).toBeGreaterThanOrEqual(cue.end);
      }
    });
  });
});
