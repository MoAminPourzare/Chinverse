import { describe, expect, it } from "vitest";
import {
    calculateKeyboardInset,
    isIosDevice,
    isStandaloneMode,
    updateNavigationStack,
} from "@/lib/mobileUx";

describe("mobile UX helpers", () => {
    it("detects a software keyboard from the visual viewport", () => {
        expect(calculateKeyboardInset(844, 500, 0)).toBe(344);
        expect(calculateKeyboardInset(844, 820, 24)).toBe(0);
    });

    it("keeps an internal navigation stack and consumes browser back routes", () => {
        expect(updateNavigationStack([], "/")).toEqual(["/"]);
        expect(updateNavigationStack(["/"], "/explore")).toEqual(["/", "/explore"]);
        expect(updateNavigationStack(["/", "/explore"], "/")).toEqual(["/"]);
        expect(updateNavigationStack(["/"], "/")).toEqual(["/"]);
    });

    it("recognizes iOS and standalone display modes without confusing desktop Safari", () => {
        expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
        expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
        expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
        expect(isStandaloneMode(true, false)).toBe(true);
        expect(isStandaloneMode(false, true)).toBe(true);
        expect(isStandaloneMode(false, false)).toBe(false);
    });
});

