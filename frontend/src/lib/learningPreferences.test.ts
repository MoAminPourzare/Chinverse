import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  LEARNING_PREFERENCES_EVENT,
  LEARNING_PREFERENCES_STORAGE_KEY,
  defaultLearningPreferences,
  getChineseTextStyle,
  getPersianTextStyle,
  getStoredLearningPreferences,
  getHighlightStyle,
  saveLearningPreferences,
  useLearningPreferences,
} from "./learningPreferences";

describe("learning preferences", () => {
  it("uses normal line spacing by default", () => {
    expect(defaultLearningPreferences.persianLineSpacing).toBe("normal");
    expect(defaultLearningPreferences.chineseLineSpacing).toBe("normal");
  });

  it("recovers from malformed storage and sanitizes custom minutes", () => {
    window.localStorage.setItem(LEARNING_PREFERENCES_STORAGE_KEY, "{broken");
    expect(getStoredLearningPreferences()).toEqual(defaultLearningPreferences);

    window.localStorage.setItem(
      LEARNING_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...defaultLearningPreferences, dailyGoalMinutes: 24.6 }),
    );
    expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(25);

    window.localStorage.setItem(
      LEARNING_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...defaultLearningPreferences, dailyGoalMinutes: 301 }),
    );
    expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(defaultLearningPreferences.dailyGoalMinutes);
  });

  it("persists sanitized values and publishes a change event", () => {
    const listener = vi.fn();
    window.addEventListener(LEARNING_PREFERENCES_EVENT, listener);

    saveLearningPreferences({ ...defaultLearningPreferences, dailyGoalMinutes: 42.4 });

    expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(42);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("returns stable Persian and Chinese typography styles", () => {
    expect(getPersianTextStyle(defaultLearningPreferences)).toEqual({ fontSize: "16px", lineHeight: 1.7 });
    expect(getChineseTextStyle(defaultLearningPreferences)).toEqual({ fontSize: "21px", lineHeight: 1.7 });
    expect(getHighlightStyle("sky")).toMatchObject({ backgroundColor: "#bae6fd", borderRadius: "0.4rem" });
  });

  it("updates and resets preferences through the public hook", async () => {
    window.localStorage.setItem(
      LEARNING_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...defaultLearningPreferences, showPinyin: false }),
    );
    const { result } = renderHook(() => useLearningPreferences());

    await waitFor(() => expect(result.current.preferences.showPinyin).toBe(false));

    act(() => result.current.setPreference("dailyGoalMinutes", 35));
    expect(result.current.preferences.dailyGoalMinutes).toBe(35);
    expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(35);

    act(() => result.current.updatePreferences({ ...defaultLearningPreferences, theme: "dark" }));
    expect(result.current.preferences.theme).toBe("dark");

    act(() => result.current.resetPreferences());
    expect(result.current.preferences).toEqual(defaultLearningPreferences);
  });
});
