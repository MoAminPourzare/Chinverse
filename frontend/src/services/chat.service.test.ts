import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatService } from "@/services/chat.service";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    default: {
        get: mocks.get,
        post: vi.fn(),
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
