import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatRoomPage from "@/app/chat/[userId]/page";

const mocks = vi.hoisted(() => ({
    getMe: vi.fn(),
    getPublicProfile: vi.fn(),
    getMessageHistory: vi.fn(),
    getNewMessages: vi.fn(),
    markConversationRead: vi.fn(),
    useAdaptivePolling: vi.fn(),
    getPresence: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useParams: () => ({ userId: "7" }),
    useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/components/ui/PublicMediaImage", () => ({
    default: () => <span data-testid="public-media" />,
}));
vi.mock("@/components/ui/SafeBackButton", () => ({ default: () => <button type="button">back</button> }));
vi.mock("@/components/trust/UserTrustActions", () => ({ default: () => <span /> }));
vi.mock("@/services/user.service", () => ({
    userService: {
        getMe: mocks.getMe,
        getPublicProfile: mocks.getPublicProfile,
    },
}));
vi.mock("@/services/chat.service", () => ({
    chatService: {
        getMessageHistory: mocks.getMessageHistory,
        getNewMessages: mocks.getNewMessages,
        markConversationRead: mocks.markConversationRead,
        getPresence: mocks.getPresence,
        getWebSocketUrl: () => null,
    },
}));
vi.mock("@/hooks/useAdaptivePolling", () => ({ useAdaptivePolling: mocks.useAdaptivePolling }));

describe("chat room initial polling", () => {
    afterEach(cleanup);
    beforeEach(() => {
        vi.clearAllMocks();
        Element.prototype.scrollIntoView = vi.fn();
        mocks.getMe.mockResolvedValue({ id: 2 });
        mocks.getPublicProfile.mockResolvedValue({ profile: { display_name: "کاربر", avatar_url: null } });
        mocks.getNewMessages.mockResolvedValue([]);
        mocks.markConversationRead.mockResolvedValue({ updated: 0, message_ids: [] });
        mocks.getPresence.mockResolvedValue({ is_online: false });
    });

    it("keeps polling disabled after an initial failure and seeds its cursor after manual retry", async () => {
        const seededMessage = {
            id: 41,
            sender_id: 2,
            receiver_id: 7,
            content: "hello",
            is_read: true,
            created_at: "2026-08-21T00:00:00Z",
            sender: null,
            receiver: null,
        };
        mocks.getMessageHistory
            .mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValueOnce([seededMessage]);

        render(<ChatRoomPage />);

        const retry = await screen.findByRole("button", { name: /تلاش دوباره/ });
        expect(mocks.useAdaptivePolling.mock.calls.findLast(([options]) => options.baseIntervalMs !== 10_000)?.[0].enabled).toBe(false);

        fireEvent.click(retry);
        await waitFor(() => expect(mocks.useAdaptivePolling.mock.calls.findLast(([options]) => options.baseIntervalMs !== 10_000)?.[0].enabled).toBe(true));

        const pollingOptions = mocks.useAdaptivePolling.mock.calls.findLast(([options]) => options.baseIntervalMs !== 10_000)?.[0];
        expect(pollingOptions.runImmediately).toBe(true);
        await pollingOptions.task(new AbortController().signal);
        expect(mocks.getNewMessages).toHaveBeenCalledWith(7, 41, expect.any(AbortSignal));
    });

    it("starts incremental polling from cursor zero after an empty initial history", async () => {
        mocks.getMessageHistory.mockResolvedValue([]);

        render(<ChatRoomPage />);

        await waitFor(() => expect(mocks.useAdaptivePolling.mock.calls.findLast(([options]) => options.baseIntervalMs !== 10_000)?.[0].enabled).toBe(true));

        const pollingOptions = mocks.useAdaptivePolling.mock.calls.findLast(([options]) => options.baseIntervalMs !== 10_000)?.[0];
        expect(pollingOptions.runImmediately).toBe(true);
        await pollingOptions.task(new AbortController().signal);
        expect(mocks.getNewMessages).toHaveBeenCalledWith(7, 0, expect.any(AbortSignal));
    });

    it("shows only the recipient's presence and clears stale online status on errors", async () => {
        mocks.getMessageHistory.mockResolvedValue([]);
        render(<ChatRoomPage />);
        await screen.findByText('وضعیت حضور نامشخص');
        const presencePolling = mocks.useAdaptivePolling.mock.calls.findLast(([options]) => options.baseIntervalMs === 10_000)?.[0];
        await act(async () => presencePolling.task(new AbortController().signal));
        expect(screen.getByText('آفلاین')).toBeInTheDocument();
        mocks.getPresence.mockResolvedValue({ is_online: true });
        await act(async () => presencePolling.task(new AbortController().signal));
        expect(screen.getByText('آنلاین')).toBeInTheDocument();
        act(() => presencePolling.onError(new Error('connection lost')));
        expect(screen.getByText('وضعیت حضور نامشخص')).toBeInTheDocument();
    });
});
