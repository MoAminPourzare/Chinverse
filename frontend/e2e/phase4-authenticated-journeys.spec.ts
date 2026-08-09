import { expect, test, type Route } from "@playwright/test";

const now = "2026-08-09T08:00:00.000Z";

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test.describe("phase four authenticated journeys", () => {
  test("a signed-in user submits a support ticket and sees the later reply", async ({ page }) => {
    let submitted = false;
    const ticket = {
      id: 41,
      user_id: 7,
      message: "این پیام برای تست چرخه کامل پشتیبانی ثبت شده است.",
      status: "closed",
      admin_reply: "درخواست بررسی شد و مشکل برطرف شد.",
      responded_at: now,
      created_at: now,
    };

    await page.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api\/backend/, "");
      const method = route.request().method();
      if (path === "/auth/refresh") return json(route, { access_token: "phase4-access-token" });
      if (path === "/admin/me") return json(route, { is_admin: false });
      if (path === "/notifications/latest") return json(route, []);
      if (path === "/community/support" && method === "GET") return json(route, submitted ? [ticket] : []);
      if (path === "/community/support" && method === "POST") {
        submitted = true;
        return json(route, { success: true, message: "received", ticket_id: ticket.id });
      }
      return json(route, { detail: `Unhandled phase-four mock: ${path}` }, 404);
    });

    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("هنوز درخواستی ثبت نکرده‌ای.")).toBeVisible();
    await page.getByLabel("پیام پشتیبانی").fill(ticket.message);
    await page.getByRole("button", { name: "ارسال پیام" }).click();
    await expect(page.getByRole("heading", { name: "پیامت ثبت شد" })).toBeVisible();
    await page.getByRole("button", { name: "مشاهده درخواست‌ها" }).click();
    await expect(page.getByText(ticket.admin_reply)).toBeVisible();
    expect(submitted).toBe(true);
  });

  test("an MFA-verified admin replies to and closes a support ticket", async ({ page }) => {
    let status = "open";
    let reply: string | null = null;
    const supportTicket = () => ({
      id: 72,
      user_id: 9,
      message: "پخش درس برای من شروع نمی‌شود و نیاز به بررسی دارد.",
      status,
      admin_reply: reply,
      responded_at: reply ? now : null,
      created_at: now,
      user: { id: 9, email: "learner@example.com", phone: "09120000000", display_name: "زبان‌آموز" },
    });

    await page.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api\/backend/, "");
      const method = route.request().method();
      if (path === "/auth/refresh") return json(route, { access_token: "phase4-admin-token" });
      if (path === "/admin/me") return json(route, { is_admin: true, email: "admin@example.com", mfa_enabled: true, mfa_verified: true });
      if (path === "/notifications/latest") return json(route, []);
      if (path === "/admin/support-tickets" && method === "GET") return json(route, [supportTicket()]);
      if (path === "/admin/support-tickets/72" && method === "PATCH") {
        const payload = route.request().postDataJSON() as { status: string; reply?: string };
        status = payload.status;
        reply = payload.reply || reply;
        return json(route, supportTicket());
      }
      return json(route, { detail: `Unhandled phase-four mock: ${path}` }, 404);
    });

    await page.goto("/admin/support", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("پخش درس برای من شروع نمی‌شود", { exact: false })).toBeVisible();
    await page.getByLabel("پاسخ تیکت 72").fill("مسیر ویدیو اصلاح شد؛ لطفاً دوباره امتحان کنید.");
    await page.getByRole("button", { name: "ارسال پاسخ و بستن" }).click();
    await expect(page.getByText("پاسخ ارسال و تیکت بسته شد.")).toBeVisible();
    expect(status).toBe("closed");
    expect(reply).toContain("مسیر ویدیو اصلاح شد");
  });

  test("focused pages do not place the floating support shortcut over their controls", async ({ page }) => {
    for (const route of ["/chat/2", "/notifications", "/settings", "/account/security"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: "پشتیبانی" })).toHaveCount(0);
    }
  });

  test("an empty chat receives its first message through polling when realtime is unavailable", async ({ page }) => {
    let historyRequests = 0;
    await page.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api\/backend/, "");

      if (path === "/auth/refresh") return json(route, { access_token: "phase4-access-token" });
      if (path === "/admin/me") {
        return json(route, { is_admin: false, email: "user@example.com", mfa_enabled: false, mfa_verified: false });
      }
      if (path === "/notifications/latest" || path === "/trust/blocks") return json(route, []);
      if (path === "/users/me") return json(route, { id: 1 });
      if (path === "/users/2/public") {
        return json(route, { id: 2, profile: { display_name: "کاربر دوم", avatar_url: null } });
      }
      if (path === "/chat/2/messages") {
        historyRequests += 1;
        if (historyRequests === 1) return json(route, []);
        return json(route, [{
          id: 91,
          sender_id: 2,
          receiver_id: 1,
          content: "اولین پیام پس از قطع ارتباط زنده",
          is_read: true,
          created_at: now,
          sender: { id: 2, display_name: "کاربر دوم", avatar_url: null },
          receiver: { id: 1, display_name: "کاربر اول", avatar_url: null },
        }]);
      }
      if (path === "/chat/2/read") return json(route, { updated: 1, message_ids: [91] });
      return json(route, { detail: `Unhandled phase-four mock: ${path}` }, 404);
    });

    await page.goto("/chat/2", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("هنوز گفت‌وگویی شروع نشده")).toBeVisible();
    await expect(page.getByText("اولین پیام پس از قطع ارتباط زنده")).toBeVisible({ timeout: 9_000 });
    expect(historyRequests).toBeGreaterThanOrEqual(2);
  });

  test("chat load failures are retryable instead of looking like an empty conversation", async ({ page }) => {
    await page.route("**/api/backend/**", async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api\/backend/, "");
      if (path === "/auth/refresh") return json(route, { access_token: "phase4-access-token" });
      if (path === "/admin/me") return json(route, { is_admin: false });
      if (path === "/notifications/latest" || path === "/trust/blocks") return json(route, []);
      if (path === "/users/me" || path === "/users/2/public" || path === "/chat/2/messages") {
        return json(route, { detail: "network unavailable" }, 503);
      }
      return json(route, {}, 404);
    });

    await page.goto("/chat/2", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "گفت‌وگو باز نشد" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تلاش دوباره" })).toBeEnabled();
  });

  test("account security revokes another session and recovers from logout-all network errors", async ({ page }) => {
    let sessions = [
      { id: "current", created_at: now, last_used_at: now, expires_at: now, current: true, mfa_verified: false },
      { id: "other", created_at: now, last_used_at: now, expires_at: now, current: false, mfa_verified: false },
    ];
    let revokedSession = "";

    await page.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api\/backend/, "");
      const method = route.request().method();

      if (path === "/auth/refresh") return json(route, { access_token: "phase4-access-token" });
      if (path === "/admin/me") {
        return json(route, { is_admin: false, email: "user@example.com", mfa_enabled: false, mfa_verified: false });
      }
      if (path === "/notifications/latest") return json(route, []);
      if (path === "/auth/sessions" && method === "GET") return json(route, sessions);
      if (path === "/auth/sessions/other" && method === "DELETE") {
        revokedSession = "other";
        sessions = sessions.filter((item) => item.id !== "other");
        return route.fulfill({ status: 204, body: "" });
      }
      if (path === "/auth/logout-all") return route.abort("failed");
      return json(route, { detail: `Unhandled phase-four mock: ${path}` }, 404);
    });

    await page.goto("/account/security", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("نشست دیگر")).toBeVisible();
    await page.getByRole("button", { name: "بستن نشست" }).click();
    await expect(page.getByText("نشست انتخاب‌شده بسته شد.")).toBeVisible();
    await expect(page.getByText("نشست دیگر")).toHaveCount(0);
    expect(revokedSession).toBe("other");

    const logoutAll = page.getByRole("button", { name: "خروج از همه دستگاه‌ها" });
    await logoutAll.click();
    await expect(page.getByText("بسته‌شدن نشست‌های دستگاه‌های دیگر تأیید نشد", { exact: false })).toBeVisible();
    await expect(logoutAll).toBeEnabled();
  });

  test("moderators can claim an open report from the role-gated queue", async ({ page }) => {
    let claimed = false;
    await page.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api\/backend/, "");
      const method = route.request().method();

      if (path === "/auth/refresh") return json(route, { access_token: "phase4-access-token" });
      if (path === "/admin/me") return json(route, { is_admin: false });
      if (path === "/notifications/latest") return json(route, []);
      if (path === "/trust/moderation/access") {
        return json(route, { can_moderate: true, is_admin: false, mfa_ready: true });
      }
      if (path === "/trust/moderation/reports" && method === "GET") {
        return json(route, [{
          id: 17,
          reporter_id: 3,
          target_type: "question",
          target_id: 44,
          reason: "spam",
          details: "محتوای تبلیغاتی تکراری",
          status: "open",
          resolution: null,
          assigned_to: null,
          created_at: now,
          resolved_at: null,
        }]);
      }
      if (path === "/trust/moderation/reports/17/claim" && method === "POST") {
        claimed = true;
        return json(route, { id: 17, status: "reviewing", assigned_to: 8 });
      }
      return json(route, { detail: `Unhandled phase-four mock: ${path}` }, 404);
    });

    await page.goto("/moderation", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("محتوای تبلیغاتی تکراری")).toBeVisible();
    await page.getByRole("button", { name: "شروع بررسی" }).click();
    await expect(page.getByText("گزارش برای بررسی شما رزرو شد", { exact: false })).toBeVisible();
    expect(claimed).toBe(true);
  });

  test("moderation notifications have a distinct user-facing label", async ({ page }) => {
    await page.route("**/api/backend/**", async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api\/backend/, "");
      if (path === "/auth/refresh") return json(route, { access_token: "phase4-access-token" });
      if (path === "/notifications") {
        return json(route, [{
          id: 33,
          type: "moderation",
          title: "نتیجه بررسی گزارش",
          body: "محتوای گزارش‌شده بررسی شد.",
          target_url: "/community",
          metadata: {},
          is_read: false,
          created_at: now,
          actor: null,
        }]);
      }
      return json(route, {}, 404);
    });

    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("نتیجه بررسی گزارش")).toBeVisible();
    await expect(page.getByText("مدیریت محتوا")).toBeVisible();
  });

  test("an MFA-verified admin reaches the dashboard with partial lists safely isolated", async ({ page }) => {
    await page.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api\/backend/, "");

      if (path === "/auth/refresh") return json(route, { access_token: "phase4-admin-token" });
      if (path === "/admin/me") {
        return json(route, { is_admin: true, email: "admin@example.com", mfa_enabled: true, mfa_verified: true });
      }
      if (path === "/admin/overview") {
        return json(route, {
          stats: [{ key: "users", label: "کاربران", value: 12 }],
          recent_users: [],
          recent_courses: [],
          recent_words: [],
        });
      }
      if (path === "/admin/users" || path === "/admin/dictionary" || path === "/courses/taxonomy" || path === "/courses/") {
        return json(route, []);
      }
      if (path === "/notifications/latest") return json(route, []);
      return json(route, { detail: `Unhandled phase-four mock: ${path}` }, 404);
    });

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "پنل ادمین چین‌ورس" })).toBeVisible();
    await expect(page.getByText("۱۲")).toBeVisible();
    await expect(page.getByRole("link", { name: "مدیریت گزارش‌ها" })).toBeVisible();
  });
});
