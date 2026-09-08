import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/api", () => ({
    default: { get, post: vi.fn() },
}));

import { contentAdminService } from "@/lib/content-admin";

describe("contentAdminService.listCourses", () => {
    beforeEach(() => {
        get.mockReset();
        vi.spyOn(Date, "now").mockReturnValue(1_725_000_000_000);
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
