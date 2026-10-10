import { expect, it } from "vitest";
import { getSocialProfileUrl, normalizeSocialHandle } from "./socialLinks";

it("keeps legacy WeChat IDs searchable without creating unsupported profile URLs", () => {
    for (const value of ["chinverse_id", " @chinverse_id ", "wechat:chinverse_id", "weixin://dl/chat?chinverse_id"]) {
        expect(normalizeSocialHandle("wechat", value)).toBe("chinverse_id");
        expect(getSocialProfileUrl("wechat", value)).toBeNull();
    }
});

it("preserves the supported social profile destinations", () => {
    expect(getSocialProfileUrl("instagram", "@chinverse_app")).toBe("https://instagram.com/chinverse_app");
    expect(getSocialProfileUrl("telegram", "https://t.me/chinverse_app")).toBe("https://t.me/chinverse_app");
    expect(getSocialProfileUrl("linkedin", "https://linkedin.com/in/chinverse-academy")).toBe("https://linkedin.com/in/chinverse-academy");
    expect(getSocialProfileUrl("whatsapp", "+98 912 345 6789")).toBe("https://wa.me/989123456789");
    expect(getSocialProfileUrl("x", "@chinverse_app")).toBe("https://x.com/chinverse_app");
    expect(getSocialProfileUrl("facebook", "chinverse.app")).toBe("https://facebook.com/chinverse.app");
});
