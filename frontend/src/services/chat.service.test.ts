import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatService } from "@/services/chat.service";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    default: {
        get: mocks.get,
        post: mocks.post,
    },
    resolveWebSocketBaseUrl: () => "ws://localhost:8000/api/v1",
}));

vi.mock("@/lib/auth-session", () => ({
    getAccessToken: () => null,
}));

describe("chat service incremental history", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.get.mockResolvedValue({ data: [] });
    });

    it("refreshes via an uncached safe read before sending and never repeats a failed POST", async () => {
        mocks.post.mockRejectedValue(new Error('network failed'));
        await expect(chatService.sendMessage({ receiver_id: 7, content: 'سلام' })).rejects.toThrow('network failed');
        expect(mocks.get).toHaveBeenCalledWith('/users/me', { chinverseCacheTtlMs: 0 });
        expect(mocks.post).toHaveBeenCalledTimes(1);
        expect(mocks.get.mock.invocationCallOrder[0]).toBeLessThan(mocks.post.mock.invocationCallOrder[0]);
    });

    it("serializes cursor zero so an initially empty conversation cannot miss its first message", async () => {
        const signal = new AbortController().signal;

        await chatService.getNewMessages(7, 0, signal);

        expect(mocks.get).toHaveBeenCalledWith("/chat/7/messages", {
            params: { after_id: 0, limit: 100 },
            signal,
            chinverseCacheTtlMs: 0,
        });
    });
});
