import { expect, it, vi } from "vitest";
import RetiredConversationPage from "./page";

const redirect = vi.hoisted(() => vi.fn(() => { throw new Error("redirect"); }));
vi.mock("next/navigation", () => ({ redirect }));

it("redirects old private conversation links to the forum", () => {
    expect(() => RetiredConversationPage()).toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/?tab=forum");
});
