import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { galleryService } from "./gallery.service";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe("gallery upload session check", () => {
    beforeEach(() => vi.clearAllMocks());

    it("checks the current session before sending one multipart upload", async () => {
        vi.mocked(api.get).mockResolvedValue({ data: { id: 1 } });
        const item = { id: 3, user_id: 1, image_url: "/uploads/gallery/photo.jpg", created_at: "", updated_at: "" };
        vi.mocked(api.post).mockResolvedValue({ data: item });
        const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

        expect(await galleryService.uploadImage(file, "متن عکس")).toEqual(item);
        expect(api.get).toHaveBeenCalledWith("/users/me", { chinverseCacheTtlMs: 0 });
        expect(vi.mocked(api.get).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(api.post).mock.invocationCallOrder[0]);
        expect(api.post).toHaveBeenCalledTimes(1);
        const [path, data] = vi.mocked(api.post).mock.calls[0];
        expect(path).toBe("/users/me/gallery");
        expect((data as FormData).get("file")).toBe(file);
        expect((data as FormData).get("caption")).toBe("متن عکس");
    });

    it("does not send a file when the session cannot be renewed", async () => {
        const failure = { response: { status: 401 } };
        vi.mocked(api.get).mockRejectedValue(failure);
        await expect(galleryService.uploadImage(new File(["test"], "photo.jpg"))).rejects.toBe(failure);
        expect(api.post).not.toHaveBeenCalled();
    });
});
