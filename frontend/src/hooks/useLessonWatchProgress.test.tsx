import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLessonWatchProgress } from "./useLessonWatchProgress";
import { LESSON_PROGRESS_EVENT, readLessonProgress } from "@/lib/lessonProgress";

const record = vi.hoisted(() => vi.fn());
vi.mock("@/services/dailyActivity.service", () => ({ dailyActivityService: { recordVideoProgress: record } }));

function Player({ lessonId = 1 }: { lessonId?: number }) {
    const video = useRef<HTMLVideoElement>(null);
    const progress = useLessonWatchProgress(video, lessonId, 7, true);
    return <><video ref={video} data-testid="video" /><button onClick={() => void progress.flush()}>save</button><p data-testid="state">{progress.error ? "error" : progress.completed ? "completed" : "pending"}</p></>;
}

function media() {
    const video = screen.getByTestId("video") as HTMLVideoElement;
    const state = { position: 0, paused: false, rate: 1 };
    Object.defineProperties(video, {
        currentTime: { configurable: true, get: () => state.position },
        paused: { configurable: true, get: () => state.paused },
        duration: { configurable: true, get: () => 100 },
        playbackRate: { configurable: true, get: () => state.rate },
    });
    fireEvent.play(video);
    return { video, state };
}

async function advance(state: { position: number }, seconds: number, speed = 1) {
    for (let second = 0; second < seconds; second++) {
        state.position += speed;
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    }
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    localStorage.clear();
    record.mockReset().mockResolvedValue({ lesson_completed: false });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("records advancing playback and keeps actual study time correct at double speed", async () => {
    render(<Player />);
    const { state } = media();
    state.rate = 2;
    fireEvent.play(screen.getByTestId("video"));
    await advance(state, 8, 2);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "save" })); });
    expect(record.mock.calls.reduce((sum, [payload]) => sum + payload.seconds_delta, 0)).toBe(16);
    expect(record.mock.calls.reduce((sum, [payload]) => sum + payload.study_seconds_delta, 0)).toBe(8);
});

it("keeps a failed save retryable and only marks completion after a server acknowledgement", async () => {
    record.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ lesson_completed: true });
    render(<Player />);
    const { state } = media();
    await advance(state, 5);
    expect(screen.getByTestId("state")).toHaveTextContent("error");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "save" })); });
    expect(screen.getByTestId("state")).toHaveTextContent("completed");
    expect(record.mock.calls[1][0].seconds_delta).toBe(5);
});

it("freezes the former lesson's last position when a save finishes after switching lessons", async () => {
    let resolve!: (value: { lesson_completed: boolean }) => void;
    record.mockImplementationOnce(() => new Promise(value => { resolve = value; }));
    const view = render(<Player />);
    const { state } = media();
    await advance(state, 15);
    view.rerender(<Player lessonId={2} />);
    state.position = 80;
    await act(async () => { resolve({ lesson_completed: true }); });
    expect(record.mock.calls[1][0]).toMatchObject({ lesson_id: 1, position_seconds: 15 });
    expect(screen.getByTestId("state")).not.toHaveTextContent("completed");
});

it("notifies the profile when the final save finishes after the player unmounts", async () => {
    let resolve!: (value: { lesson_completed: boolean }) => void;
    record.mockImplementationOnce(() => new Promise(value => { resolve = value; }));
    const saved = vi.fn();
    window.addEventListener(LESSON_PROGRESS_EVENT, saved);
    const view = render(<Player />);
    const { state } = media();
    await advance(state, 5);
    expect(readLessonProgress(7, 1).watchedSeconds).toBe(0);
    view.unmount();
    await act(async () => { resolve({ lesson_completed: true }); });
    expect(saved).toHaveBeenCalledTimes(1);
    expect(readLessonProgress(7, 1)).toMatchObject({ watchedSeconds: 5, positionSeconds: 5, durationSeconds: 100 });
    window.removeEventListener(LESSON_PROGRESS_EVENT, saved);
});
