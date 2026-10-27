import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

test.setTimeout(180_000);

async function setup(page: Page) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
        localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true");
        const positions = new WeakMap<HTMLMediaElement, number>();
        const playing = new WeakMap<HTMLMediaElement, boolean>();
        const started = new WeakMap<HTMLMediaElement, number>();
        const sources = new WeakMap<HTMLMediaElement, string>();
        Object.defineProperties(HTMLMediaElement.prototype, {
            currentTime: { configurable: true, get() { return (positions.get(this) || 0) + (playing.get(this) ? (performance.now() - (started.get(this) || 0)) / 1000 * this.playbackRate : 0); }, set(value) { positions.set(this, value); started.set(this, performance.now()); } },
            duration: { configurable: true, get() { return 10; } },
            paused: { configurable: true, get() { return !playing.get(this); } },
            src: { configurable: true, get() { return sources.get(this) || ""; }, set(value) { sources.set(this, value); } },
        });
        HTMLMediaElement.prototype.load = function () { if (sources.get(this)) setTimeout(() => this.dispatchEvent(new Event("loadedmetadata")), 0); };
        HTMLMediaElement.prototype.play = async function () { started.set(this, performance.now()); playing.set(this, true); this.dispatchEvent(new Event("play")); };
        HTMLMediaElement.prototype.pause = function () { positions.set(this, this.currentTime); playing.set(this, false); this.dispatchEvent(new Event("pause")); };
    });
    let complete = false, watched = 0, profileWrites = 0;
    let name = "تارا نمایشی";
    let pathFails = false;
    const playbackQueries: string[] = [];
    const writes: Record<string, unknown>[] = [];
    const steps = () => [
        { lesson_id: 501, course_id: 121, course_title: "HSK 1", domain: "hsk", title: "آشنایی و شروع سفر", summary: "اولین قدم در یادگیری زبان چینی", duration_minutes: 1, cover_url: null, kind: "lesson", state: complete ? "completed" : "current" },
        { lesson_id: 601, course_id: 122, course_title: "کاوش", domain: "podcasts", title: "مکالمهٔ واقعی", summary: "تمرین شنیدن و درک مکالمه", duration_minutes: 1, cover_url: null, kind: "explore", state: complete ? "current" : "locked" },
        { lesson_id: 502, course_id: 121, course_title: "HSK 1", domain: "hsk", title: "الفبا و تلفظ پایه", summary: "آشنایی با پین‌یین", duration_minutes: 1, cover_url: null, kind: "lesson", state: "locked" },
    ];
    await page.route("**/api/backend/**", async route => {
        const request = route.request(), url = new URL(request.url());
        const endpoint = url.pathname.replace("/api/backend", "");
        let body: unknown = [];
        if (endpoint === "/auth/refresh") body = { access_token: "isolated-learning-redesign-session" };
        else if (endpoint === "/users/me") body = { id: 1, email: "lesson@example.com", phone: "09121234567", profile: { display_name: name, headline: "عنوان قدیمی", country: "ایران", city: "تهران", profile_truth_confirmed: false } };
        else if (endpoint === "/users/me/profile") { writes.push(request.postDataJSON()); name = request.postDataJSON().display_name; profileWrites++; body = { id: 1, profile: { display_name: name } }; }
        else if (endpoint === "/learning-path") {
            if (pathFails) return route.fulfill({ status: 503, json: { detail: "temporary failure" } });
            body = { steps: steps(), completed_count: complete ? 1 : 0, total_count: 3, next_lesson_id: complete ? 601 : 501 };
        } else if (endpoint === "/courses/") {
            body = [{ id: 121, slug: "hsk-1", subcategory_slug: "hsk", title: "HSK 1", description: "", level: "beginner", sections: [{ id: 1, lessons: [
                { id: 501, metadata_json: { lesson_index: 1 } }, { id: 502, metadata_json: { lesson_index: 2 } },
            ] }] }];
        } else if (endpoint === "/courses/121" || endpoint === "/courses/122") {
            const isPodcast = endpoint.endsWith("122");
            body = { id: isPodcast ? 122 : 121, title: isPodcast ? "کاوش" : "HSK 1", description: "دورهٔ آزمایشی", level: "beginner", sections: [{ id: 1, lessons: isPodcast ? [{ id: 601, title: "مکالمهٔ واقعی" }] : [{ id: 501, title: "آشنایی و شروع سفر" }, { id: 502, title: "الفبا و تلفظ پایه" }] }] };
        } else if (/\/courses\/lessons\/\d+\/playback/.test(endpoint)) {
            playbackQueries.push(url.search);
            const id = Number(endpoint.split("/")[3]);
            if (id !== 501 && !complete) return route.fulfill({ status: 409, json: { detail: "Watch the previous step" } });
            body = { lesson: { id, course_id: id === 601 ? 122 : 121, title: "ویدیوی آزمایشی", duration_seconds: 10 }, media: { id: 4, playback_type: "mp4", playback_url: `/api/v1/media/assets/4/content?lesson_id=${id}&subject_id=1&expires=1914537600&signature=${"a".repeat(43)}`, expires_at: "2030-01-01T00:00:00Z" }, entitlement: { granted: true, required: false }, subtitles: [] };
        } else if (endpoint === "/daily-activity/video-progress") {
            const payload = request.postDataJSON();
            watched += payload.seconds_delta;
            if (payload.lesson_id === 501 && watched >= 9 && payload.position_seconds >= 9) complete = true;
            body = { lesson_completed: complete };
        } else if (endpoint === "/collections/saved") body = [{ domain: "hsk", slug: "hsk-1" }];
        else if (endpoint === "/admin/me") body = { is_admin: false };
        else if (endpoint.includes("unread-count")) body = { count: 0 };
        else if (endpoint === "/community/questions") body = [];
        else if (endpoint === "/community/articles") body = [];
        await route.fulfill({ json: body });
    });
    return { playbackQueries, writes, get profileWrites() { return profileWrites; }, set pathFails(value: boolean) { pathFails = value; } };
}

