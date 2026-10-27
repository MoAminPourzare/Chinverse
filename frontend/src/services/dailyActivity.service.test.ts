import { beforeEach, expect, it, vi } from "vitest";
import { dailyActivityService } from "./dailyActivity.service";

const mocks = vi.hoisted(() => ({ post: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/api", () => ({ default: { post: mocks.post }, refreshAccessToken: mocks.refresh }));
const payload = { lesson_id: 8, seconds_delta: 5 };
beforeEach(() => { mocks.post.mockReset(); mocks.refresh.mockReset(); });

it("refreshes an expired session and replays a progress write rejected by authentication once", async () => {
    mocks.post.mockRejectedValueOnce({ response: { status: 401 } }).mockResolvedValueOnce({ data: { lesson_completed: true } });
    mocks.refresh.mockResolvedValue("renewed");
    await expect(dailyActivityService.recordVideoProgress(payload)).resolves.toEqual({ lesson_completed: true });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledTimes(2);
    expect(mocks.post.mock.calls[0]).toEqual(mocks.post.mock.calls[1]);
});

it.each([new Error("network failed"), { response: { status: 503 } }])("does not replay ambiguous failed writes", async failure => {
    mocks.post.mockRejectedValue(failure);
    await expect(dailyActivityService.recordVideoProgress(payload)).rejects.toBe(failure);
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).not.toHaveBeenCalled();
});

it("does not loop when the renewed session is rejected too", async () => {
    mocks.post.mockRejectedValue({ response: { status: 401 } });
    mocks.refresh.mockResolvedValue("renewed");
    await expect(dailyActivityService.recordVideoProgress(payload)).rejects.toMatchObject({ response: { status: 401 } });
    expect(mocks.post).toHaveBeenCalledTimes(2);
});
