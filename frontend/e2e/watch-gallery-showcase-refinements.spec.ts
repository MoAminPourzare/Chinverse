import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

test.setTimeout(90_000);
type State = "new" | "known" | "leitner";
const stamp = "2026-10-08T10:00:00Z";
const friend = "朋友";
const particle = "的";

async function mediaAndSession(page: Page) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
        localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true");
        localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ leitnerHighlightColor: "violet", newWordHighlightColor: "amber", autoplayNext: true }));
        const sources = new WeakMap<HTMLMediaElement, string>();
        Object.defineProperty(HTMLMediaElement.prototype, "src", { configurable: true, get() { return sources.get(this) || ""; }, set(value) { sources.set(this, value); } });
        Object.defineProperty(HTMLMediaElement.prototype, "duration", { configurable: true, get() { return 10; } });
        HTMLMediaElement.prototype.removeAttribute = function (name: string) { if (name === "src") sources.delete(this); Element.prototype.removeAttribute.call(this, name); };
        HTMLMediaElement.prototype.load = function () { const source = sources.get(this); if (source) setTimeout(() => { if (sources.get(this) === source) this.dispatchEvent(new Event("loadedmetadata")); }, 0); };
        HTMLMediaElement.prototype.play = async function () { this.setAttribute("data-test-played", "true"); this.dispatchEvent(new Event("play")); };
        HTMLMediaElement.prototype.pause = function () { this.dispatchEvent(new Event("pause")); };
        class Speech {
            lang = ""; voice: unknown; rate = 1; onend: (() => void) | null = null; onerror: (() => void) | null = null;
            constructor(public text: string) {}
        }
        Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Speech });
        Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
            getVoices: () => [{ lang: "zh-CN", name: "Mandarin" }], cancel() {}, addEventListener() {}, removeEventListener() {},
            speak(speech: Speech) { document.documentElement.dataset.testSpeech = speech.text + ":" + speech.lang; setTimeout(() => speech.onend?.(), 0); },
        } });
        class Socket {
            static OPEN = 1; static CONNECTING = 0; readyState = 1;
            onopen: (() => void) | null = null; onclose: (() => void) | null = null;
            onmessage: ((event: { data: string }) => void) | null = null;
            constructor() { setTimeout(() => this.onopen?.(), 0); }
            send(raw: string) { const data = JSON.parse(raw); if (data.type === "auth") this.onmessage?.({ data: JSON.stringify({ type: "connection:ready", user_id: 1 }) }); }
            close() { this.readyState = 3; this.onclose?.(); }
        }
        Object.defineProperty(window, "WebSocket", { configurable: true, value: Socket });
    });
}

test("a published video and its next lesson keep the journey back to learning progress", async ({ page }) => {
    await setup(page);
    await page.route("**/api/backend/engagements/course/121", route => route.fulfill({ json: { liked: false, likes_count: 0, comments_count: 0 } }));
    const today = { date: "2026-10-08", minutes: 15, watched_seconds: 900, learned_words_count: 4, reviewed_words_count: 2, is_active: true };
    await page.route("**/api/backend/daily-activity/summary**", route => route.fulfill({ json: { today, streak: { current_days: 2, longest_days: 3, last_active_date: today.date }, totals: { ...today, active_days: 2 }, calendar: [], weekly_chart: [], learning: { due_flashcards: 1, mastered_words: 2, total_flashcards: 3 } } }));
    const explore = "/explore?returnTo=%2F%3Ftab%3Ddaily";
    const course = `/pronunciation/121?returnTo=${encodeURIComponent(explore)}`;
    await ready(page, course);
    await page.getByRole("link", { name: "شروع", exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === "/watch/pronunciation/121" && url.searchParams.get("lesson") === "501");
    const back = page.getByRole("link", { name: "بازگشت", exact: true });
    await expect(back).toHaveAttribute("href", course);
    await page.locator("video").evaluate(element => element.dispatchEvent(new Event("ended")));
    await page.getByRole("region", { name: "پایان درس", exact: true }).getByRole("button", { name: "پخش درس بعدی", exact: true }).click();
    await expect(page).toHaveURL(url => url.searchParams.get("lesson") === "502");
    await expect(back).toHaveAttribute("href", course);
    await back.click();
    await expect(page).toHaveURL(url => url.pathname === "/pronunciation/121");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("دورهٔ آزمایشی");
    await expect(back).toHaveAttribute("href", explore);
    await back.click();
    await expect(page).toHaveURL(url => url.pathname === "/explore");
    await expect(page.getByRole("heading", { name: "کاوش", exact: true })).toBeVisible();
    await expect(back).toHaveAttribute("href", "/?tab=daily");
    await back.click();
    await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "مرور لغات", exact: true })).toBeVisible();
});