test("profile has only identity, header shortcuts and sequential learning cards", async ({ page }, info) => {
    await setup(page);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "تارا نمایشی", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "مسیر یادگیری", exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "مرحله‌های مسیر یادگیری" }).locator("li")).toHaveCount(16);
    await expect(page.locator('[data-availability="upcoming"]')).toHaveCount(13);
    await expect(page.locator('[data-state="locked"] a')).toHaveCount(0);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    for (const label of ["درباره من", "رزومه", "گالری", "خدمات", "عنوان قدیمی", "تهران", "ویترین", "پیام‌های من"]) await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    const nav = page.getByRole("navigation", { name: "ناوبری اصلی" });
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "مجموعه‌های منتخب", exact: true })).toHaveAttribute("href", "/profile/collections");
    const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(audit.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: path.resolve("../artifacts", `learning-profile-${info.project.name}.png`), fullPage: true });
    await page.getByRole("link", { name: "مجموعه‌های منتخب", exact: true }).click();
    await expect(page).toHaveURL(/\/profile\/collections/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "مجموعه‌های منتخب", exact: true })).toBeVisible();
    await expect(page.locator('main a[href="/hsk/hsk-1"]')).toHaveCount(1);
});

test("home hosts the forum, keeps learning progress and offers support from both destinations", async ({ page }) => {
    await setup(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "تالار گفتگو", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("textbox", { name: "متن سوال", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "تالار گفتگو", exact: true })).toHaveCount(0);
    await expect(page.getByText("فعالیت‌ها", { exact: true })).toHaveCount(0);
    await expect(page.getByText("پیام‌های من", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "پشتیبانی", exact: true })).toHaveAttribute("href", "/support");
    const support = page.locator(".forum-support-shortcut");
    const placement = await support.evaluate(element => {
        const button = element.getBoundingClientRect(), frame = element.closest(".app-frame")!.getBoundingClientRect();
        const nav = document.querySelector('[aria-label="ناوبری اصلی"]')!.getBoundingClientRect();
        return { right: frame.right - button.right, aboveNavigation: button.bottom < nav.top, width: button.width };
    });
    expect(placement.right).toBeGreaterThanOrEqual(16);
    expect(placement.right).toBeLessThanOrEqual(24);
    expect(placement.aboveNavigation).toBe(true);
    expect(placement.width).toBe(52);
    await page.getByRole("link", { name: "مقالات", exact: true }).click();
    await expect(page).toHaveURL(/section=articles/);
    await page.reload();
    await expect(page.getByRole("link", { name: "مقالات", exact: true })).toHaveAttribute("aria-current", "page");
    await page.goto("/settings");
    const rows = page.locator("main > div > a");
    const labels = await rows.allTextContents();
    expect(labels.findIndex(label => label.includes("پشتیبانی"))).toBe(labels.findIndex(label => label.includes("درباره چین‌ورس")) + 1);
    await expect(page.getByRole("link", { name: /پشتیبانی/ })).toHaveAttribute("href", "/support");
    await page.goto("/settings/about");
    await expect(page.getByText("چین‌ورس یک پلتفرم آموزشی جذاب و تعاملیه", { exact: false })).toBeVisible();
    await expect(page.getByText("با چین‌ورس، زبان چینی رو زندگی کن!", { exact: true })).toBeAttached();
    await expect(page.getByText(/رزومه‌ات رو بسازی/)).toHaveCount(0);
});

