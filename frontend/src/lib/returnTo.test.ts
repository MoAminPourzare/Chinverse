import { describe, expect, it } from "vitest";
import { getCurrentReturnToPath, getReturnToHref, getSafeReturnTo } from "./returnTo";

describe("safe return paths", () => {
  it("keeps same-origin paths and query strings", () => {
    expect(getSafeReturnTo("?returnTo=%2Fwatch%2Fhsk%2F42%3Ft%3D30", "/settings"))
      .toBe("/watch/hsk/42?t=30");
  });

  it("rejects protocol-relative and external redirects", () => {
    expect(getSafeReturnTo("?returnTo=%2F%2Fevil.example", "/settings")).toBe("/settings");
    expect(getSafeReturnTo("?returnTo=https%3A%2F%2Fevil.example", "/settings")).toBe("/settings");
  });

  it("builds a return link from the current page", () => {
    window.history.replaceState({}, "", "/watch/pronunciation/7?time=23");
    expect(getCurrentReturnToPath()).toBe("/watch/pronunciation/7?time=23");
    expect(getReturnToHref("/settings/appearance"))
      .toBe("/settings/appearance?returnTo=%2Fwatch%2Fpronunciation%2F7%3Ftime%3D23");
  });
});
