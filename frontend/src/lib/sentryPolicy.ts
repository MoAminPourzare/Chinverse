import type { ErrorEvent } from "@sentry/nextjs";
import { REQUEST_ID_PATTERN } from "@/lib/requestId";

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const SECRET_ASSIGNMENT_PATTERN = /(authorization|cookie|password|secret|token|api[_-]?key)(\s*[:=]\s*)([^\s,;]+)/gi;
const UUID_SEGMENT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ULID_SEGMENT_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const LONG_HEX_SEGMENT_PATTERN = /^[0-9a-f]{16,}$/i;
const NUMERIC_SEGMENT_PATTERN = /^\d+$/;

export type SentryRuntimeInput = {
  dsn?: string;
  enabled: boolean;
  environment: string;
  release?: string;
};

export const redactSensitiveText = (value: string): string => value
  .replace(EMAIL_PATTERN, "[redacted-email]")
  .replace(BEARER_PATTERN, "Bearer [redacted]")
  .replace(SECRET_ASSIGNMENT_PATTERN, "$1$2[redacted]");

const routeWithoutIdentifiers = (pathname: string): string => pathname
  .split("/")
  .map((segment) => {
    let candidate = segment;
    try {
      candidate = decodeURIComponent(segment);
    } catch {
      // Malformed escaping is preserved as a route label, never decoded into
      // event data.
    }
    return NUMERIC_SEGMENT_PATTERN.test(candidate)
      || UUID_SEGMENT_PATTERN.test(candidate)
      || ULID_SEGMENT_PATTERN.test(candidate)
      || LONG_HEX_SEGMENT_PATTERN.test(candidate)
      ? ":id"
      : segment;
  })
  .join("/");

export const safeRoute = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const methodRoute = value.match(/^([A-Z]+)\s+(\/.*)$/);
  if (methodRoute) {
    return `${methodRoute[1]} ${routeWithoutIdentifiers(methodRoute[2].split(/[?#]/, 1)[0])}`;
  }
  try {
    const parsed = new URL(value, "https://chinverse.invalid");
    return routeWithoutIdentifiers(parsed.pathname);
  } catch {
    return routeWithoutIdentifiers(value.split(/[?#]/, 1)[0]);
  }
};

const requestIdFromEvent = (event: ErrorEvent): string | undefined => {
  const tagValue = event.tags?.request_id;
  if (typeof tagValue === "string" && REQUEST_ID_PATTERN.test(tagValue)) return tagValue;

  const headers = event.request?.headers;
  if (!headers) return undefined;
  const candidate = Object.entries(headers).find(([name]) => name.toLowerCase() === "x-request-id")?.[1];
  return typeof candidate === "string" && REQUEST_ID_PATTERN.test(candidate)
    ? candidate
    : undefined;
};

/**
 * Keep error text, stack locations, route, release and request ID only. Request
 * bodies, query strings, headers, cookies, user data, breadcrumbs and local
 * variables are deliberately removed before an event can leave the app.
 */
export const sanitizeSentryEvent = (event: ErrorEvent): ErrorEvent => {
  const requestId = requestIdFromEvent(event);

  delete event.user;
  delete event.breadcrumbs;
  delete event.contexts;
  delete event.extra;
  delete event.modules;
  delete event.server_name;
  delete event.spans;

  event.tags = requestId ? { request_id: requestId } : undefined;
  if (event.message) event.message = redactSensitiveText(event.message);
  if (event.transaction) event.transaction = safeRoute(event.transaction);

  if (event.request) {
    event.request = {
      method: event.request.method,
      url: safeRoute(event.request.url),
      headers: requestId ? { "x-request-id": requestId } : undefined,
    };
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactSensitiveText(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (frame.filename) frame.filename = safeRoute(frame.filename);
      delete frame.vars;
      delete frame.context_line;
      delete frame.pre_context;
      delete frame.post_context;
    }
  }

  return event;
};

export const sentryRuntimeOptions = ({
  dsn,
  enabled,
  environment,
  release,
}: SentryRuntimeInput) => ({
  dsn: enabled ? dsn : undefined,
  enabled: enabled && Boolean(dsn),
  environment,
  release,
  sendDefaultPii: false,
  attachStacktrace: true,
  tracesSampleRate: 0,
  maxBreadcrumbs: 0,
  beforeBreadcrumb: () => null,
  beforeSend: sanitizeSentryEvent,
  beforeSendTransaction: () => null,
});
