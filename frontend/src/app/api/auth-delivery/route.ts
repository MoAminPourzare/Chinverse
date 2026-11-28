import { timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const maxDuration = 15;

const templates = {
    verify_email: {
        path: "/verify-account",
        tokenName: "email_token",
        subject: "حساب چین‌ورس را تأیید کن",
        heading: "به چین‌ورس خوش اومدی!",
        instruction: "برای فعال‌شدن حسابت و شروع یادگیری، نشانی ایمیلت را تأیید کن.",
        button: "تأیید حساب",
    },
    password_reset: {
        path: "/forgot-password",
        tokenName: "token",
        subject: "بازیابی رمز عبور چین‌ورس",
        heading: "رمز تازه‌ای انتخاب کن",
        instruction: "درخواست بازیابی رمز حسابت در چین‌ورس ثبت شد. برای انتخاب رمز تازه، دکمهٔ زیر را بزن.",
        button: "انتخاب رمز جدید",
    },
} as const;

const emailPattern = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const opaqueTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const expiryNote = "این لینک تا ۳۰ دقیقه اعتبار دارد.";
const ignoreNote = "اگر خودت این درخواست را ثبت نکردی، می‌توانی این ایمیل را نادیده بگیری.";

function renderEmail(template: typeof templates[keyof typeof templates], url: URL) {
    return {
        text: [
            template.heading,
            template.instruction,
            "",
            `${template.button}: ${url.href}`,
            "",
            expiryNote,
            ignoreNote,
            "",
            "مدیریت دریافت ایمیل‌ها: {unsubscribe}",
        ].join("\n"),
        html: `<!doctype html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f5fa;color:#172940;font-family:Tahoma,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f5fa">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="rtl" style="max-width:520px;background:#fff;border:1px solid #d9e5f1;border-radius:18px">
        <tr><td align="right" style="padding:26px 24px;background:#e7f1fc;border-radius:18px 18px 0 0;color:#155aa6;font-size:22px;font-weight:bold">چین‌ورس</td></tr>
        <tr><td align="right" style="padding:28px 24px">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.6;color:#172940">${template.heading}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#334961">${template.instruction}</p>
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td bgcolor="#155aa6" style="border-radius:10px">
              <a href="${url.href}" style="display:inline-block;padding:13px 24px;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;line-height:1.5">${template.button}</a>
            </td>
          </tr></table>
          <p style="margin:22px 0 0;color:#52677e;font-size:13px;line-height:1.9">${expiryNote} ${ignoreNote}</p>
        </td></tr>
        <tr><td align="right" style="padding:16px 24px;border-top:1px solid #e1ebf4;color:#52677e;font-size:12px">
          <a href="{unsubscribe}" style="color:#52677e;text-decoration:underline">مدیریت دریافت ایمیل‌ها</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    };
}

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
            ...renderEmail(template, actionUrl),
            headers: { IsTransactional: "True" },
        });
        return reply(204);
    } catch {
        console.warn("SMTP did not accept the Chinverse account email", { purpose: body.purpose });
        return reply(502);
    }
}
