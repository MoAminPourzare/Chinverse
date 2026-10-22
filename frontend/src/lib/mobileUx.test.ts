import { describe, expect, it } from "vitest";
import {
    canNavigateBackWithinApp,
    calculateKeyboardInset,
    isEditableElement,
    isIosDevice,
    isSoftwareKeyboardOpen,
    isStandaloneMode,
    normalizeInternalAppRoute,
    resolveSafeBackAction,
    updateNavigationStack,
} from "@/lib/mobileUx";

describe("mobile UX helpers", () => {
    it("detects a software keyboard from the visual viewport", () => {
        const inset = calculateKeyboardInset(844, 500, 0);
        expect(inset).toBe(344);
        expect(calculateKeyboardInset(844, 820, 24)).toBe(0);
        expect(isSoftwareKeyboardOpen(inset, true, 1)).toBe(true);
        expect(isSoftwareKeyboardOpen(inset, false, 1)).toBe(false);
        expect(isSoftwareKeyboardOpen(inset, true, 2)).toBe(false);
    });

    it("only treats text-editable focus as keyboard-capable", () => {
        const input = document.createElement("input");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        const editable = document.createElement("div");
        editable.setAttribute("contenteditable", "true");
        expect(isEditableElement(input)).toBe(true);
        expect(isEditableElement(checkbox)).toBe(false);
        expect(isEditableElement(editable)).toBe(true);
    });

    it("keeps an internal navigation stack and consumes browser back routes", () => {
        expect(updateNavigationStack([], "/")).toEqual(["/"]);
        expect(updateNavigationStack(["/"], "/explore")).toEqual(["/", "/explore"]);
        expect(updateNavigationStack(["/", "/explore"], "/")).toEqual(["/"]);
        expect(updateNavigationStack(["/"], "/")).toEqual(["/"]);
    });

    it("fails safe for stale history and external direct-entry fallbacks", () => {
        const marker = { version: 1 as const, sessionId: "current-session", depth: 1 };
        expect(canNavigateBackWithinApp(["/", "/notifications?tab=all"], marker, "current-session", "/notifications?tab=all")).toBe(true);
        expect(canNavigateBackWithinApp(["/", "/old"], marker, "current-session", "/notifications")).toBe(false);
        expect(canNavigateBackWithinApp(["/", "/notifications"], marker, "stale-session", "/notifications")).toBe(false);
        expect(resolveSafeBackAction(false, "https://attacker.example/leave", "https://chinverse.example")).toEqual({
            kind: "replace",
            href: "/",
        });
        expect(resolveSafeBackAction(false, "/explore?source=direct", "https://chinverse.example")).toEqual({
            kind: "replace",
            href: "/explore?source=direct",
        });
        expect(normalizeInternalAppRoute("//attacker.example/leave", "https://chinverse.example")).toBeNull();
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
