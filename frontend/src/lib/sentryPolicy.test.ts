import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import {
  redactSensitiveText,
  safeRoute,
  sanitizeSentryEvent,
  sentryRuntimeOptions,
} from "./sentryPolicy";

describe("Sentry privacy policy", () => {
  it("removes PII, request data and query strings while retaining correlation", () => {
    const event = sanitizeSentryEvent({
      message: "failed email=user@example.com token=secret-value",
      transaction: "https://chinverse.app/chat/42?token=secret",
      user: { id: "42", email: "user@example.com", ip_address: "203.0.113.4" },
      tags: { request_id: "123e4567-e89b-12d3-a456-426614174000", unsafe: "value" },
      request: {
        method: "GET",
        url: "https://chinverse.app/chat/42?token=secret#fragment",
        query_string: "token=secret",
        data: { password: "secret" },
        cookies: { session: "secret" },
        headers: {
          Authorization: "Bearer secret",
          "X-Request-ID": "123e4567-e89b-12d3-a456-426614174000",
        },
      },
      breadcrumbs: [{ message: "private" }],
      contexts: { private: { value: "secret" } },
      extra: { private: "secret" },
      exception: {
        values: [{
          value: "Authorization: Bearer abc user@example.com",
          stacktrace: {
            frames: [{
              filename: "https://chinverse.app/_next/app.js?token=secret",
              vars: { token: "secret" },
              context_line: "const token = secret",
              pre_context: ["private"],
              post_context: ["private"],
            }],
          },
        }],
      },
    } as unknown as ErrorEvent);

    expect(event.user).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.contexts).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.tags).toEqual({ request_id: "123e4567-e89b-12d3-a456-426614174000" });
    expect(event.request).toEqual({
      method: "GET",
      url: "/chat/:id",
      headers: { "x-request-id": "123e4567-e89b-12d3-a456-426614174000" },
    });
    expect(event.transaction).toBe("/chat/:id");
    expect(event.message).not.toContain("user@example.com");
    expect(event.message).not.toContain("secret-value");
    expect(event.exception?.values?.[0]?.value).not.toContain("abc");
    expect(event.exception?.values?.[0]?.stacktrace?.frames?.[0]).toMatchObject({
      filename: "/_next/app.js",
    });
    expect(event.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars).toBeUndefined();
  });

  it("is disabled unless both the explicit switch and DSN exist", () => {
    expect(sentryRuntimeOptions({
      enabled: false,
      dsn: "https://public@example.invalid/1",
      environment: "staging",
      release: "sha",
    }).enabled).toBe(false);
    expect(sentryRuntimeOptions({
      enabled: true,
      dsn: undefined,
      environment: "staging",
      release: "sha",
    }).enabled).toBe(false);
  });

  it("scrubs routes and common secret formats", () => {
    expect(safeRoute("/api/backend/chat?access_token=secret#x")).toBe("/api/backend/chat");
    expect(safeRoute("GET /chat/42?access_token=secret")).toBe("GET /chat/:id");
    expect(safeRoute("/users/123e4567-e89b-12d3-a456-426614174000"))
      .toBe("/users/:id");
    expect(safeRoute("/chat/%34%32/messages")).toBe("/chat/:id/messages");
    expect(redactSensitiveText("password=hunter2 Bearer abc user@example.com"))
      .toBe("password=[redacted] Bearer [redacted] [redacted-email]");
  });
});
