import { timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const maxDuration = 15;

const templates = {
    verify_email: {
        path: "/verify-account",
        tokenName: "email_token",
        subject: "تأیید نشانی ایمیل چین‌ورس",
        instruction: "برای فعال‌کردن حساب چین‌ورس، این لینک را باز کن.",
    },
    password_reset: {
        path: "/forgot-password",
        tokenName: "token",
        subject: "بازیابی رمز عبور چین‌ورس",
        instruction: "برای انتخاب رمز تازهٔ چین‌ورس، این لینک را باز کن.",
    },
} as const;

const emailPattern = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const opaqueTokenPattern = /^[A-Za-z0-9_-]{43}$/;

function reply(status: number) {
    return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
    const secret = process.env.AUTH_DELIVERY_WEBHOOK_SECRET?.trim();
    if (!secret || secret.length < 32) return reply(503);

    const authorization = Buffer.from(request.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    if (authorization.length !== expected.length || !timingSafeEqual(authorization, expected)) {
        return reply(401);
    }

    const host = process.env.AUTH_SMTP_HOST?.trim();
    const user = process.env.AUTH_SMTP_USER?.trim();
    const pass = process.env.AUTH_SMTP_PASSWORD;
    const from = process.env.AUTH_SMTP_FROM?.trim();
    const port = Number(process.env.AUTH_SMTP_PORT || "587");
    const publicUrl = URL.parse(process.env.AUTH_EMAIL_PUBLIC_URL ?? "");
    if (!host || !user || !pass || !from || !emailPattern.test(from)
        || publicUrl?.protocol !== "https:" || !Number.isInteger(port) || port < 1 || port > 65535) {
        return reply(503);
    }

    const body = await request.json().catch(() => null) as {
        purpose?: unknown;
        destination?: unknown;
        link?: unknown;
    } | null;
    if (!body || (body.purpose !== "verify_email" && body.purpose !== "password_reset")
        || typeof body.destination !== "string" || body.destination.length > 254
        || !emailPattern.test(body.destination) || typeof body.link !== "string") {
        return reply(400);
    }

    const template = templates[body.purpose];
    const link = URL.parse(body.link);
    const token = link?.searchParams.get(template.tokenName) ?? "";
    if (link?.origin !== publicUrl.origin || link.pathname !== template.path || !opaqueTokenPattern.test(token)) {
        return reply(400);
    }

    const allowlist = (process.env.AUTH_EMAIL_TEST_RECIPIENTS ?? "")
        .split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
    if (allowlist.length && !allowlist.includes(body.destination.toLowerCase())) return reply(204);

    // Rebuild from the configured origin and the validated token.
    const actionUrl = new URL(template.path, publicUrl);
    actionUrl.searchParams.set(template.tokenName, token);
    const smtp = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: true,
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 6000,
        disableFileAccess: true,
        disableUrlAccess: true,
    });

    try {
        await smtp.sendMail({
            from: { name: "چین‌ورس", address: from },
            to: { name: "", address: body.destination },
            subject: template.subject,
            text: [
                template.instruction,
                "",
                actionUrl.href,
                "",
                "این لینک تا ۳۰ دقیقه معتبر است. اگر خودت این درخواست را ثبت نکردی، می‌توانی این ایمیل را نادیده بگیری.",
            ].join("\n"),
            headers: { IsTransactional: "True" },
        });
        return reply(204);
    } catch {
        console.warn("SMTP did not accept the Chinverse account email", { purpose: body.purpose });
        return reply(502);
    }
}
