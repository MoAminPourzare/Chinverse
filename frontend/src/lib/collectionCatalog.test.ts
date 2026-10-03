import { describe, expect, it } from "vitest";
import { COLLECTION_CATALOGS, getCatalogCollection, mergeSavedCollections } from "@/lib/collectionCatalog";

describe("saved collection display", () => {
    it("resolves every visible catalog collection to its own detail page and image", () => {
        expect(Object.keys(COLLECTION_CATALOGS)).toHaveLength(24);
        for (const [domain, items] of Object.entries(COLLECTION_CATALOGS)) {
            for (const item of items) {
                const saved = getCatalogCollection({ domain, slug: item.slug });
                expect(saved?.href).toBe(`/${domain}/${item.slug}`);
                expect(saved?.title).toBe(item.title);
                expect(saved?.cover).toBeTruthy();
                expect(item.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
            }
        }
    });
    it("keeps older numeric courses and avoids duplicate cards for published catalog items", () => {
        const keys = [{ domain: "hsk", slug: "hsk-1" }, { domain: "hsk", slug: "unknown" }];
        const saved = mergeSavedCollections([
            { id: 1, title: "Old HSK", description: "", level: "1", subcategory_slug: "hsk", slug: "hsk-1" },
            { id: 70, title: "Published course", description: "", level: "1", subcategory_slug: "hsk", slug: "owner-review" },
        ], keys);
        expect(saved).toHaveLength(2);
        expect(saved.map((item) => item.href)).toEqual(["/hsk/hsk-1", "/hsk/70"]);
    });
});
