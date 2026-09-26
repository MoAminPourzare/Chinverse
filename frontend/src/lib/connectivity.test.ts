import { describe, expect, it, vi } from "vitest";
import {
    CONNECTIVITY_EVENT,
    emitConnectivityState,
    readConnectivityEvent,
} from "@/lib/connectivity";

describe("connectivity events", () => {
    it("emits a valid global state without exposing request details", () => {
        const listener = vi.fn();
        window.addEventListener(CONNECTIVITY_EVENT, listener);
        emitConnectivityState("degraded");
        window.removeEventListener(CONNECTIVITY_EVENT, listener);

        expect(listener).toHaveBeenCalledOnce();
        expect(readConnectivityEvent(listener.mock.calls[0][0])).toBe("degraded");
    });

    it("rejects untrusted event values", () => {
        expect(readConnectivityEvent(new CustomEvent(CONNECTIVITY_EVENT, { detail: { state: "unknown" } }))).toBeNull();
    });
});
