import { expect, test, type Page } from '@playwright/test';

test.setTimeout(60_000);

function message(id: number, content: string, incoming = false) {
    return { id, sender_id: incoming ? 2 : 1, receiver_id: incoming ? 1 : 2, content,
        is_read: true, created_at: new Date(Date.UTC(2026, 9, 3, 8, id)).toISOString(), sender: null, receiver: null };
}

async function expectContainedLayout(page: Page) {
    await expect.poll(async () => page.evaluate(() => {
        const frame = document.querySelector('.app-frame')!.getBoundingClientRect();
        const roomHeader = document.querySelector('header')!.getBoundingClientRect();
        const composer = document.querySelector('footer')!.getBoundingClientRect();
        const messages = document.querySelector('main')!.getBoundingClientRect();
        const outer = document.querySelector('.app-scroll')!;
        return Math.max(Math.abs(roomHeader.top - frame.top - 1), Math.abs(composer.bottom - frame.bottom + 1),
            Math.abs(messages.top - roomHeader.bottom), Math.abs(messages.bottom - composer.top),
            outer.scrollTop, outer.scrollHeight - outer.clientHeight);
    })).toBeLessThanOrEqual(2);
    await expect(page.getByRole('link', { name: 'پشتیبانی', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'گزینه‌های ایمنی', exact: true })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'پیام', exact: true })).toBeInViewport();
}

for (const count of [0, 2, 50]) {
    test(`chat with ${count} messages keeps its header and composer in place`, async ({ page, browserName }, testInfo) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const messages = Array.from({ length: count }, (_, index) => message(index + 1, `پیام آزمایشی شماره ${index + 1}`));
        let incoming: ((content: string) => void) | undefined;
        await page.routeWebSocket('**/chat/ws', socket => {
            incoming = content => {
                const item = message(messages.length + 1, content, true);
                messages.push(item);
                socket.send(JSON.stringify({ type: 'message:new', message: item }));
            };
            socket.onMessage(data => {
                const payload = JSON.parse(String(data));
                if (payload.type === 'auth') socket.send(JSON.stringify({ type: 'connection:ready', user_id: 1 }));
                if (payload.type === 'ping') socket.send(JSON.stringify({ type: 'pong' }));
            });
        });
        await page.route('**/api/backend/**', async route => {
            const url = new URL(route.request().url());
            const path = url.pathname.replace('/api/backend', '');
            let body: unknown = [];
            if (path === '/auth/refresh') body = { access_token: 'layout-fixture-only' };
            if (path === '/users/me') body = { id: 1 };
            if (path === '/users/2/public') body = { id: 2, profile: { display_name: 'کاربر آزمایشی', avatar_url: null } };
            if (path === '/chat/2/presence') body = { is_online: false };
            if (path === '/chat/2/messages') body = url.searchParams.has('after_id') ? [] : messages;
            if (path === '/chat/2/read') body = { updated: 0, message_ids: [] };
            if (path === '/chat' && route.request().method() === 'POST') {
                body = message(messages.length + 1, route.request().postDataJSON().content);
                messages.push(body as ReturnType<typeof message>);
            }
            await route.fulfill({ json: body });
        });
        await page.goto('/chat/2', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'کاربر آزمایشی' })).toBeVisible();
        await expect(page.getByText('آفلاین', { exact: true })).toBeVisible();
        await expectContainedLayout(page);
        const list = page.getByRole('main', { name: 'پیام‌های گفتگو' });
        if (count === 50) {
            await expect.poll(() => list.evaluate(el => el.scrollHeight - el.scrollTop - el.clientHeight)).toBeLessThanOrEqual(2);
            await list.evaluate(el => { el.scrollTop = 0; });
            await expect(page.getByText('پیام آزمایشی شماره 1', { exact: true })).toBeInViewport();
            await expectContainedLayout(page);
            await expect.poll(() => Boolean(incoming)).toBe(true);
            incoming!('پیام تازه هنگام خواندن پیام‌های قبلی');
            await expect(page.getByText('پیام تازه هنگام خواندن پیام‌های قبلی')).toHaveCount(1);
            await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeLessThanOrEqual(2);
        }
        const draft = page.getByRole('textbox', { name: 'پیام', exact: true });
        await draft.fill('پیام جدید برای بررسی چیدمان');
        await expect(draft).toBeFocused();
        const composerStyle = await draft.evaluate(input => {
            const field = getComputedStyle(input);
            const wrapper = input.parentElement!;
            const bounds = input.getBoundingClientRect();
            const container = wrapper.getBoundingClientRect();
            return {
                outlineStyle: field.outlineStyle,
                fontSize: parseFloat(field.fontSize),
                textHeight: parseFloat(field.lineHeight) + parseFloat(field.paddingTop) + parseFloat(field.paddingBottom),
                height: input.clientHeight,
                inset: Math.min(bounds.left - container.left, container.right - bounds.right),
            };
        });
        expect(composerStyle.outlineStyle).toBe('none');
        expect(composerStyle.fontSize).toBeGreaterThanOrEqual(16);
        expect(composerStyle.textHeight).toBeLessThanOrEqual(composerStyle.height);
        expect(composerStyle.inset).toBeGreaterThanOrEqual(6);
        await expect(draft.locator('..')).toHaveCSS('border-color', 'rgb(21, 90, 166)');
        await expectContainedLayout(page);
        if (count === 2) await testInfo.attach('focused-message-composer', { body: await page.screenshot(), contentType: 'image/png' });
        if (count === 0 && browserName === 'chromium') {
            await page.emulateMedia({ forcedColors: 'active' });
            await expect(draft.locator('..')).toHaveCSS('outline-style', 'solid');
            await expect(draft.locator('..')).toHaveCSS('outline-width', '2px');
            await page.emulateMedia({ forcedColors: 'none' });
        }
        await page.getByRole('button', { name: 'ارسال پیام', exact: true }).click();
        await expect(page.getByText('پیام جدید برای بررسی چیدمان', { exact: true })).toBeInViewport();
        await expectContainedLayout(page);
        const viewport = page.viewportSize()!;
        await page.setViewportSize({ width: viewport.width, height: 420 });
        await expectContainedLayout(page);
        await expect(page.getByText('پیام جدید برای بررسی چیدمان', { exact: true })).toBeInViewport();
        await page.setViewportSize(viewport);
        await expectContainedLayout(page);
        if (count === 50) await page.screenshot({ path: testInfo.outputPath('chat-layout.png') });
    });
}
