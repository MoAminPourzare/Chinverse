import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

test.setTimeout(90_000);
const messages = [
    "این لغت هنوز توی ذهنت جا نیفتاده. چند بار مرورش کن تا کم‌کم ریشه بگیره و وارد حافظه‌ات بشه.",
    "لغت رو یاد گرفتی، اما هنوز زوده به حافظه‌ات اعتماد کنی! مرورهای بعدی کمک می‌کنن بهتر توی ذهنت بمونه.",
    "آفرین! این لغت داره کم‌کم توی ذهنت ریشه می‌گیره. چند مرور دیگه تا موندگار شدنش فاصله داری.",
    "این لغت رو خوب یاد گرفتی و حالا وارد حافظه بلندمدتت شده. مرورهای گاه‌به‌گاه کمک می‌کنن فراموشش نکنی.",
    "این لغت حسابی توی ذهنت ریشه کرده! حالا می‌تونی با خیال راحت بگی که یادش گرفتی.",
];
const titles = ["بذر", "جوانه", "نهال", "درخت جوان", "درخت تنومند"];
const chinese = ["经理", "朋友", "学习", "明天", "中文"];
const pinyin = ["jīnglǐ", "péngyou", "xuéxí", "míngtiān", "zhōngwén"];
const fa = "معنی فارسی آزمایشی. ".repeat(25);

async function ready(page: Page, route: string) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

async function setup(page: Page, upcoming = false, count = 5, longWord = false) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
        localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true");
        localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ showPinyin: true }));
        class Speech { lang = ""; voice: unknown; rate = 1; onend: (() => void) | null = null; constructor(public text: string) {} }
        Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Speech });
        Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
            getVoices: () => [{ lang: "zh-CN", name: "Mandarin" }], cancel() {}, addEventListener() {}, removeEventListener() {},
            speak(speech: Speech) { document.documentElement.dataset.testSpeech = speech.text + ":" + speech.lang; setTimeout(() => speech.onend?.(), 0); },
        } });
    });
    let cards = chinese.slice(0, count).map((word, i) => ({ id: i + 11, box_number: i + 1, next_review_at: upcoming ? "2099-01-01T00:00:00Z" : "2020-01-01T00:00:00Z", word: {
        id: i + 1, chinese: longWord && i === 0 ? "一日不见如隔三秋" : word, pinyin: pinyin[i], audio_url: null,
        chinese_meaning: "中文解释", persian_meaning: fa, composition: "经理工作",
        definitions: [], collocations: [{ id: i + 1, phrase_zh: word + "工作", phrase_pinyin: "gōngzuò", translation_target: "ترکیب آزمایشی", sense_order: 1 }],
        examples: [{ id: i + 1, zh_text: "这是" + word, pinyin: "zhè shì", target_text: "مثال آزمایشی", sense_order: 1 }],
    } }));
    let failDelete = false, failReview = false;
    const deletions: number[] = [], reviews: { card_id: number; remembered: boolean }[] = [];
    await page.route("**/api/backend/**", async (route) => {
        const request = route.request(), url = new URL(request.url());
        const endpoint = url.pathname.replace("/api/backend", "");
        let body: unknown = [];
        if (endpoint === "/auth/refresh") body = { access_token: "isolated-leitner-session" };
        else if (endpoint === "/users/me") body = { id: 1, email: "leitner@example.com", profile: { display_name: "کاربر آزمایشی", bio: "", resume: {} } };
        else if (endpoint === "/leitner/dashboard") body = { box_counts: Object.fromEntries([1, 2, 3, 4, 5].map((box) => [box, cards.filter((card) => card.box_number === box).length])), total_cards: cards.length, total_due: upcoming ? 0 : cards.length, upcoming_count: upcoming ? cards.length : 0, mastered_count: 1, due_by_box: {}, box_intervals: {}, recent_cards: cards };
        else if (endpoint === "/leitner/cards") body = { cards: cards.slice(Number(url.searchParams.get("skip") || 0), Number(url.searchParams.get("skip") || 0) + Number(url.searchParams.get("limit") || 100)) };
        else if (endpoint.startsWith("/leitner/cards/") && request.method() === "DELETE") {
            if (failDelete) return route.fulfill({ status: 503, json: { detail: "temporary failure" } });
            const id = Number(endpoint.split("/").pop()); deletions.push(id); cards = cards.filter((card) => card.id !== id);
            return route.fulfill({ status: 204 });
        } else if (endpoint === "/leitner/review") {
            if (request.method() === "POST") {
                if (failReview) return route.fulfill({ status: 503, json: { detail: "temporary failure" } });
                const result = request.postDataJSON(); reviews.push(result); body = cards.find((card) => card.id === result.card_id);
            } else body = { cards: upcoming ? [] : cards };
        } else if (endpoint.endsWith("/unread-count")) body = { count: 0 };
        await route.fulfill({ json: body });
    });
    return { deletions, reviews, set failDelete(value: boolean) { failDelete = value; }, set failReview(value: boolean) { failReview = value; } };
}

