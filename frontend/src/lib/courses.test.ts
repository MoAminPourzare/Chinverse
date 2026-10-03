import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/api", () => ({
    default: { get },
}));

import { fetchCourseTaxonomy } from "@/lib/courses";

describe("fetchCourseTaxonomy", () => {
    beforeEach(() => {
        get.mockReset();
        vi.spyOn(Date, "now").mockReturnValue(1_725_000_000_000);
    });

    it("bypasses stale empty browser responses for the admin taxonomy", async () => {
        const taxonomy = [{
            id: 1,
            name: "Chinese Learning",
            slug: "chinese-learning",
            icon_url: null,
            subcategories: [{ id: 10, name: "HSK", slug: "hsk", category_id: 1 }],
        }];
        get.mockResolvedValue({ data: taxonomy });

        await expect(fetchCourseTaxonomy()).resolves.toEqual(taxonomy);
        expect(get).toHaveBeenCalledWith("/courses/taxonomy", {
            params: { _fresh: 1_725_000_000_000 },
            chinverseCacheTtlMs: 0,
        });
    });
});
