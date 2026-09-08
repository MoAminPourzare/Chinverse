import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("@/lib/api", () => ({
    default: { get, post },
}));

import { contentAdminService } from "@/lib/content-admin";

describe("contentAdminService.listCourses", () => {
    beforeEach(() => {
        get.mockReset();
        post.mockReset();
        vi.spyOn(Date, "now").mockReturnValue(1_725_000_000_000);
    });

    it("recovers a draft by its slug after an interrupted create response", async () => {
        const course = { id: 17, slug: "phase2-closeout" };
        get.mockResolvedValue({ data: course });

        await expect(contentAdminService.getCourseBySlug("phase2-closeout")).resolves.toEqual(course);
        expect(get).toHaveBeenCalledWith("/courses/admin/courses/by-slug/phase2-closeout", {
            params: { _fresh: 1_725_000_000_000 },
            chinverseCacheTtlMs: 0,
        });
    });

    it("recovers an existing media asset by id", async () => {
        const asset = { id: 2, status: "draft", license_status: "pending" };
        get.mockResolvedValue({ data: asset });

        await expect(contentAdminService.getMedia(2)).resolves.toEqual(asset);
        expect(get).toHaveBeenCalledWith("/media/admin/assets/2", {
            params: { _fresh: 1_725_000_000_000 },
            chinverseCacheTtlMs: 0,
        });
    });

    it("loads draft and published courses through the protected admin endpoint", async () => {
        const courses = [{ id: 1, slug: "phase2-closeout" }];
        get.mockResolvedValue({ data: courses });

        await expect(contentAdminService.listCourses()).resolves.toEqual(courses);
        expect(get).toHaveBeenCalledWith("/courses/admin/courses", {
            params: { _fresh: 1_725_000_000_000 },
            chinverseCacheTtlMs: 0,
        });
    });

    it("normalizes a legacy single-course response instead of crashing the admin panel", async () => {
        const course = { id: 1, slug: "phase2-closeout" };
        get.mockResolvedValue({ data: course });

        await expect(contentAdminService.listCourses()).resolves.toEqual([course]);
    });

    it("rejects an invalid successful response so Promise.allSettled can isolate it", async () => {
        get.mockResolvedValue({ data: { detail: "unexpected response" } });

        await expect(contentAdminService.listCourses()).rejects.toThrow("invalid collection");
    });
});
