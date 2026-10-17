import { beforeEach, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { vocabularyKnowledgeService } from "./vocabularyKnowledge.service";

vi.mock("@/lib/api", () => ({ default: { post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it("loads user-specific states without duplicate dictionary words", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { states: { "朋友": "leitner", "你好": "known" } } });
    const signal = new AbortController().signal;
    expect(await vocabularyKnowledgeService.get(["朋友", "你好", "朋友", ""], signal)).toEqual({ "朋友": "leitner", "你好": "known" });
    expect(api.post).toHaveBeenCalledWith("/vocabulary/knowledge", { words: ["朋友", "你好"] }, { signal });
});
it("marks remaining words through the persistent endpoint and keeps server-assigned review states", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { states: { "朋友": "leitner", "你好": "known" } } });
    expect(await vocabularyKnowledgeService.markKnown(["朋友", "你好"])).toEqual({ "朋友": "leitner", "你好": "known" });
    expect(api.post).toHaveBeenCalledWith("/vocabulary/known", { words: ["朋友", "你好"] }, { signal: undefined });
});
it("does not lose words when a long lesson exceeds the API request limit", async () => {
    vi.mocked(api.post).mockImplementation(async (_path, body) => ({ data: { states: Object.fromEntries((body as { words: string[] }).words.map((word) => [word, "known"])) } }));
    const words = Array.from({ length: 5001 }, (_, index) => "词" + index);
    expect(Object.keys(await vocabularyKnowledgeService.get(words))).toHaveLength(5001);
    expect(api.post).toHaveBeenCalledTimes(2);
});
it("skips an empty request and propagates failed writes without claiming success", async () => {
    expect(await vocabularyKnowledgeService.get([])).toEqual({});
    expect(api.post).not.toHaveBeenCalled();
    vi.mocked(api.post).mockRejectedValue(new Error("offline"));
    await expect(vocabularyKnowledgeService.markKnown(["你好"])).rejects.toThrow("offline");
});
