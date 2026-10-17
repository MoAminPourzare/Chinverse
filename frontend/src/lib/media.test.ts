import { afterEach, describe, expect, it } from "vitest";
import { getMediaUrl, isPublicOptimizableMediaUrl } from "@/lib/media";

const originalApi = process.env.NEXT_PUBLIC_API_URL;
const originalCdn = process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
const originalOrigins = process.env.NEXT_PUBLIC_IMAGE_REMOTE_ORIGINS;

describe("public image optimization policy", () => {
    afterEach(() => {
        process.env.NEXT_PUBLIC_API_URL = originalApi;
        process.env.NEXT_PUBLIC_IMAGE_CDN_URL = originalCdn;
        process.env.NEXT_PUBLIC_IMAGE_REMOTE_ORIGINS = originalOrigins;
    });

    it("allows public upload and poster paths", () => {
        process.env.NEXT_PUBLIC_API_URL = "https://chinverse-backend.hf.space/api/v1";
        expect(isPublicOptimizableMediaUrl("/assets/chinverse/icon.png")).toBe(true);
        expect(isPublicOptimizableMediaUrl("/api/backend/media/public-images/42")).toBe(true);
        expect(isPublicOptimizableMediaUrl("https://chinverse-backend.hf.space/uploads/avatars/a.webp")).toBe(true);
        expect(getMediaUrl("/uploads/gallery/a.webp")).toBe("https://chinverse-backend.hf.space/uploads/gallery/a.webp");
    });

    it("does not widen the API origin when it is repeated as a CDN", () => {
        const originalApi = process.env.NEXT_PUBLIC_API_URL;
        const originalCdn = process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
        process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/api/v1";
        process.env.NEXT_PUBLIC_IMAGE_CDN_URL = "https://api.example.test";
        try {
            expect(isPublicOptimizableMediaUrl(
                "https://api.example.test/api/v1/media/assets/9/content?token=private",
            )).toBe(false);
            expect(isPublicOptimizableMediaUrl(
                "https://api.example.test/api/v1/media/public-images/9",
            )).toBe(true);
        } finally {
            if (originalApi === undefined) delete process.env.NEXT_PUBLIC_API_URL;
            else process.env.NEXT_PUBLIC_API_URL = originalApi;
            if (originalCdn === undefined) delete process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
            else process.env.NEXT_PUBLIC_IMAGE_CDN_URL = originalCdn;
        }
    });

    it("never optimizes entitlement-protected or unknown media", () => {
        process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/api/v1";
        expect(isPublicOptimizableMediaUrl("/api/backend/media/assets/5/content?token=secret")).toBe(false);
        expect(isPublicOptimizableMediaUrl("data:image/png;base64,AAAA")).toBe(false);
        expect(isPublicOptimizableMediaUrl("https://unknown.example/avatar.jpg")).toBe(false);
    });

    it("allows explicitly configured public CDN origins", () => {
        process.env.NEXT_PUBLIC_IMAGE_CDN_URL = "https://images.example.test";
        expect(isPublicOptimizableMediaUrl("https://images.example.test/covers/hsk.webp")).toBe(true);
    });
});
