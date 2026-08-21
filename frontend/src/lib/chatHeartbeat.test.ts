import { afterEach, describe, expect, it, vi } from "vitest";
import { startChatHeartbeat } from "@/lib/chatHeartbeat";

const createSocket = () => ({
    readyState: WebSocket.OPEN,
    send: vi.fn(),
    close: vi.fn(),
});

describe("chat websocket heartbeat", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("closes the current socket and activates fallback when pong misses its deadline", () => {
        vi.useFakeTimers();
        const socket = createSocket();
        const onTimeout = vi.fn();

        startChatHeartbeat(socket, {
            isCurrent: () => true,
            onTimeout,
            intervalMs: 25_000,
            pongTimeoutMs: 10_000,
        });

        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: "ping" }));
        vi.advanceTimersByTime(10_000);
        expect(onTimeout).toHaveBeenCalledOnce();
        expect(socket.close).toHaveBeenCalledWith(4001, "pong timeout");
    });

    it("accepts pong, then requires a fresh pong for the next heartbeat", () => {
        vi.useFakeTimers();
        const socket = createSocket();
        const onTimeout = vi.fn();
        const heartbeat = startChatHeartbeat(socket, {
            isCurrent: () => true,
            onTimeout,
            intervalMs: 25_000,
            pongTimeoutMs: 10_000,
        });

        heartbeat.acknowledgePong();
        vi.advanceTimersByTime(25_000);
        expect(socket.send).toHaveBeenCalledTimes(2);
        vi.advanceTimersByTime(10_000);
        expect(onTimeout).toHaveBeenCalledOnce();
        expect(socket.close).toHaveBeenCalledOnce();
    });

    it("cannot let a stale socket close its replacement", () => {
        vi.useFakeTimers();
        const socket = createSocket();
        const onTimeout = vi.fn();
        let current = true;

        startChatHeartbeat(socket, {
            isCurrent: () => current,
            onTimeout,
            pongTimeoutMs: 10_000,
        });
        current = false;
        vi.advanceTimersByTime(10_000);

        expect(onTimeout).not.toHaveBeenCalled();
        expect(socket.close).not.toHaveBeenCalled();
    });
});
