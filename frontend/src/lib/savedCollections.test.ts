import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, remove, legacyCheck, legacySave, legacyRemove } = vi.hoisted(() => ({
    get: vi.fn(), post: vi.fn(), remove: vi.fn(), legacyCheck: vi.fn(), legacySave: vi.fn(), legacyRemove: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ default: { get, post, delete: remove } }));
vi.mock("@/lib/courses", () => ({ checkCourseSaved: legacyCheck, saveCourse: legacySave, unsaveCourse: legacyRemove }));
import { checkCollectionSaved, getBookmarkErrorMessage, updateCollectionSaved } from "@/lib/savedCollections";

describe("personal collection bookmarks", () => {
    beforeEach(() => { vi.clearAllMocks(); });
    const target = { domain: "hsk", slug: "hsk-1" };

    it("saves a catalog identity without a published course or video", async () => {
        post.mockResolvedValue({ data: { saved: true } });
        await expect(updateCollectionSaved(target, true)).resolves.toBe(true);
        expect(post).toHaveBeenCalledWith("/collections/hsk/hsk-1/save");
        expect(legacySave).not.toHaveBeenCalled();
    });
    it("recognizes an older published-course bookmark", async () => {
        get.mockResolvedValue({ data: { saved: false } });
        legacyCheck.mockResolvedValue(true);
        await expect(checkCollectionSaved({ ...target, courseId: 71 })).resolves.toBe(true);
    });
    it("removes both catalog and older published bookmarks", async () => {
        remove.mockResolvedValue({ data: { saved: false } });
        await expect(updateCollectionSaved({ ...target, courseId: 71 }, false)).resolves.toBe(false);
        expect(legacyRemove).toHaveBeenCalledWith(71);
        expect(remove).toHaveBeenCalledWith("/collections/hsk/hsk-1/save");
    });
    it("preserves the existing numeric-course API", async () => {
        legacySave.mockResolvedValue(true);
        await expect(updateCollectionSaved({ domain: "reality", courseId: 70 }, true)).resolves.toBe(true);
        expect(legacySave).toHaveBeenCalledWith(70);
    });
    it("does not turn server failures into an instruction to log in", () => {
        expect(getBookmarkErrorMessage({ response: { status: 503 } })).not.toContain("وارد حساب");
        expect(getBookmarkErrorMessage({ response: { status: 401 } })).toContain("وارد حساب");
        expect(getBookmarkErrorMessage({ response: { status: 429 } })).toContain("صبر");
    });
});
