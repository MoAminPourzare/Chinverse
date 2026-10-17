import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

test.setTimeout(150_000);
const stamp = "2026-10-17T10:00:00Z";
const courseTitle = "دورهٔ جامع یادگیری زبان چینی با عنوان طولانی";

async function setup(page: Page) {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
        localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true");
        class Socket {
            static OPEN = 1; readyState = 1;
            onopen: (() => void) | null = null; onclose: (() => void) | null = null;
            onmessage: ((event: { data: string }) => void) | null = null;
            constructor() { setTimeout(() => this.onopen?.(), 0); }
            send() {}
            close() { this.readyState = 3; this.onclose?.(); }
        }
        Object.defineProperty(window, "WebSocket", { configurable: true, value: Socket });
    });
    await page.route("**/api/backend/**", async route => {
        const endpoint = new URL(route.request().url()).pathname.replace("/api/backend", "");
        let body: unknown = [];
        if (endpoint === "/auth/refresh") body = { access_token: "isolated-centered-headers" };
        else if (endpoint === "/users/me") body = { id: 1, profile: { display_name: "کاربر آزمایشی", resume: {} } };
        else if (endpoint === "/courses/121") body = { id: 121, title: courseTitle, description: "", level: "HSK1", price: 0, sections: [{ id: 1, lessons: [{ id: 501, title: "درس اول با عنوان فارسی و 中文" }] }] };
        else if (endpoint.includes("/playback")) return route.fulfill({ status: 503, json: { detail: "isolated media unavailable" } });
        else if (endpoint === "/users/me/services/public/9") body = { id: 9, title: "راهنمای تور سفر چین", description: "راهنمایی سفر", created_at: stamp, provider: { id: 2, display_name: "عرفان" } };
        else if (endpoint === "/users/2/public") body = { id: 2, profile: { display_name: "مشاور سفر چین", resume: {} }, gallery_items: [] };
        else if (endpoint === "/chat/2/presence") body = { is_online: false };
        else if (endpoint === "/feed/posts/12") body = { id: 12, caption: "پست آزمایشی", image_url: "", created_at: stamp, likes_count: 0, comments_count: 0, provider: { id: 2, display_name: "عرفان" } };
        else if (endpoint.startsWith("/engagements/")) body = { liked: false, likes_count: 0, comments_count: 0 };
        else if (endpoint === "/leitner/review") body = { cards: [{ id: 1, box_number: 1, word: { id: 1, chinese: "学习", pinyin: "xuéxí", persian_meaning: "آموختن" } }] };
        else if (endpoint.endsWith("/unread-count")) body = { count: 0 };
        else if (endpoint.endsWith("/followers-count")) body = { followers_count: 0 };
        else if (endpoint.endsWith("/following-count")) body = { following_count: 0 };
        else if (endpoint === "/admin/me") return route.fulfill({ status: 403, json: { detail: "not admin" } });
        await route.fulfill({ json: body });
    });
    return errors;
}

for (const width of [320, 390]) {
    test(`page titles stay centered and clear of the right back control at ${width}px`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 844 });
        const errors = await setup(page);
        const routes = [
            ["arts", "/explore/groups/arts"],
            ["culture", "/explore/groups/culture"],
            ["entertainment", "/explore/groups/entertainment"],
            ["idioms-lesson", "/idioms/beckybunny-idiom-stories/lesson/1"],
            ["hsk-lesson", "/hsk/hsk-1/lesson/1"],
            ["collection", "/explore/grammar"],
            ["grouped-lessons", "/grammar/chinese-zero-to-hero-grammar/lesson/1"],
            ["player", "/watch/pronunciation/121?lesson=501"],
            ["course", "/pronunciation/121"],
            ["service", "/services/9"],
            ["daily", "/settings/daily"],
            ["network", "/profile/network"],
            ["review", "/leitner/review"],
            ["account", "/account"],
            ["conversation", "/chat/2"],
            ["post", "/posts/12"],
            ["explore", "/explore?returnTo=%2F%3Ftab%3Ddaily"],
            ["community", "/community"],
        ];
        for (const [name, url] of routes) {
            await page.goto(url, { waitUntil: "domcontentloaded" });
            const header = page.locator(name === "conversation" ? ".app-scroll header" : "[data-page-header]").first();
            await expect(header).toBeVisible();
            await page.waitForFunction(() => document.fonts.status === "loaded");
            if (name !== "conversation") await expect.poll(() => header.evaluate(el => el.style.getPropertyValue("--app-header-top")), { message: url }).not.toBe("");
            else await expect(header.getByRole("heading", { level: 1 })).toHaveText("مشاور سفر چین");
            const title = await header.locator("[data-header-title]").count() ? header.locator("[data-header-title]").first() : header.locator("h1");
            await expect(title).toBeVisible();
            const alignment = await title.evaluate(el => {
                const heading = el.querySelector("h1") || el;
                const range = document.createRange();
                range.selectNodeContents(heading);
                const text = range.getBoundingClientRect();
                const scroll = document.querySelector<HTMLElement>(".app-scroll")!;
                const frame = scroll.getBoundingClientRect();
                const center = frame.left + scroll.clientLeft + scroll.clientWidth / 2;
                const back = document.querySelector("[data-back-button]")!.getBoundingClientRect();
                return { centerDelta: Math.abs((text.left + text.right) / 2 - center), align: getComputedStyle(heading).textAlign, textRight: text.right, backLeft: back.left };
            });
            expect(alignment.align, url).toBe("center");
            expect(alignment.centerDelta, url).toBeLessThanOrEqual(1.5);
            expect(alignment.textRight, url).toBeLessThanOrEqual(alignment.backLeft - 1);
            if (["course", "service", "post"].includes(name)) {
                const titleBox = (await title.boundingBox())!;
                const backBox = (await header.locator("[data-back-button]").boundingBox())!;
                expect(Math.abs(titleBox.y + titleBox.height / 2 - backBox.y - backBox.height / 2), url).toBeLessThanOrEqual(1);
            }
            const copy = title.locator("p");
            for (const paragraph of await copy.all()) await expect(paragraph).toHaveCSS("text-align", "center");
            const top = (await header.boundingBox())!.y;
            await page.locator(".app-scroll").evaluate(el => el.scrollTo(0, el.scrollHeight));
            await expect.poll(async () => Math.abs((await header.boundingBox())!.y - top)).toBeLessThanOrEqual(1);
            await page.locator(".app-scroll").evaluate(el => el.scrollTo(0, 0));
            if (name === "service") await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("text-align", "center");
            if (width === 390 && ["arts", "idioms-lesson", "service", "course"].includes(name)) {
                await page.screenshot({ path: path.resolve("../artifacts", `centered-title-${name}-${info.project.name}.png`) });
            }
            expect(await page.locator(".app-scroll").evaluate(el => el.scrollWidth - el.clientWidth), url).toBeLessThanOrEqual(1);
        }
        expect(errors).toEqual([]);
    });
}
