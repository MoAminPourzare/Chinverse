import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { sendMail, createTransport } = vi.hoisted(() => {
    const sendMail = vi.fn().mockResolvedValue({});
    return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});
vi.mock("nodemailer", () => ({ default: { createTransport } }));

const secret = "test-only-delivery-secret-over-32-characters";
const token = "x".repeat(43);

function request(overrides: Record<string, string> = {}, bearer = secret) {
    return new Request("https://chinverse.test/api/auth-delivery", {
        method: "POST",
        headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json" },
        body: JSON.stringify({
            purpose: "verify_email",
            destination: "learner@example.test",
            token,
            ...overrides,
        }),
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTH_DELIVERY_WEBHOOK_SECRET", secret);
    vi.stubEnv("AUTH_SMTP_HOST", "smtp.example.test");
    vi.stubEnv("AUTH_SMTP_PORT", "587");
    vi.stubEnv("AUTH_SMTP_USER", "test-smtp-user");
    vi.stubEnv("AUTH_SMTP_PASSWORD", "test-smtp-password");
    vi.stubEnv("AUTH_SMTP_FROM", "no-reply@chinverse.test");
    vi.stubEnv("AUTH_EMAIL_TEST_RECIPIENTS", "");
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("account email delivery", () => {
    it("rejects requests without the configured bearer before contacting SMTP", async () => {
        expect((await POST(request({}, "wrong-secret"))).status).toBe(401);
        expect(createTransport).not.toHaveBeenCalled();
    });

    it.each(["verify_email", "password_reset"])("rejects invalid codes for %s before contacting SMTP", async (purpose) => {
        expect((await POST(request({ purpose, token: "invalid" }))).status).toBe(400);
        expect(createTransport).not.toHaveBeenCalled();
    });

    it("uses authenticated STARTTLS to send an email verification code", async () => {
        expect((await POST(request())).status).toBe(204);
        expect(sendMail).toHaveBeenCalledTimes(1);
        expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
            host: "smtp.example.test",
            port: 587,
            requireTLS: true,
            auth: { user: "test-smtp-user", pass: "test-smtp-password" },
        }));
        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: { name: "", address: "learner@example.test" },
            subject: "کد تأیید ایمیل چین‌ورس",
            headers: { IsTransactional: "True" },
        }));
        expect(sendMail.mock.calls[0][0].html).toContain('href="{unsubscribe}"');
        expect(sendMail.mock.calls[0][0].text).toContain("مدیریت دریافت ایمیل‌ها: {unsubscribe}");
        expect(sendMail.mock.calls[0][0].html).toContain(`>${token}</p>`);
        expect(sendMail.mock.calls[0][0].text.split("\n")).toContain(token);
        expect(sendMail.mock.calls[0][0].html).not.toContain("https://");
        expect(sendMail.mock.calls[0][0].text).not.toContain("https://");
    });

    it("includes a copyable recovery code and respects the optional test recipient list", async () => {
        vi.stubEnv("AUTH_EMAIL_TEST_RECIPIENTS", "tester@example.test");
        const purpose = "password_reset";
        expect((await POST(request({ purpose }))).status).toBe(204);
        expect(sendMail).not.toHaveBeenCalled();

        const destination = "tester@example.test";
        const oldLink = `https://chinverse.test/forgot-password?token=${token}`;
        expect((await POST(request({ purpose, destination, link: oldLink }))).status).toBe(204);
        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
            subject: "کد بازیابی رمز عبور چین‌ورس",
            headers: { IsTransactional: "True" },
        }));
        const message = sendMail.mock.calls[0][0];
        expect(message.html).toContain(`>${token}</p>`);
        expect(message.text.split("\n")).toContain(token);
        expect(message.html).not.toContain("https://");
        expect(message.text).not.toContain("https://");
    });
});