test("dashboard centers characters, hides pinyin and confirms deletion with a left trash button", async ({ page }, info) => {
    const state = await setup(page);
    await ready(page, "/leitner");
    const row = page.locator("article").filter({ has: page.getByRole("button", { name: "حذف 经理 از لایتنر", exact: true }) });
    const word = row.getByText("经理", { exact: true });
    const trash = row.getByRole("button", { name: "حذف 经理 از لایتنر", exact: true });
    const wordBox = (await word.boundingBox())!, rowBox = (await row.boundingBox())!, trashBox = (await trash.boundingBox())!;
    expect(Math.abs(wordBox.x + wordBox.width / 2 - rowBox.x - rowBox.width / 2)).toBeLessThan(2);
    expect(trashBox.x + trashBox.width).toBeLessThan(wordBox.x);
    await expect(page.getByText("jīnglǐ", { exact: true })).toHaveCount(0);
    await row.getByRole("button", { name: "پخش تلفظ", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-test-speech", "经理:zh-CN");
    await trash.click();
    const dialog = page.getByRole("dialog", { name: "حذف لغت از لایتنر" });
    await expect(dialog).toContainText("آیا مطمئنی که می‌خوای این لغت رو از لایتنرت حذف کنی؟");
    await page.screenshot({ path: path.resolve("../.tmp", `leitner-delete-${info.project.name}.png`) });
    await dialog.getByRole("button", { name: "نه", exact: true }).click();
    expect(state.deletions).toEqual([]);
    await trash.click(); await page.keyboard.press("Escape");
    expect(state.deletions).toEqual([]);
    await trash.click(); await dialog.getByRole("button", { name: "آره", exact: true }).click();
    await expect(trash).toHaveCount(0);
    expect(state.deletions).toEqual([11]);
    await ready(page, "/leitner");
    await expect(trash).toHaveCount(0);
    await expect(page.getByRole("button", { name: "حذف 朋友 از لایتنر", exact: true })).toBeVisible();
});

test("upcoming cards remain deletable and a failed deletion can be retried", async ({ page }) => {
    const state = await setup(page, true, 1);
    await ready(page, "/leitner");
    await expect(page.getByRole("link", { name: "شروع مرور لغات", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "حذف 经理 از لایتنر", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "حذف لغت از لایتنر" });
    state.failDelete = true;
    await dialog.getByRole("button", { name: "آره", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("لغت حذف نشد");
    expect(state.deletions).toEqual([]);
    state.failDelete = false;
    await dialog.getByRole("button", { name: "آره", exact: true }).click();
    await expect(page.getByText("هنوز هیچ واژه‌ای به لایتنرت اضافه نکردی!", { exact: true })).toBeVisible();
    expect(state.deletions).toEqual([11]);
});

test("all five growth stages use exact text and back tabs and schedules follow the card box", async ({ page }, info) => {
    const state = await setup(page);
    await ready(page, "/leitner/review");
    for (let i = 0; i < 5; i++) {
        const stage = page.getByRole("region", { name: "مرحلهٔ یادگیری", exact: true });
        await expect(stage).toContainText(messages[i]);
        await expect(stage.getByRole("img", { name: titles[i], exact: true })).toBeVisible();
        await expect(page.getByText(pinyin[i], { exact: true })).toHaveCount(0);
        const flip = page.getByRole("button", { name: "دیدن پشت کارت", exact: true });
        await expect(flip.locator("svg")).toHaveCount(0);
        if (!i) await page.screenshot({ path: path.resolve("../.tmp", `leitner-front-${info.project.name}.png`) });
        await flip.click();
        await expect(page.getByText(pinyin[i], { exact: true })).toBeVisible();
        const tabs = page.getByRole("tab");
        expect(await tabs.allTextContents()).toEqual(["معنی چینی", "معنی فارسی", "ترکیب واژگانی", "مثال‌ها"]);
        await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
        await expect(page.getByRole("tabpanel")).toContainText("中文解释");
        const boxes = await tabs.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
        expect(boxes).toEqual([...boxes].sort((a, b) => b - a));
        await page.getByRole("tab", { name: "معنی فارسی", exact: true }).click();
        await expect(page.getByRole("tabpanel")).toContainText(fa.trim());
        await page.getByRole("tab", { name: "ترکیب واژگانی", exact: true }).click();
        await expect(page.getByRole("tabpanel")).toContainText("ترکیب آزمایشی");
        await page.getByRole("tab", { name: "مثال‌ها", exact: true }).click();
        await expect(page.getByRole("tabpanel")).toContainText("مثال آزمایشی");
        await expect(page.getByRole("button", { name: "یادم نیست (جعبه ۱، مرور فردا)", exact: true })).toBeVisible();
        const nextBox = Math.min(i + 2, 5), days = [3, 7, 15, 30, 30][i];
        const persian = (value: number) => String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
        const remember = page.getByRole("button", { name: `یادم هست (جعبه ${persian(nextBox)}، مرور ${persian(days)} روز بعد)`, exact: true });
        if (!i) await page.screenshot({ path: path.resolve("../.tmp", `leitner-back-${info.project.name}.png`) });
        await remember.click();
    }
    await expect(page.getByRole("heading", { name: "آفرین! مرور امروز تمام شد", exact: true })).toBeVisible();
    expect(state.reviews).toEqual([11, 12, 13, 14, 15].map((card_id) => ({ card_id, remembered: true })));
});

test("failed review keeps the back visible and the forgotten choice submits the current card", async ({ page }) => {
    const state = await setup(page, false, 1);
    await ready(page, "/leitner/review");
    await page.getByRole("button", { name: "دیدن پشت کارت", exact: true }).click();
    const missed = page.getByRole("button", { name: "یادم نیست (جعبه ۱، مرور فردا)", exact: true });
    state.failReview = true;
    await missed.click();
    await expect(page.getByRole("region", { name: "پشت کارت", exact: true }).getByRole("alert")).toContainText("نتیجه مرور ذخیره نشد");
    await expect(page.getByText("jīnglǐ", { exact: true })).toBeVisible();
    expect(state.reviews).toEqual([]);
    state.failReview = false;
    await missed.click();
    await expect(page.getByRole("heading", { name: "آفرین! مرور امروز تمام شد", exact: true })).toBeVisible();
    expect(state.reviews).toEqual([{ card_id: 11, remembered: false }]);
});

test("a narrow back card expands without clipped headings or nested scrolling", async ({ page }, info) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await setup(page, false, 5, true);
    await ready(page, "/leitner/review");
    const frontWord = page.getByText("一日不见如隔三秋", { exact: true });
    expect(await frontWord.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBeTruthy();
    await page.getByRole("button", { name: "دیدن پشت کارت", exact: true }).click();
    await page.getByRole("tab", { name: "معنی فارسی", exact: true }).click();
    const panel = page.getByRole("tabpanel"), card = page.getByRole("region", { name: "پشت کارت", exact: true });
    const wordBounds = (await page.getByText("一日不见如隔三秋", { exact: true }).boundingBox())!, cardBounds = (await card.boundingBox())!;
    expect(wordBounds.x).toBeGreaterThan(cardBounds.x);
    expect(wordBounds.x + wordBounds.width).toBeLessThan(cardBounds.x + cardBounds.width);
    expect(await card.evaluate((element) => element.scrollHeight <= element.clientHeight + 2)).toBeTruthy();
    expect(await panel.evaluate((element) => getComputedStyle(element).overflowY)).toBe("visible");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    expect(await page.locator("main").evaluate((element) => element.querySelectorAll(":scope > div > span").length)).toBe(0);
    await page.getByRole("tab", { name: "معنی چینی", exact: true }).click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "معنی فارسی", exact: true })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("tab", { name: "معنی چینی", exact: true })).toBeFocused();
    await expect(page.getByText("jīnglǐ", { exact: true })).toBeVisible();
    const violations = (await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze()).violations;
    expect(violations).toEqual([]);
    await page.screenshot({ path: path.resolve("../.tmp", `leitner-narrow-${info.project.name}.png`) });
});
