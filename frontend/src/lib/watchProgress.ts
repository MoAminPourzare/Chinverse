export interface PlaybackSample {
    at: number;
    position: number;
    rate: number;
    playing: boolean;
    seeking: boolean;
}

/** Count advancing media time, including playback speed, but exclude seeks and buffering. */
export function watchedSecondsBetween(previous: PlaybackSample, current: PlaybackSample): number {
    if (!previous.playing || previous.seeking || current.seeking) return 0;
    const elapsed = (current.at - previous.at) / 1000;
    const advanced = current.position - previous.position;
    if (elapsed <= 0 || elapsed > 3 || advanced <= 0 || !Number.isFinite(advanced)) return 0;
    const expected = elapsed * Math.max(0.25, Math.min(previous.rate, 4));
    if (advanced > expected + 0.75) return 0;
    return Math.min(advanced, expected + 0.1);
}
