import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useVocabularyPronunciation } from "./useVocabularyPronunciation";

class TestAudio {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play = vi.fn(() => Promise.resolve());
    pause = vi.fn();
    constructor(public src: string) { clips.push(this); }
}
class TestSpeech {
    lang = "";
    voice: unknown;
    rate = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
}
let clips: TestAudio[];
let synthesis: { getVoices: ReturnType<typeof vi.fn>; speak: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
beforeEach(() => {
    clips = [];
    synthesis = { getVoices: vi.fn(() => [{ lang: "en-US" }, { lang: "zh-CN" }]), speak: vi.fn(), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("Audio", TestAudio);
    vi.stubGlobal("SpeechSynthesisUtterance", TestSpeech);
    vi.stubGlobal("speechSynthesis", synthesis);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("plays the dictionary clip first and stops it when the modal closes", async () => {
    const word = { id: 1, chinese: "朋友", audio_url: "/uploads/dictionary-audio/friend.mp3" };
    const { result, rerender } = renderHook(({ open }) => useVocabularyPronunciation(word, open), { initialProps: { open: true } });
    await act(() => result.current.play());
    expect(clips[0].src).toContain("/uploads/dictionary-audio/friend.mp3");
    expect(clips[0].play).toHaveBeenCalledOnce();
    expect(synthesis.speak).not.toHaveBeenCalled();
    rerender({ open: false });
    expect(clips[0].pause).toHaveBeenCalledOnce();
    expect(result.current.playing).toBe(false);
});

it("speaks a missing recording with a Mandarin voice and exposes that source", async () => {
    const { result } = renderHook(() => useVocabularyPronunciation({ id: 2, chinese: "的", audio_url: null }, true));
    await act(() => result.current.play());
    const speech = synthesis.speak.mock.calls[0][0] as TestSpeech;
    expect(speech.text).toBe("的");
    expect(speech.lang).toBe("zh-CN");
    expect(result.current.deviceVoice).toBe(true);
    expect(result.current.playing).toBe(true);
    act(() => speech.onend?.());
    expect(result.current.playing).toBe(false);
});

it("falls back once on a failed recording and ignores a stale clip after switching words", async () => {
    const { result, rerender } = renderHook(({ id }) => useVocabularyPronunciation({ id, chinese: id === 1 ? "朋友" : "你好", audio_url: "/broken.mp3" }, true), { initialProps: { id: 1 } });
    await act(() => result.current.play());
    await act(async () => { clips[0].onerror?.(); clips[0].onerror?.(); });
    expect(synthesis.speak).toHaveBeenCalledOnce();
    rerender({ id: 2 });
    await act(async () => clips[0].onerror?.());
    expect(synthesis.speak).toHaveBeenCalledOnce();
    expect(synthesis.cancel).toHaveBeenCalledOnce();
    expect(result.current.playing).toBe(false);
});

it("never reads a Chinese word with an English or Cantonese voice", async () => {
    synthesis.getVoices.mockReturnValue([{ lang: "en-US" }, { lang: "zh-HK" }]);
    const { result } = renderHook(() => useVocabularyPronunciation({ id: 2, chinese: "的" }, true));
    await act(() => result.current.play());
    expect(synthesis.speak).not.toHaveBeenCalled();
    expect(result.current.error).toContain("صدای چینی");
    expect(result.current.playing).toBe(false);
});

it("reports a device speech failure and permits another attempt", async () => {
    const { result } = renderHook(() => useVocabularyPronunciation({ id: 2, chinese: "的" }, true));
    await act(() => result.current.play());
    act(() => (synthesis.speak.mock.calls[0][0] as TestSpeech).onerror?.());
    expect(result.current.error).toContain("پخش تلفظ انجام نشد");
    await act(() => result.current.play());
    await waitFor(() => expect(synthesis.speak).toHaveBeenCalledTimes(2));
    expect(result.current.error).toBeNull();
});
