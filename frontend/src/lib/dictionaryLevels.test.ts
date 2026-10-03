import { describe, expect, it } from "vitest";
import { dictionaryLevelLabel } from "./dictionaryLevels";

describe("dictionary level labels", () => {
    it("keeps the combined advanced band even with older numeric metadata", () => {
        expect(dictionaryLevelLabel({ level: "HSK7-9", hsk_level: 7 })).toBe("HSK 7–9");
        expect(dictionaryLevelLabel({ level: "HSK 7–9", hsk_level: null })).toBe("HSK 7–9");
    });

    it("distinguishes non-HSK vocabulary from numbered levels", () => {
        expect(dictionaryLevelLabel({ level: "NON-HSK", hsk_level: null })).toBe("خارج از HSK");
        expect(dictionaryLevelLabel({ level: "HSK4", hsk_level: 4 })).toBe("HSK 4");
    });
});
