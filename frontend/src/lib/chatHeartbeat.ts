export const CHAT_HEARTBEAT_INTERVAL_MS = 25_000;
export const CHAT_PONG_TIMEOUT_MS = 10_000;

type HeartbeatSocket = Pick<WebSocket, "readyState" | "send" | "close">;

type ChatHeartbeatOptions = {
    isCurrent: () => boolean;
    onTimeout: () => void;
    intervalMs?: number;
    pongTimeoutMs?: number;
};

export type ChatHeartbeat = {
    acknowledgePong: () => void;
    stop: () => void;
};

/**
 * Starts an application-level websocket heartbeat. A ping is considered healthy
 * only after its matching pong arrives before the bounded deadline.
 */
export function startChatHeartbeat(
    socket: HeartbeatSocket,
    {
        isCurrent,
        onTimeout,
        intervalMs = CHAT_HEARTBEAT_INTERVAL_MS,
        pongTimeoutMs = CHAT_PONG_TIMEOUT_MS,
    }: ChatHeartbeatOptions,
): ChatHeartbeat {
    let intervalTimer: ReturnType<typeof setInterval> | undefined;
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    let awaitingPong = false;
    let stopped = false;

    const clearDeadline = () => {
        if (deadlineTimer !== undefined) {
            clearTimeout(deadlineTimer);
            deadlineTimer = undefined;
        }
        awaitingPong = false;
    };

    const expire = () => {
        deadlineTimer = undefined;
        if (stopped || !awaitingPong) return;
        if (!isCurrent()) {
            awaitingPong = false;
            stopped = true;
            if (intervalTimer !== undefined) {
                clearInterval(intervalTimer);
                intervalTimer = undefined;
            }
            return;
        }
        awaitingPong = false;
        onTimeout();
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close(4001, "pong timeout");
        }
    };

    const sendPing = () => {
        if (stopped || awaitingPong || !isCurrent() || socket.readyState !== WebSocket.OPEN) return;
        try {
            socket.send(JSON.stringify({ type: "ping" }));
            awaitingPong = true;
            deadlineTimer = setTimeout(expire, pongTimeoutMs);
        } catch {
            awaitingPong = true;
            expire();
        }
    };

    sendPing();
    intervalTimer = setInterval(sendPing, intervalMs);

    return {
        acknowledgePong: clearDeadline,
        stop: () => {
            stopped = true;
            clearDeadline();
            if (intervalTimer !== undefined) {
                clearInterval(intervalTimer);
                intervalTimer = undefined;
            }
        },
    };
}
