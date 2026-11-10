import { describe, expect, it } from "vitest";
import { watchedSecondsBetween, type PlaybackSample } from "./watchProgress";

const playing: PlaybackSample = { at: 1000, position: 10, rate: 1, playing: true, seeking: false };
describe("watched video time", () => {
    it("counts actual playback at normal and double speed", () => {
        expect(watchedSecondsBetween(playing, { ...playing, at: 2000, position: 11 })).toBe(1);
        expect(watchedSecondsBetween({ ...playing, rate: 2 }, { ...playing, at: 2000, position: 12 })).toBe(2);
    });
    it("does not count seek jumps, rewind, buffering or paused time", () => {
        for (const position of [100, 4, 10]) expect(watchedSecondsBetween(playing, { ...playing, at: 2000, position })).toBe(0);
        expect(watchedSecondsBetween({ ...playing, playing: false }, { ...playing, at: 2000, position: 11 })).toBe(0);
        expect(watchedSecondsBetween(playing, { ...playing, at: 2000, position: 11, seeking: true })).toBe(0);
    });
    it("ignores suspended timers and invalid media positions", () => {
        expect(watchedSecondsBetween(playing, { ...playing, at: 21000, position: 30 })).toBe(0);
        expect(watchedSecondsBetween(playing, { ...playing, at: 2000, position: NaN })).toBe(0);
    });
});
