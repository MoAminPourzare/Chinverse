import { expect, test } from '@playwright/test';

test('admin reviews the exact recording and chooses one pronunciation; decisions survive refresh', async ({ page }) => {
    test.setTimeout(90_000);
    let status = 'pending';
    let approved: string | null = null;
    const decisions: Array<{ sha256: string; decision: string; approved_pinyin?: string }> = [];
    const sha256 = 'a'.repeat(64);
    await page.route('**/api/backend/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace('/api/backend', '');
        let json: unknown = {};
        const clip = { id: 1, word_id: 50, chinese: '只', pinyin: 'zhī/zhǐ', level: 'HSK1',
            meaning: 'فقط؛ واحد شمارش', audio_url: '/uploads/dictionary-audio/test.mp3', sha256,
            pinyins: ['zhī', 'zhǐ'], review_reasons: ['multiple_readings', 'single_character'],
            status, approved_pinyin: approved, active: status === 'approved', stale: false, curated_audio_preserved: false };
        if (path === '/auth/refresh') json = { access_token: 'isolated-audio-test' };
        if (path === '/admin/me') json = { is_admin: true, mfa_enabled: true, mfa_verified: true, email: 'admin@example.com' };
        if (path === '/admin/dictionary-audio') {
            const filter = url.searchParams.get('state');
            const visible = filter === 'all' || filter === status;
            json = { counts: { pending: status === 'pending' ? 1 : 0, approved: status === 'approved' ? 1 : 0, rejected: status === 'rejected' ? 1 : 0 },
                items: visible ? [clip] : [], total: visible ? 1 : 0 };
        }
        if (path === '/admin/dictionary-audio/1/review') {
            const payload = route.request().postDataJSON();
            decisions.push(payload);
            status = payload.decision;
            approved = status === 'approved' ? payload.approved_pinyin : null;
            json = { ...clip, status, approved_pinyin: approved };
        }
        await route.fulfill({ json });
    });
    await page.goto('/admin/dictionary-audio', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '只', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'تأیید تلفظ', exact: true })).toBeDisabled();
    await page.getByLabel('کدام تلفظ را شنیدی؟').selectOption('zhǐ');
    await page.getByRole('button', { name: 'تأیید تلفظ', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'تأیید و به دیکشنری وصل شد' })).toBeVisible();
    expect(decisions[0]).toEqual({ sha256, decision: 'approved', approved_pinyin: 'zhǐ' });
    await page.getByRole('combobox', { name: 'وضعیت', exact: true }).selectOption('approved');
    await expect(page.getByText('تلفظ تأییدشده:')).toBeVisible();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('combobox', { name: 'وضعیت', exact: true }).selectOption('approved');
    await expect(page.getByRole('heading', { name: '只', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'رد صدا', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'رد شد' })).toBeVisible();
    await page.getByRole('combobox', { name: 'وضعیت', exact: true }).selectOption('rejected');
    await expect(page.getByRole('heading', { name: '只', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('dictionary audio review requires a verified admin session', async ({ page }) => {
    await page.route('**/api/backend/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        await route.fulfill({ json: path.endsWith('/auth/refresh') ? { access_token: 'isolated-normal-user' } : { is_admin: false } });
    });
    await page.goto('/admin/dictionary-audio');
    await expect(page.getByRole('alert').filter({ hasText: 'دسترسی ادمین ندارد' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'تأیید تلفظ' })).toHaveCount(0);
});