async function ready(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

async function setup(page: Page) {
    await mediaAndSession(page);
    const states: Record<string, State> = {};
    let knownWrites = 0;
    let failKnown = false;
    let heldKnowledgeRead: Promise<void> | null = null;
    let releaseKnowledgeRead: (() => void) | undefined;
    let gallery = [{ id: 12, user_id: 1, image_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=", caption: "عکس اول", created_at: stamp, updated_at: stamp }];
    let comments = [{ id: 24, user_id: 2, target_type: "post", target_id: 12, content: "دیدگاه مهمان", created_at: stamp, author: { id: 2, display_name: "مهمان" } }];
    let galleryEdits = 0;
    let galleryFileEdits = 0;
    let galleryDeletes = 0;
    let commentDeletes = 0;
    await page.route("**/api/backend/**", async (route) => {
        const request = route.request();
        const url = decodeURIComponent(new URL(request.url()).pathname.replace("/api/backend", ""));
        const method = request.method();
        let body: unknown = [];
        if (url === "/auth/refresh") body = { access_token: "isolated-watch-gallery-session" };
        else if (url === "/users/me") body = { id: 1, email: "viewer@example.com", profile: { display_name: "کاربر آزمایشی", bio: "", resume: {} } };
        else if (url === "/courses/121") body = { id: 121, title: "دورهٔ آزمایشی", description: "", level: "HSK1", sections: [{ id: 1, lessons: [{ id: 501, title: "درس اول", is_free: true }, { id: 502, title: "درس دوم", is_free: true }] }] };
        else if (/^\/courses\/lessons\/\d+\/playback$/.test(url)) {
            const id = Number(url.split("/")[3]);
            body = { lesson: { id, course_id: 121, title: id === 501 ? "درس اول" : "درس دوم", duration_seconds: 10 }, media: { id: 31, playback_type: "mp4", expires_at: new Date(Date.now() + 600_000).toISOString(), playback_url: "/api/v1/media/assets/31/content?lesson_id=" + id + "&subject_id=1&expires=9999999999&signature=" + "a".repeat(64) }, entitlement: { required: false, granted: true }, subtitles: [{ id: 1, language: "zh-fa", format: "json", status: "published", quality_status: "valid", version: 1, cues: [{ id: 1, start: 0, end: 10, zh_text: friend + particle, pinyin: "péngyou de", target_text: "دوست", highlighted_words: [friend, particle] }] }] };
        } else if (url === "/vocabulary/matches") body = { matches: request.postDataJSON().texts.map(() => [friend, particle]) };
        else if (url === "/vocabulary/knowledge" || url === "/vocabulary/known") {
            if (url === "/vocabulary/knowledge" && heldKnowledgeRead) await heldKnowledgeRead;
            if (url === "/vocabulary/known") {
                knownWrites++;
                if (failKnown) return route.fulfill({ status: 503, json: { detail: "temporary failure" } });
                for (const word of request.postDataJSON().words) if (states[word] !== "leitner") states[word] = "known";
            }
            body = { states: Object.fromEntries(request.postDataJSON().words.map((word: string) => [word, states[word] || "new"])) };
        } else if (url.startsWith("/vocabulary/")) body = { id: url.endsWith(friend) ? 1 : 2, chinese: url.split("/").pop(), pinyin: url.endsWith(friend) ? "péngyou" : "de", level: "HSK1", audio_url: null, examples: [] };
        else if (url.startsWith("/leitner/check/")) body = { in_leitner: states[Number(url.split("/").pop()) === 1 ? friend : particle] === "leitner" };
        else if (url === "/leitner/add") { states[request.postDataJSON().word_id === 1 ? friend : particle] = "leitner"; body = {}; }
        else if (url === "/users/me/gallery") body = gallery;
        else if (url === "/users/me/gallery/12" && method === "PATCH") {
            galleryEdits++;
            expect(request.postData()).toContain("توضیح تازه");
            if (request.postData()?.includes('name="file"')) galleryFileEdits++;
            gallery = [{ ...gallery[0], caption: "توضیح تازه" }]; body = gallery[0];
        } else if (url === "/users/me/gallery/12" && method === "DELETE") { galleryDeletes++; gallery = []; return route.fulfill({ status: 204 }); }
        else if (url === "/engagements/post/12/comments/24" && method === "DELETE") { commentDeletes++; comments = []; return route.fulfill({ status: 204 }); }
        else if (url === "/engagements/post/12/comments") body = comments;
        else if (url === "/engagements/post/12") body = { liked: false, likes_count: 0, comments_count: comments.length };
        else if (url === "/engagements/service/9") body = { liked: false, likes_count: 0, comments_count: 0 };
        else if (url === "/users/2/public") body = { id: 2, profile: { display_name: "مشاور چینی" }, gallery_items: [] };
        else if (url === "/chat/2/presence") body = { is_online: false };
        else if (url === "/users/showcase") body = [{ id: 2, display_name: "متخصص تهران", headline: "مترجم", country: "ایران", city: "تهران", gallery_preview: [] }, { id: 3, display_name: "متخصص فارس", headline: "مترجم", country: "ایران", city: "فارس", gallery_preview: [] }];
        else if (url === "/users/me/services/public") body = [{ id: 9, title: "مشاوره چین", description: "خدمات آزمایشی", provider: { id: 2, display_name: "متخصص تهران", country: "ایران", city: "تهران", headline: "مترجم" } }];
        else if (url.endsWith("/unread-count")) body = { count: 0 };
        await route.fulfill({ json: body });
    });
    return { states, get knownWrites() { return knownWrites; }, set failKnown(value: boolean) { failKnown = value; },
        holdKnowledge() { heldKnowledgeRead = new Promise<void>((resolve) => { releaseKnowledgeRead = resolve; }); },
        releaseKnowledge() { releaseKnowledgeRead?.(); heldKnowledgeRead = null; },
        get galleryEdits() { return galleryEdits; }, get galleryFileEdits() { return galleryFileEdits; }, get galleryDeletes() { return galleryDeletes; }, get commentDeletes() { return commentDeletes; } };
}

test("word pronunciation has a Mandarin fallback and adding to Leitner updates every occurrence immediately and after reload", async ({ page }) => {
    const state = await setup(page);
    await ready(page, "/watch/hsk/121?lesson=501");
    const word = page.locator('[data-vocabulary-word="朋友"]').last();
    await expect(word).toHaveAttribute("data-vocabulary-state", "new");
    await word.click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("button", { name: "پخش تلفظ", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-test-speech", friend + ":zh-CN");
    await modal.getByRole("button", { name: "اضافه کردن به لایتنر", exact: true }).click();
    await expect(word).toHaveAttribute("data-vocabulary-state", "leitner");
    await expect(word).toHaveCSS("background-color", "rgb(221, 214, 254)");
    await modal.getByRole("button", { name: "بستن اطلاعات واژه", exact: true }).click();
    state.holdKnowledge();
    await page.reload();
    await expect(word).toHaveAttribute("data-vocabulary-state", "loading");
    await expect(word).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    state.releaseKnowledge();
    await expect(word).toHaveAttribute("data-vocabulary-state", "leitner");
});

test("lesson end offers all three actions, confirmation cancels safely, knowledge persists and the next lesson starts in the same player", async ({ page }, info) => {
    const state = await setup(page);
    state.states[friend] = "leitner";
    await ready(page, "/watch/hsk/121?lesson=501");
    const video = page.locator("video");
    await video.evaluate((element) => { element.setAttribute("data-original-player", "true"); element.dispatchEvent(new Event("ended")); });
    const end = page.getByRole("region", { name: "پایان درس", exact: true });
    await expect(end.getByRole("link", { name: "آیا سوالی داری؟", exact: true })).toHaveAttribute("href", "/community");
    await expect(page).toHaveURL(/lesson=501/);
    await end.getByRole("button", { name: "بقیه لغت‌ها رو بلدم", exact: true }).click();
    const confirm = page.getByRole("dialog", { name: "بقیه لغت‌ها رو بلدم", exact: true });
    await expect(confirm).toContainText("با انجام این کار تموم لغات باقیمونده در این درس به حالت می‌دونم تغییر می‌کنن، آیا هنوز می‌خوای ادامه بدی؟");
    await confirm.getByRole("button", { name: "نه", exact: true }).click();
    expect(state.knownWrites).toBe(0);
    await end.getByRole("button", { name: "بقیه لغت‌ها رو بلدم", exact: true }).click();
    await confirm.getByRole("button", { name: "آره", exact: true }).click();
    await expect(page.locator('[data-vocabulary-word="的"]').last()).toHaveAttribute("data-vocabulary-state", "known");
    await expect(page.locator('[data-vocabulary-word="的"]').last()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator('[data-vocabulary-word="朋友"]').last()).toHaveAttribute("data-vocabulary-state", "leitner");
    await page.screenshot({ path: path.resolve("../.tmp", "lesson-completion-" + info.project.name + ".png") });
    await end.getByRole("button", { name: "پخش درس بعدی", exact: true }).click();
    await expect(page).toHaveURL(/lesson=502/);
    await expect(video).toHaveAttribute("data-original-player", "true");
    await expect(video).toHaveAttribute("data-test-played", "true");
    await expect(page.locator('[data-vocabulary-word="的"]').last()).toHaveAttribute("data-vocabulary-state", "known");
    await video.dispatchEvent("ended");
    await expect(end.getByRole("button", { name: "پخش درس بعدی", exact: true })).toBeDisabled();
    expect(state.knownWrites).toBe(1);
});

test("a failed knowledge save stays retryable without clearing vocabulary colours", async ({ page }) => {
    const state = await setup(page);
    state.failKnown = true;
    await ready(page, "/watch/hsk/121?lesson=501");
    await page.locator("video").dispatchEvent("ended");
    await page.getByRole("button", { name: "بقیه لغت‌ها رو بلدم", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "بقیه لغت‌ها رو بلدم", exact: true });
    await dialog.getByRole("button", { name: "آره", exact: true }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(page.locator('[data-vocabulary-word="的"]').last()).toHaveAttribute("data-vocabulary-state", "new");
    state.failKnown = false;
    await dialog.getByRole("button", { name: "آره", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-vocabulary-word="的"]').last()).toHaveAttribute("data-vocabulary-state", "known");
});

test("gallery owners can edit captions, delete comments and delete images only after confirmation", async ({ page }) => {
    const state = await setup(page);
    await ready(page, "/profile");
    await page.getByRole("button", { name: "گالری", exact: true }).click();
    await page.getByRole("button", { name: "مشاهده عکس", exact: true }).click();
    await page.getByRole("button", { name: "ویرایش عکس", exact: true }).click();
    const edit = page.getByRole("dialog", { name: "ویرایش عکس", exact: true });
    await edit.getByRole("textbox").fill("توضیح تازه");
    await edit.getByRole("button", { name: "ذخیرهٔ تغییرات", exact: true }).click();
    await expect(edit).toHaveCount(0);
    expect(state.galleryEdits).toBe(1);
    expect(state.galleryFileEdits).toBe(0);
    await page.getByRole("button", { name: "مشاهده عکس", exact: true }).click();
    await page.getByRole("button", { name: "ویرایش عکس", exact: true }).click();
    await edit.getByRole("button", { name: "انتخاب عکس جایگزین", exact: true }).click();
    await edit.getByLabel("انتخاب عکس گالری", { exact: true }).setInputFiles(path.resolve("public/assets/chinverse/logos/chinverse-logo.png"));
    await page.getByRole("button", { name: "تایید تصویر", exact: true }).click();
    await edit.getByRole("button", { name: "ذخیرهٔ تغییرات", exact: true }).click();
    await expect(edit).toHaveCount(0);
    expect(state.galleryEdits).toBe(2);
    expect(state.galleryFileEdits).toBe(1);
    await page.getByRole("button", { name: "مشاهده عکس", exact: true }).click();
    await expect(page.getByText("توضیح تازه", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "حذف دیدگاه", exact: true }).click();
    await page.getByRole("group", { name: "تأیید حذف دیدگاه", exact: true }).getByRole("button", { name: "حذف", exact: true }).click();
    await expect(page.getByText("دیدگاه مهمان", { exact: true })).toHaveCount(0);
    expect(state.commentDeletes).toBe(1);
    await page.getByRole("button", { name: "حذف عکس", exact: true }).click();
    const confirm = page.getByRole("group", { name: "تأیید حذف عکس", exact: true });
    await confirm.getByRole("button", { name: "انصراف", exact: true }).click();
    expect(state.galleryDeletes).toBe(0);
    await page.getByRole("button", { name: "حذف عکس", exact: true }).click();
    await confirm.getByRole("button", { name: "حذف تصویر", exact: true }).click();
    await expect(page.getByRole("heading", { name: "اولین عکست رو بارگذاری کن!", exact: true })).toBeVisible();
    expect(state.galleryDeletes).toBe(1);
});

test("talent and service filters use the supplied artwork and account country/province choices", async ({ page }, info) => {
    await setup(page);
    await ready(page, "/showcase");
    await page.getByRole("button", { name: "فیلترها", exact: true }).click();
    const row = page.getByRole("button", { name: "عنوان شغلی", exact: true });
    await expect(row.locator("img")).toHaveAttribute("src", /Title\.svg/);
    const icon = await row.locator("img").boundingBox();
    const arrow = await row.locator("svg").boundingBox();
    expect(icon!.x).toBeGreaterThan(arrow!.x);
    await expect(page.locator('img[src*="Filter.svg"]').last()).toBeVisible();
    await page.screenshot({ path: path.resolve("../.tmp", "showcase-filters-" + info.project.name + ".png") });
    await page.getByRole("button", { name: "لوکیشن", exact: true }).click();
    await page.getByRole("searchbox", { name: "جست‌وجوی کشور/منطقه", exact: true }).fill("ایران");
    await page.getByRole("button", { name: "ایران", exact: true }).click();
    await page.getByRole("searchbox", { name: "جست‌وجوی استان", exact: true }).fill("تهران");
    await page.getByRole("button", { name: "تهران", exact: true }).click();
    await page.getByRole("button", { name: "بستن", exact: true }).click();
    await expect(page.getByRole("heading", { name: "متخصص تهران", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "متخصص فارس", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "ویترین خدمات", exact: true }).click();
    await page.getByRole("button", { name: "فیلترها", exact: true }).click();
    await page.getByRole("button", { name: "لوکیشن", exact: true }).click();
    await page.getByRole("searchbox", { name: "جست‌وجوی کشور/منطقه", exact: true }).fill("چین");
    await page.getByRole("button", { name: "چین", exact: true }).click();
    await expect(page.getByRole("heading", { name: "استان‌های چین", exact: true })).toBeVisible();
    await page.getByRole("searchbox", { name: "جست‌وجوی استان", exact: true }).fill("پکن");
    await expect(page.getByRole("button", { name: /پکن/, exact: false })).toBeVisible();
    await page.getByRole("button", { name: "بستن", exact: true }).click();
    await expect(page.getByRole("heading", { name: "مشاوره چین", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "فیلترها", exact: true }).click();
    await page.getByRole("button", { name: "پاک کردن", exact: true }).click();
    await page.getByRole("button", { name: "بستن", exact: true }).click();
    await expect(page.getByRole("heading", { name: "مشاوره چین", exact: true })).toBeVisible();
});

test("consultation chat uses the supplied copy and a right-aligned composer", async ({ page }) => {
    await setup(page);
    await ready(page, "/chat/2");
    await expect(page.getByRole("heading", { name: "هنوز مکالمه‌ای شروع نشده", exact: true })).toBeVisible();
    await expect(page.getByText("برای شروع گفت‌وگو، اولین پیام رو بفرست.", { exact: true })).toBeVisible();
    const composer = page.getByRole("textbox", { name: "پیام", exact: true });
    await expect(composer).toHaveAttribute("dir", "rtl");
    await expect(composer).toHaveCSS("text-align", "right");
});
