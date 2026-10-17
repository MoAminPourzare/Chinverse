import { describe, expect, it } from "vitest";
import { getCurrentReturnToPath, getJourneyHref, getReturnToHref, getSafeReturnTo } from "./returnTo";

describe("safe return paths", () => {
  it("keeps same-origin paths and query strings", () => {
    expect(getSafeReturnTo("?returnTo=%2Fwatch%2Fhsk%2F42%3Ft%3D30", "/settings"))
      .toBe("/watch/hsk/42?t=30");
  });

  it("rejects protocol-relative and external redirects", () => {
    expect(getSafeReturnTo("?returnTo=%2F%2Fevil.example", "/settings")).toBe("/settings");
    expect(getSafeReturnTo("?returnTo=https%3A%2F%2Fevil.example", "/settings")).toBe("/settings");
    expect(getSafeReturnTo("?returnTo=%2F%5Cevil.example", "/settings")).toBe("/settings");
    expect(getSafeReturnTo("?returnTo=%2F%0Aevil.example", "/settings")).toBe("/settings");
  });

  it("builds a return link from the current page", () => {
    window.history.replaceState({}, "", "/watch/pronunciation/7?time=23");
    expect(getCurrentReturnToPath()).toBe("/watch/pronunciation/7?time=23");
    expect(getReturnToHref("/settings/appearance"))
      .toBe("/settings/appearance?returnTo=%2Fwatch%2Fpronunciation%2F7%3Ftime%3D23");
  });

  it("carries a collection journey without losing lesson queries or anchors", () => {
    const current = "/pronunciation/7?returnTo=%2Fexplore%3FreturnTo%3D%252F%253Ftab%253Ddaily";
    const result = new URL(getJourneyHref("/watch/pronunciation/7?lesson=21#video", current), "https://chinverse.invalid");
    expect(result.searchParams.get("lesson")).toBe("21");
    expect(result.searchParams.get("returnTo")).toBe(current);
    expect(result.hash).toBe("#video");
  });

  it("keeps the same parent when advancing lessons and respects explicit return paths", () => {
    const parent = "/pronunciation/7?returnTo=%2F%3Ftab%3Ddaily";
    const current = `/watch/pronunciation/7?lesson=21&returnTo=${encodeURIComponent(parent)}`;
    const result = new URL(getJourneyHref("/watch/pronunciation/7?lesson=22", current), "https://chinverse.invalid");
    expect(result.searchParams.get("returnTo")).toBe(parent);
    const catalog = new URL(getJourneyHref("/cooking/wang/lesson/2", "/cooking/wang/lesson/1?returnTo=%2Fcooking%2Fwang"), "https://chinverse.invalid");
    expect(catalog.searchParams.get("returnTo")).toBe("/cooking/wang");
    expect(getJourneyHref("/watch/7?returnTo=%2Fexplore", current)).toBe("/watch/7?returnTo=%2Fexplore");
  });

  it("leaves ordinary and external links alone and reads the current journey by default", () => {
    expect(getJourneyHref("/explore", "/")).toBe("/explore");
    expect(getJourneyHref("https://example.com", "/?returnTo=%2F")).toBe("https://example.com");
    expect(getJourneyHref("//example.com", "/?returnTo=%2F")).toBe("//example.com");
    window.history.replaceState({}, "", "/explore?returnTo=%2F%3Ftab%3Ddaily");
    expect(new URL(getJourneyHref("/explore/cooking"), "https://chinverse.invalid").searchParams.get("returnTo")).toBe("/explore?returnTo=%2F%3Ftab%3Ddaily");
  });
});
