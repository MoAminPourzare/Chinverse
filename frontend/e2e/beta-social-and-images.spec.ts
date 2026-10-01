import { expect, test, type Page } from '@playwright/test';

const date = '2026-10-01T09:00:00Z';
test.setTimeout(60_000);
const profile = { id: 2, profile: { display_name: 'تارا نمایشی', headline: 'مدرس زبان چینی', avatar_url: '/uploads/avatars/missing.jpg' }, gallery_items: [] };

async function mockLiveSocket(page: Page) {
    await page.addInitScript(() => {
        class LiveSocket {
            static OPEN = 1;
            static CONNECTING = 0;
            readyState = LiveSocket.OPEN;
            onopen: (() => void) | null = null;
            onmessage: ((event: { data: string }) => void) | null = null;
            onerror = null;
            onclose: (() => void) | null = null;
            constructor() { setTimeout(() => this.onopen?.(), 0); }
            send(data: string) {
                const payload = JSON.parse(data);
                if (payload.type === 'auth') this.onmessage?.({ data: JSON.stringify({ type: 'connection:ready', user_id: 1 }) });
                if (payload.type === 'ping') this.onmessage?.({ data: JSON.stringify({ type: 'pong' }) });
            }
            close() { this.readyState = 3; this.onclose?.(); }
        }
        Object.defineProperty(window, 'WebSocket', { configurable: true, value: LiveSocket });
    });
}

test('network changes survive reload and refresh the session before writing once', async ({ page }) => {
    let following = false;
    let expire = false;
    let refreshes = 0;
    let writes = 0;
    await page.route('**/api/backend/**', async route => {
        const path = new URL(route.request().url()).pathname.replace('/api/backend', '');
        let body: unknown = [];
        let status = 200;
        if (path === '/auth/refresh') { refreshes++; body = { access_token: `social-session-${refreshes}` }; }
        else if (path === '/users/me') {
            if (expire) { expire = false; status = 401; body = { detail: 'expired' }; }
            else body = { id: 1 };
        }
        else if (path === '/users/2/public') body = profile;
        else if (path === '/users/2/is-following') body = { is_following: following };
        else if (path === '/users/2/followers-count') body = { followers_count: following ? 1 : 0 };
        else if (path === '/users/2/follow') { writes++; following = route.request().method() === 'POST'; body = {}; }
        await route.fulfill({ status, json: body });
    });
    await page.goto('/users/2');
    const followButton = page.getByRole('button', { name: 'شبکه', exact: true });
    await expect(followButton).toBeVisible();
    const initialRefreshes = refreshes;
    expire = true;
    await followButton.click();
    await expect(page.getByRole('button', { name: 'لغو', exact: true })).toBeVisible();
    expect(writes).toBe(1);
    expect(refreshes).toBe(initialRefreshes + 1);
    await page.reload();
    await page.getByRole('button', { name: 'لغو', exact: true }).click();
    await expect(followButton).toBeVisible();
    expect(writes).toBe(2);
});

test('a live viewer sees an offline recipient and messages persist after reload', async ({ page }) => {
    await mockLiveSocket(page);
    const messages: unknown[] = [];
    let posts = 0;
    await page.route('**/api/backend/**', async route => {
        const path = new URL(route.request().url()).pathname.replace('/api/backend', '');
        let body: unknown = [];
        if (path === '/auth/refresh') body = { access_token: 'social-session' };
        else if (path === '/users/me') body = { id: 1 };
        else if (path === '/users/2/public') body = profile;
        else if (path === '/chat/2/presence') body = { is_online: false };
        else if (path === '/chat/2/messages') body = new URL(route.request().url()).searchParams.has('after_id') ? [] : messages;
        else if (path === '/chat' && route.request().method() === 'POST') {
            posts++;
            body = { id: 91, sender_id: 1, receiver_id: 2, content: route.request().postDataJSON().content, is_read: false, created_at: date, sender: null, receiver: null };
            messages.push(body);
        }
        await route.fulfill({ json: body });
    });
    await page.goto('/chat/2');
    await expect(page.getByText('آفلاین', { exact: true })).toBeVisible();
    await expect(page.getByText('آنلاین', { exact: true })).toHaveCount(0);
    await page.getByRole('textbox').fill('سلام تارا، این پیام باید باقی بماند.');
    await page.getByRole('textbox').press('Enter');
    await expect(page.getByText('سلام تارا، این پیام باید باقی بماند.', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('سلام تارا، این پیام باید باقی بماند.', { exact: true })).toBeVisible();
    expect(posts).toBe(1);
});

test('missing profile, provider and service images render local placeholders', async ({ page }) => {
    await page.route('**/_next/image?**', route => route.fulfill({ status: 404, body: 'Missing original image' }));
    await page.route('**/api/backend/**', async route => {
        const path = new URL(route.request().url()).pathname.replace('/api/backend', '');
        let body: unknown = [];
        if (path === '/auth/refresh') body = { access_token: 'social-session' };
        else if (path === '/users/me') body = { id: 1 };
        else if (path === '/users/2/public') body = profile;
        else if (path === '/users/2/followers-count') body = { followers_count: 0 };
        else if (path === '/engagements/service/2') body = { target_type: 'service', target_id: 2, liked: false, likes_count: 0, comments_count: 0 };
        else if (path === '/users/2/is-following') body = { is_following: false };
        else if (path === '/users/me/services/public/2') body = {
            id: 2, title: 'دوره تربیت مدرس زبان چینی', description: 'توضیح دوره', banner_url: '/uploads/services/missing.jpg', created_at: date,
            provider: { id: 2, display_name: 'تارا نمایشی', avatar_url: '/uploads/avatars/missing.jpg' }, likes_count: 0,
        };
        await route.fulfill({ json: body });
    });
    await page.goto('/users/2');
    await expect(page.getByRole('img', { name: 'Avatar', exact: true })).toHaveAttribute('src', /profile\.svg/);
    await page.goto('/services/2');
    const banner = page.getByRole('img', { name: 'دوره تربیت مدرس زبان چینی', exact: true });
    await expect(banner).toHaveAttribute('src', /image-unavailable\.svg/);
    await expect(page.getByRole('img', { name: 'تارا نمایشی', exact: true })).toHaveAttribute('src', /profile\.svg/);
    await expect.poll(() => banner.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});