test("account saves the name without job, location, gender or the removed confirmation", async ({ page }) => {
    const state = await setup(page);
    await page.goto("/account");
    await expect(page.getByLabel("نام و نام خانوادگی", { exact: true })).toHaveValue("تارا نمایشی");
    await expect(page.locator("#account-headline, #account-gender, #account-country, #account-city, #account-profile-truth")).toHaveCount(0);
    await page.getByLabel("نام و نام خانوادگی", { exact: true }).fill("تارا آزمایشی");
    await page.getByRole("button", { name: "ذخیره", exact: true }).click();
    await expect(page.locator("main").getByRole("status")).toContainText("تغییرات با موفقیت ذخیره شد.");
    expect(state.profileWrites).toBe(1);
    expect(state.writes).toEqual([{ display_name: "تارا آزمایشی" }]);
    await page.reload();
    await expect(page.getByLabel("نام و نام خانوادگی", { exact: true })).toHaveValue("تارا آزمایشی");
});

test("watching a step unlocks the next video, including a recommendation from another course", async ({ page }) => {
    await page.clock.install();
    const state = await setup(page);
    await page.goto("/profile");
    await page.getByRole("link", { name: "مرحلهٔ ۱: آشنایی و شروع سفر", exact: true }).click();
    await expect(page).toHaveURL(/roadmap=1/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "آشنایی و شروع سفر", exact: true })).toBeVisible();
    await expect.poll(() => state.playbackQueries.some(query => query.includes("learning_path=true"))).toBe(true);
    const video = page.locator("video");
    await video.evaluate(async (element: HTMLVideoElement) => { await element.play(); });
    await page.clock.runFor(10_000);
    await video.evaluate(element => element.dispatchEvent(new Event("ended")));
    await page.clock.resume();
    await expect(page.getByRole("link", { name: "مرحلهٔ بعدی", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "مرحلهٔ بعدی", exact: true }).click();
    await expect(page).toHaveURL(/\/watch\/podcasts\/122\?lesson=601/);
    await page.getByRole("link", { name: "بازگشت به مسیر یادگیری", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByRole("link", { name: "مرحلهٔ ۲: مکالمهٔ واقعی", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
});

test("failed path requests remain retryable and retired product URLs redirect", async ({ page }) => {
    const state = await setup(page); state.pathFails = true;
    await page.goto("/profile");
    await expect(page.getByRole("alert").filter({ hasText: "مسیر یادگیری دریافت نشد." })).toBeVisible();
    state.pathFails = false;
    await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
    await expect(page.getByRole("list", { name: "مرحله‌های مسیر یادگیری" })).toBeVisible();
    for (const [from, to] of [["/showcase", "/explore"], ["/chat", "/"], ["/chat/9", "/"], ["/profile/network", "/profile"]]) {
        await page.goto(from);
        await expect(page).toHaveURL(url => url.pathname === to);
    }
});

test("partial watching is visible on the path and does not unlock the next step", async ({ page }) => {
    await page.clock.install();
    await setup(page);
    await page.goto("/profile");
    await page.getByRole("link", { name: "مرحلهٔ ۱: آشنایی و شروع سفر", exact: true }).click();
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(page.locator("[data-watch-progress]")).toBeVisible();
    await video.evaluate(async (element: HTMLVideoElement) => { await element.play(); });
    await page.clock.runFor(5_000);
    await video.evaluate((element: HTMLVideoElement) => element.pause());
    await page.clock.resume();
    await expect(page.locator("[data-watch-progress]")).toContainText("۵۰٪");
    await page.getByRole("link", { name: "بازگشت به مسیر یادگیری", exact: true }).click();
    await expect(page.getByText("۵۰٪ تماشا شده · ادامهٔ درس", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await expect(page.getByRole("link", { name: "مرحلهٔ ۲: مکالمهٔ واقعی", exact: true })).toHaveCount(0);
});

test("secondary headers share a centered rounded card across settings and saved collections", async ({ page }, info) => {
    await setup(page);
    for (const route of ["/settings", "/settings/appearance", "/settings/about", "/settings/app", "/settings/daily", "/account", "/account/security", "/profile/collections"]) {
        await page.goto(route);
        const header = page.locator('[data-header-variant="card"]');
        await expect(header).toBeVisible();
        await expect.poll(() => header.locator("[data-back-button]").evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(46, 1);
        const metrics = await header.evaluate(element => {
            const card = element.getBoundingClientRect(), title = element.querySelector("[data-header-title]")!.getBoundingClientRect();
            const back = element.querySelector("[data-back-button]")!.getBoundingClientRect(), frame = element.closest(".app-scroll")!.getBoundingClientRect();
            return { radius: getComputedStyle(element).borderRadius, centered: Math.abs((card.left + card.width / 2) - (title.left + title.width / 2)), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                backWidth: back.width, backHeight: back.height, backRight: frame.right - back.right, backTop: back.top - frame.top };
        });
        expect(metrics.radius).toBe("22px");
        expect(metrics.centered).toBeLessThanOrEqual(1);
        expect(metrics.overflow).toBeLessThanOrEqual(1);
        expect(metrics.backWidth).toBeCloseTo(46, 1);
        expect(metrics.backHeight).toBeCloseTo(46, 1);
        expect(metrics.backRight).toBeCloseTo(29, 1);
        expect(metrics.backTop).toBeCloseTo(29, 1);
        if (route === "/settings/appearance" || route === "/account" || route === "/profile/collections") await page.screenshot({ path: path.resolve("../artifacts", `refined-header-${route.replaceAll("/", "-")}-${info.project.name}.png`) });
    }
    await expect(page.locator(".forum-support-shortcut")).toHaveCount(0);
});

test("one available video is followed by fourteen locked syllabus stages", async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 1400 });
    const state = await setup(page);
    await page.route("**/api/backend/learning-path", route => route.fulfill({ json: {
        steps: [{ lesson_id: 501, course_id: 121, course_title: "HSK 1", domain: "hsk", title: "آشنایی و شروع سفر", summary: "اولین قدم در یادگیری زبان چینی", duration_minutes: 1, cover_url: null, kind: "lesson", state: "current" }],
        completed_count: 0, total_count: 1, next_lesson_id: 501,
    } }));
    await page.goto("/profile");
    await expect(page.getByRole("list", { name: "مرحله‌های مسیر یادگیری" }).locator("li")).toHaveCount(15);
    const upcoming = page.locator('[data-availability="upcoming"]');
    await expect(upcoming).toHaveCount(14);
    await expect(upcoming.locator("a, button")).toHaveCount(0);
    const locked = upcoming.first().locator('[aria-disabled="true"]');
    await expect(locked).toBeVisible();
    await expect(locked).toHaveAttribute("aria-label", /درس ۲.*قفل است/);
    await locked.click();
    await expect(page).toHaveURL(/\/profile$/);
    expect(state.playbackQueries).toEqual([]);
    await page.locator(".app-scroll").evaluate(element => element.scrollTo(0, 0));
    await page.screenshot({ path: path.resolve("../artifacts", `upcoming-learning-stages-${info.project.name}.png`), scale: "css" });
});

test("an empty published catalog shows the planned syllabus with no playable lessons", async ({ page }) => {
    await setup(page);
    await page.route("**/api/backend/learning-path", route => route.fulfill({ json: { steps: [], total_count: 0, completed_count: 0, next_lesson_id: null } }));
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "مسیرت به‌زودی شروع می‌شود", exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "مرحله‌های مسیر یادگیری" }).locator("li")).toHaveCount(15);
    await expect(page.locator('[data-availability="upcoming"] a')).toHaveCount(0);
    await expect(page.locator('[data-availability="published"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "رفتن به کاوش", exact: true })).toHaveAttribute("href", "/explore");
});

test("a direct URL to a locked video explains the prerequisite and returns to the path", async ({ page }) => {
    await setup(page);
    await page.goto("/watch/hsk/121?lesson=502&roadmap=1&returnTo=%2Fprofile");
    await expect(page.getByText("برای بازشدن این مرحله، ویدیوی مرحلهٔ قبلی مسیر یادگیری را تماشا کن.", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert").getByRole("link", { name: "بازگشت به مسیر یادگیری", exact: true })).toHaveAttribute("href", "/profile");
});

for (const theme of ["light", "dark"] as const) {
    test(`learning cards remain readable at 320px in ${theme}`, async ({ page }, info) => {
        await page.setViewportSize({ width: 320, height: 844 });
        await page.addInitScript(value => localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ theme: value })), theme);
        await setup(page);
        await page.goto("/profile");
        await expect(page.getByRole("list", { name: "مرحله‌های مسیر یادگیری" })).toBeVisible();
        expect(await page.locator(".app-scroll").evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
        const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
        expect(audit.violations).toEqual([]);
        await page.screenshot({ path: path.resolve("../artifacts", `learning-profile-320-${theme}-${info.project.name}.png`) });
    });
}
