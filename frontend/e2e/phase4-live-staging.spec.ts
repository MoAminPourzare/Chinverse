import {
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type APIResponse,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { createHmac } from "node:crypto";

const LIVE_ENABLED = process.env.RUN_PHASE4_LIVE === "1";
const USER_AGENT = "Chinverse-Phase4-Live-Smoke/1.0";
const REFRESH_COOKIE_DEFAULT = "__Host-chinverse_refresh";
const API_HOST_DEFAULT = "moamin9-chinverse-api.hf.space";
const FIXTURE_EMAIL_PATTERN = /^[a-z0-9][a-z0-9._+-]{0,63}@[a-z0-9.-]+\.[a-z]{2,63}$/;
const FIXTURE_RUN_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{4,38}[a-z0-9])?$/;

type StorageState = Awaited<ReturnType<APIRequestContext["storageState"]>>;
type StorageCookie = StorageState["cookies"][number];

interface FixtureCredentials {
  email: string;
  password: string;
}

interface LiveConfig {
  previewOrigin: string;
  apiBase: string;
  wsUrl: string;
  bypassSecret: string;
  refreshCookieName: string;
  fixtureRunId: string;
  u1: FixtureCredentials;
  u2: FixtureCredentials;
  moderator: FixtureCredentials;
  admin: FixtureCredentials;
}

interface TokenResponse {
  access_token: string;
  mfa_verified: boolean;
}

interface Actor {
  label: string;
  email: string;
  password: string;
  api: APIRequestContext;
  accessToken: string;
  sessionId: string;
  userId: number;
}

interface LiveSocket {
  context: BrowserContext;
  page: Page;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  data?: unknown;
  form?: Record<string, string>;
  expected: number | number[];
  authenticated?: boolean;
}

function safeInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[phase4-live] ${message}`);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  safeInvariant(value, `required environment variable ${name} is missing`);
  return value;
}

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function requiredAnyEnv(...names: string[]): string {
  const value = firstEnv(...names);
  safeInvariant(value, `one of these environment variables is required: ${names.join(", ")}`);
  return value;
}

function normalizedOrigin(name: string): string {
  const raw = requiredEnv(name);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`[phase4-live] ${name} must be an absolute HTTPS URL`);
  }
  safeInvariant(parsed.protocol === "https:", `${name} must use HTTPS`);
  safeInvariant(
    parsed.hostname.endsWith(".vercel.app"),
    `${name} must be a Vercel preview hostname ending in .vercel.app`,
  );
  safeInvariant(!parsed.username && !parsed.password, `${name} must not contain credentials`);
  safeInvariant(parsed.pathname === "/" || parsed.pathname === "", `${name} must be an origin without a path`);
  safeInvariant(!parsed.search && !parsed.hash, `${name} must not contain a query or fragment`);
  return parsed.origin;
}

function normalizedApiBase(): string {
  const raw = requiredEnv("PHASE4_LIVE_API_URL").replace(/\/$/, "");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("[phase4-live] PHASE4_LIVE_API_URL must be an absolute HTTPS URL");
  }
  safeInvariant(parsed.protocol === "https:", "PHASE4_LIVE_API_URL must use HTTPS");
  const expectedHost =
    process.env.PHASE4_LIVE_EXPECTED_API_HOST?.trim().toLowerCase() || API_HOST_DEFAULT;
  safeInvariant(
    parsed.hostname.toLowerCase() === expectedHost,
    "PHASE4_LIVE_API_URL host does not match PHASE4_LIVE_EXPECTED_API_HOST",
  );
  safeInvariant(parsed.pathname.endsWith("/api/v1"), "PHASE4_LIVE_API_URL must end in /api/v1");
  safeInvariant(!parsed.username && !parsed.password, "PHASE4_LIVE_API_URL must not contain credentials");
  safeInvariant(!parsed.search && !parsed.hash, "PHASE4_LIVE_API_URL must not contain a query or fragment");
  return raw;
}

function fixture(
  label: "user-1" | "user-2" | "moderator" | "admin",
  passwordPrefix: "U1" | "U2" | "MODERATOR" | "ADMIN",
  sharedPasswordEnvironment: string,
  fixtureRunId: string,
): FixtureCredentials {
  return {
    email: `phase4-${fixtureRunId}-${label}@example.com`,
    password: requiredAnyEnv(
      `PHASE4_LIVE_${passwordPrefix}_PASSWORD`,
      sharedPasswordEnvironment,
    ),
  };
}

function loadConfig(): LiveConfig {
  const previewOrigin = normalizedOrigin("PHASE4_LIVE_PREVIEW_URL");
  const apiBase = normalizedApiBase();
  const wsUrl = `${apiBase.replace(/^https:/, "wss:")}/chat/ws`;
  const fixtureRunId = requiredEnv("CHINVERSE_PHASE4_RUN_ID").toLowerCase();
  safeInvariant(
    FIXTURE_RUN_ID_PATTERN.test(fixtureRunId),
    "CHINVERSE_PHASE4_RUN_ID does not match the backend fixture run-id contract",
  );
  const u1 = fixture("user-1", "U1", "CHINVERSE_PHASE4_USER_1_PASSWORD", fixtureRunId);
  const u2 = fixture("user-2", "U2", "CHINVERSE_PHASE4_USER_2_PASSWORD", fixtureRunId);
  const moderator = fixture(
    "moderator",
    "MODERATOR",
    "CHINVERSE_PHASE4_MODERATOR_PASSWORD",
    fixtureRunId,
  );
  const admin = fixture("admin", "ADMIN", "CHINVERSE_PHASE4_ADMIN_PASSWORD", fixtureRunId);

  const emails = [u1.email, u2.email, moderator.email, admin.email];
  safeInvariant(new Set(emails).size === 4, "all four fixture email addresses must be distinct");
  for (const email of emails) {
    safeInvariant(FIXTURE_EMAIL_PATTERN.test(email), "fixture email format is invalid");
  }

  return {
    previewOrigin,
    apiBase,
    wsUrl,
    bypassSecret: requiredEnv("PHASE4_LIVE_VERCEL_BYPASS_SECRET"),
    refreshCookieName:
      process.env.PHASE4_LIVE_REFRESH_COOKIE_NAME?.trim() || REFRESH_COOKIE_DEFAULT,
    fixtureRunId,
    u1,
    u2,
    moderator,
    admin,
  };
}

function mutationHeaders(origin: string): Record<string, string> {
  return {
    Origin: origin,
    "Sec-Fetch-Site": "same-origin",
  };
}

function assertStatus(response: APIResponse, expected: number | number[], operation: string): void {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(response.status())) {
    throw new Error(
      `[phase4-live] ${operation}: expected HTTP ${allowed.join("/")}, received ${response.status()}`,
    );
  }
}

async function safeJson<T>(response: APIResponse, operation: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`[phase4-live] ${operation}: response was not valid JSON`);
  }
}

function decodeSessionId(accessToken: string): string {
  const segments = accessToken.split(".");
  safeInvariant(segments.length === 3, "access token format is invalid");
  try {
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8")) as {
      sid?: unknown;
    };
    safeInvariant(typeof payload.sid === "string" && payload.sid.length > 0, "access token has no session id");
    return payload.sid;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[phase4-live]")) throw error;
    throw new Error("[phase4-live] access token payload could not be decoded");
  }
}

function base32Decode(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = value.toUpperCase().replace(/[\s=-]/g, "");
  safeInvariant(normalized.length > 0, "admin TOTP secret is empty");
  let bits = "";
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    safeInvariant(index >= 0, "admin TOTP secret is not valid Base32");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function totp(secret: string, counterOffset = 1): string {
  const counter = Math.floor(Date.now() / 30_000) + counterOffset;
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

async function waitForNextTotpStep(): Promise<void> {
  const remaining = 30_000 - (Date.now() % 30_000) + 750;
  await new Promise((resolve) => setTimeout(resolve, remaining));
}

async function bootstrapVercelBypass(config: LiveConfig): Promise<StorageCookie> {
  const api = await playwrightRequest.newContext({
    baseURL: config.previewOrigin,
    userAgent: USER_AGENT,
  });
  try {
    const response = await api.get("/api/health", {
      maxRedirects: 0,
      headers: {
        "x-vercel-protection-bypass": config.bypassSecret,
        "x-vercel-set-bypass-cookie": "true",
      },
    });
    assertStatus(response, [200, 307], "Vercel protection bypass bootstrap");
    const state = await api.storageState();
    const bypassCookie = state.cookies.find((cookie) => cookie.name === "_vercel_jwt");
    safeInvariant(bypassCookie, "Vercel bypass bootstrap did not set _vercel_jwt");
    safeInvariant(bypassCookie.secure, "Vercel bypass cookie is not Secure");
    const cookieOnlyHealth = await api.get("/api/health", { maxRedirects: 0 });
    assertStatus(cookieOnlyHealth, 200, "Vercel bypass cookie verification");
    return bypassCookie;
  } finally {
    await api.dispose();
  }
}

async function newFixtureApi(config: LiveConfig, bypassCookie: StorageCookie): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: config.previewOrigin,
    userAgent: USER_AGENT,
    storageState: { cookies: [bypassCookie], origins: [] },
  });
}

async function loginResponse(
  api: APIRequestContext,
  config: LiveConfig,
  credentials: FixtureCredentials,
  mfaCode?: string,
): Promise<APIResponse> {
  return api.post("/api/backend/login/access-token", {
    headers: {
      ...mutationHeaders(config.previewOrigin),
      ...(mfaCode ? { "X-MFA-Code": mfaCode } : {}),
    },
    form: {
      username: credentials.email,
      password: credentials.password,
    },
  });
}

async function loginActor(
  label: string,
  credentials: FixtureCredentials,
  config: LiveConfig,
  bypassCookie: StorageCookie,
  mfaCode?: string,
): Promise<Actor> {
  const api = await newFixtureApi(config, bypassCookie);
  try {
    const response = await loginResponse(api, config, credentials, mfaCode);
    assertStatus(response, 200, `${label} login`);
    const token = await safeJson<TokenResponse>(response, `${label} login`);
    safeInvariant(typeof token.access_token === "string" && token.access_token.length > 40, `${label} login returned no access token`);
    const accessToken = token.access_token;
    const sessionId = decodeSessionId(accessToken);
    const meResponse = await api.get("/api/backend/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assertStatus(meResponse, 200, `${label} identity`);
    const me = await safeJson<{ id?: unknown; email?: unknown }>(meResponse, `${label} identity`);
    safeInvariant(typeof me.id === "number" && me.id > 0, `${label} identity has no numeric user id`);
    safeInvariant(me.email === credentials.email, `${label} identity did not match its fixture email`);
    return {
      label,
      email: credentials.email,
      password: credentials.password,
      api,
      accessToken,
      sessionId,
      userId: me.id,
    };
  } catch (error) {
    await api.dispose();
    throw error;
  }
}

async function actorRequest(
  actor: Actor,
  config: LiveConfig,
  path: string,
  options: RequestOptions,
): Promise<APIResponse> {
  const method = options.method || "GET";
  const authenticated = options.authenticated !== false;
  const headers: Record<string, string> = {};
  if (authenticated) headers.Authorization = `Bearer ${actor.accessToken}`;
  if (["POST", "PATCH", "DELETE"].includes(method)) {
    Object.assign(headers, mutationHeaders(config.previewOrigin));
  }
  const response = await actor.api.fetch(`/api/backend${path}`, {
    method,
    headers,
    data: options.data,
    form: options.form,
  });
  assertStatus(response, options.expected, `${actor.label} ${method} ${path}`);
  return response;
}

function refreshCookie(state: StorageState, config: LiveConfig): StorageCookie {
  const cookie = state.cookies.find((item) => item.name === config.refreshCookieName);
  safeInvariant(cookie, `refresh cookie ${config.refreshCookieName} is missing`);
  return cookie;
}

function assertRefreshCookieMetadata(cookie: StorageCookie, config: LiveConfig): void {
  const host = new URL(config.previewOrigin).hostname;
  safeInvariant(cookie.httpOnly, "refresh cookie is not HttpOnly");
  safeInvariant(cookie.secure, "refresh cookie is not Secure");
  safeInvariant(cookie.sameSite === "Strict", "refresh cookie SameSite is not Strict");
  safeInvariant(cookie.path === "/", "refresh cookie Path is not /");
  safeInvariant(cookie.domain === host, "refresh cookie is not host-only for the preview host");
  safeInvariant(!cookie.domain.startsWith("."), "refresh cookie uses a Domain scope");
  safeInvariant(cookie.value.length > 20, "refresh cookie value is unexpectedly short");
}

async function refreshActor(actor: Actor, config: LiveConfig): Promise<StorageCookie> {
  const before = refreshCookie(await actor.api.storageState(), config);
  assertRefreshCookieMetadata(before, config);
  const response = await actorRequest(actor, config, "/auth/refresh", {
    method: "POST",
    expected: 200,
    authenticated: false,
  });
  const token = await safeJson<TokenResponse>(response, `${actor.label} refresh`);
  safeInvariant(typeof token.access_token === "string" && token.access_token.length > 40, `${actor.label} refresh returned no access token`);
  actor.accessToken = token.access_token;
  actor.sessionId = decodeSessionId(actor.accessToken);
  const after = refreshCookie(await actor.api.storageState(), config);
  assertRefreshCookieMetadata(after, config);
  safeInvariant(after.value !== before.value, "refresh cookie did not rotate");
  return before;
}

async function openLiveSocket(browser: Browser, actor: Actor, config: LiveConfig): Promise<LiveSocket> {
  safeInvariant(new URL(config.wsUrl).search === "", "WebSocket URL must not contain query parameters");
  const context = await browser.newContext({
    storageState: await actor.api.storageState(),
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
  });
  const page = await context.newPage();
  try {
    const healthResponse = await page.goto(`${config.previewOrigin}/api/health`, {
      waitUntil: "domcontentloaded",
    });
    safeInvariant(healthResponse?.status() === 200, `${actor.label} browser bypass cookie was not accepted`);
    await page.evaluate(
      ({ wsUrl, token, expectedUserId }) =>
        new Promise<void>((resolve, reject) => {
          const socket = new WebSocket(wsUrl);
          const state: {
            socket: WebSocket;
            events: Array<Record<string, unknown>>;
            closeCode: number | null;
          } = { socket, events: [], closeCode: null };
          Reflect.set(window, "__phase4LiveSocket", state);
          const timeout = window.setTimeout(() => reject(new Error("WebSocket ready timeout")), 12_000);
          socket.onopen = () => socket.send(JSON.stringify({ type: "auth", token }));
          socket.onerror = () => {
            window.clearTimeout(timeout);
            reject(new Error("WebSocket connection failed"));
          };
          socket.onclose = (event) => {
            state.closeCode = event.code;
          };
          socket.onmessage = (event) => {
            let payload: unknown;
            try {
              payload = JSON.parse(String(event.data));
            } catch {
              return;
            }
            if (!payload || typeof payload !== "object") return;
            const message = payload as Record<string, unknown>;
            if (message.type === "connection:ready") {
              window.clearTimeout(timeout);
              if (message.user_id !== expectedUserId) {
                reject(new Error("WebSocket identity mismatch"));
                return;
              }
              resolve();
              return;
            }
            state.events.push(message);
          };
        }),
      { wsUrl: config.wsUrl, token: actor.accessToken, expectedUserId: actor.userId },
    );
    return { context, page };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function waitForSocketEvent(
  liveSocket: LiveSocket,
  eventType: "message:new" | "messages:read",
  messageId: number,
): Promise<void> {
  await liveSocket.page.evaluate(
    ({ expectedType, expectedMessageId }) =>
      new Promise<void>((resolve, reject) => {
        const deadline = Date.now() + 12_000;
        const poll = () => {
          const state = Reflect.get(window, "__phase4LiveSocket") as
            | { events: Array<Record<string, unknown>>; closeCode: number | null }
            | undefined;
          if (!state) {
            reject(new Error("WebSocket state is unavailable"));
            return;
          }
          const index = state.events.findIndex((event) => {
            if (event.type !== expectedType) return false;
            if (expectedType === "message:new") {
              const message = event.message;
              return (
                Boolean(message) &&
                typeof message === "object" &&
                (message as Record<string, unknown>).id === expectedMessageId
              );
            }
            const ids = event.message_ids;
            return Array.isArray(ids) && ids.includes(expectedMessageId);
          });
          if (index >= 0) {
            state.events.splice(index, 1);
            resolve();
            return;
          }
          if (state.closeCode !== null) {
            reject(new Error(`WebSocket closed before ${expectedType}`));
            return;
          }
          if (Date.now() >= deadline) {
            reject(new Error(`WebSocket event timeout for ${expectedType}`));
            return;
          }
          window.setTimeout(poll, 100);
        };
        poll();
      }),
    { expectedType: eventType, expectedMessageId: messageId },
  );
}

async function closeLiveSocket(liveSocket: LiveSocket | undefined): Promise<void> {
  if (!liveSocket) return;
  try {
    await liveSocket.page.evaluate(() => {
      const state = Reflect.get(window, "__phase4LiveSocket") as
        | { socket: WebSocket }
        | undefined;
      state?.socket.close(1000, "phase4-live-complete");
    });
  } catch {
    // The server may already have closed the socket after a session revocation.
  }
  await liveSocket.context.close();
}

async function expectSocketRevoked(liveSocket: LiveSocket): Promise<void> {
  const closeCode = await liveSocket.page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const state = Reflect.get(window, "__phase4LiveSocket") as
          | { socket: WebSocket; closeCode: number | null }
          | undefined;
        if (!state) {
          reject(new Error("WebSocket state is unavailable"));
          return;
        }
        if (state.closeCode !== null) {
          resolve(state.closeCode);
          return;
        }
        const timeout = window.setTimeout(() => reject(new Error("WebSocket revoke timeout")), 12_000);
        state.socket.addEventListener(
          "close",
          (event) => {
            window.clearTimeout(timeout);
            resolve(event.code);
          },
          { once: true },
        );
        state.socket.send(JSON.stringify({ type: "ping" }));
      }),
  );
  safeInvariant(closeCode === 1008, `revoked WebSocket closed with ${closeCode}, not 1008`);
}

test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe.configure({ mode: "serial", retries: 0 });

test.skip(
  ({ browserName, isMobile }) => !LIVE_ENABLED || isMobile || browserName !== "chromium",
  "Opt in with RUN_PHASE4_LIVE=1; the stateful suite runs only in desktop-chromium.",
);

test("phase four live staging user journeys", async ({ browser }) => {
  test.setTimeout(300_000);

  const config = loadConfig();
  const mutationRunId = `${Date.now().toString(36)}-${process.pid.toString(36)}`;
  console.info(
    `[phase4-live] cleanup fixture emails: u1=${config.u1.email} u2=${config.u2.email} moderator=${config.moderator.email} admin=${config.admin.email}`,
  );
  console.info(`[phase4-live] fixture run id: ${config.fixtureRunId}`);
  console.info(`[phase4-live] mutation run id: ${mutationRunId}`);

  const actors: Actor[] = [];
  let u1Socket: LiveSocket | undefined;
  let u2Socket: LiveSocket | undefined;
  let bypassCookie: StorageCookie | undefined;

  try {
    console.info("[phase4-live] bootstrap and authentication");
    bypassCookie = await bootstrapVercelBypass(config);
    const u1 = await loginActor("u1", config.u1, config, bypassCookie);
    actors.push(u1);
    const u2 = await loginActor("u2-a", config.u2, config, bypassCookie);
    actors.push(u2);
    const moderator = await loginActor("moderator", config.moderator, config, bypassCookie);
    actors.push(moderator);

    const adminSetup = await loginActor("admin-setup", config.admin, config, bypassCookie);
    actors.push(adminSetup);

    const oldU1RefreshCookie = await refreshActor(u1, config);

    console.info("[phase4-live] role boundaries");
    const moderatorAccess = await safeJson<{
      can_moderate?: unknown;
      is_admin?: unknown;
      mfa_ready?: unknown;
    }>(
      await actorRequest(moderator, config, "/trust/moderation/access", { expected: 200 }),
      "moderator access",
    );
    safeInvariant(moderatorAccess.can_moderate === true, "moderator cannot moderate");
    safeInvariant(moderatorAccess.is_admin === false, "moderator was reported as admin");
    safeInvariant(moderatorAccess.mfa_ready === true, "moderator access is not MFA-ready");
    await actorRequest(moderator, config, "/auth/mfa/setup", {
      method: "POST",
      data: { current_password: moderator.password },
      expected: 403,
    });
    await actorRequest(u1, config, "/admin/overview", { expected: 403 });
    await actorRequest(moderator, config, "/admin/overview", { expected: 403 });
    await actorRequest(adminSetup, config, "/admin/overview", { expected: 403 });

    const mfaSetup = await safeJson<{ secret?: unknown }>(
      await actorRequest(adminSetup, config, "/auth/mfa/setup", {
        method: "POST",
        data: { current_password: adminSetup.password },
        expected: 200,
      }),
      "admin MFA setup",
    );
    safeInvariant(
      typeof mfaSetup.secret === "string" && mfaSetup.secret.length >= 16,
      "admin MFA setup returned no secret",
    );
    let adminTotpSecret: string | undefined = mfaSetup.secret;
    await actorRequest(adminSetup, config, "/auth/mfa/confirm", {
      method: "POST",
      data: { code: totp(adminTotpSecret, 0) },
      expected: 200,
    });
    await actorRequest(adminSetup, config, "/users/me", { expected: 401 });

    let adminCode = totp(adminTotpSecret, 1);
    let admin: Actor;
    try {
      admin = await loginActor("admin-mfa", config.admin, config, bypassCookie, adminCode);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("received 401")) throw error;
      await waitForNextTotpStep();
      safeInvariant(adminTotpSecret, "admin TOTP secret was cleared too early");
      adminCode = totp(adminTotpSecret, 1);
      admin = await loginActor("admin-mfa", config.admin, config, bypassCookie, adminCode);
    }
    adminTotpSecret = undefined;
    adminCode = "";
    actors.push(admin);
    await actorRequest(admin, config, "/admin/overview", { expected: 200 });
    const adminAccess = await safeJson<{
      is_admin?: unknown;
      mfa_enabled?: unknown;
      mfa_verified?: unknown;
    }>(
      await actorRequest(admin, config, "/admin/me", { expected: 200 }),
      "admin MFA access",
    );
    safeInvariant(adminAccess.is_admin === true, "admin access did not report the admin role");
    safeInvariant(adminAccess.mfa_enabled === true, "admin MFA was not enabled");
    safeInvariant(adminAccess.mfa_verified === true, "admin login was not MFA-verified");

    console.info("[phase4-live] forum and moderation reports");
    const userQuestion = await safeJson<{ id?: unknown; author_user_id?: unknown }>(
      await actorRequest(u1, config, "/community/forum/questions", {
        method: "POST",
        data: {
          title: `Phase4 live user question ${mutationRunId}`,
          content: `Synthetic staging question for the Phase 4 live smoke mutation ${mutationRunId}.`,
        },
        expected: 200,
      }),
      "create user question",
    );
    safeInvariant(typeof userQuestion.id === "number", "created user question has no id");
    safeInvariant(userQuestion.author_user_id === u1.userId, "created user question owner is incorrect");
    const userQuestionId = userQuestion.id;

    await actorRequest(u2, config, `/community/forum/questions/${userQuestionId}`, {
      method: "PATCH",
      data: { title: `Forbidden edit ${mutationRunId}` },
      expected: 403,
    });
    await actorRequest(u2, config, `/community/forum/questions/${userQuestionId}`, {
      method: "DELETE",
      expected: 403,
    });
    await actorRequest(u1, config, `/community/forum/questions/${userQuestionId}`, {
      method: "PATCH",
      data: { title: `Phase4 live updated question ${mutationRunId}` },
      expected: 200,
    });

    const report = await safeJson<{ id?: unknown; status?: unknown; reporter_id?: unknown }>(
      await actorRequest(u2, config, "/trust/reports", {
        method: "POST",
        data: {
          target_type: "question",
          target_id: userQuestionId,
          reason: "spam",
          details: `Synthetic Phase 4 report ${mutationRunId}`,
        },
        expected: 201,
      }),
      "create report",
    );
    safeInvariant(typeof report.id === "number", "created report has no id");
    safeInvariant(report.status === "open", "created report is not open");
    safeInvariant(report.reporter_id === u2.userId, "created report owner is incorrect");
    const reportId = report.id;

    await actorRequest(u2, config, "/trust/reports", {
      method: "POST",
      data: { target_type: "question", target_id: userQuestionId, reason: "spam" },
      expected: 409,
    });
    await actorRequest(u1, config, "/trust/reports", {
      method: "POST",
      data: { target_type: "question", target_id: userQuestionId, reason: "other" },
      expected: 400,
    });
    await actorRequest(u1, config, "/trust/moderation/reports?report_status=open", {
      expected: 403,
    });

    const openReports = await safeJson<Array<{ id?: unknown }>>(
      await actorRequest(moderator, config, "/trust/moderation/reports?report_status=open", {
        expected: 200,
      }),
      "moderation queue",
    );
    safeInvariant(openReports.some((item) => item.id === reportId), "new report was absent from the moderation queue");
    await actorRequest(moderator, config, `/trust/moderation/reports/${reportId}/claim`, {
      method: "POST",
      expected: 200,
    });
    const removedReport = await safeJson<{ status?: unknown; resolution?: unknown }>(
      await actorRequest(moderator, config, `/trust/moderation/reports/${reportId}/resolve`, {
        method: "POST",
        data: { action: "remove", notes: `Synthetic Phase 4 removal ${mutationRunId}` },
        expected: 200,
      }),
      "resolve user report",
    );
    safeInvariant(removedReport.status === "resolved", "removed report was not resolved");
    safeInvariant(removedReport.resolution === "remove", "removed report resolution is incorrect");
    await actorRequest(u1, config, `/community/forum/questions/${userQuestionId}`, {
      expected: 404,
    });

    const adminQuestion = await safeJson<{ id?: unknown }>(
      await actorRequest(admin, config, "/community/forum/questions", {
        method: "POST",
        data: {
          title: `Phase4 live admin question ${mutationRunId}`,
          content: `Synthetic admin-owned staging question for hierarchy verification ${mutationRunId}.`,
        },
        expected: 200,
      }),
      "create admin question",
    );
    safeInvariant(typeof adminQuestion.id === "number", "created admin question has no id");
    const adminQuestionId = adminQuestion.id;
    const hierarchyReport = await safeJson<{ id?: unknown }>(
      await actorRequest(u2, config, "/trust/reports", {
        method: "POST",
        data: {
          target_type: "question",
          target_id: adminQuestionId,
          reason: "other",
          details: `Synthetic hierarchy report ${mutationRunId}`,
        },
        expected: 201,
      }),
      "create hierarchy report",
    );
    safeInvariant(typeof hierarchyReport.id === "number", "hierarchy report has no id");
    const hierarchyReportId = hierarchyReport.id;
    await actorRequest(moderator, config, `/trust/moderation/reports/${hierarchyReportId}/claim`, {
      method: "POST",
      expected: 200,
    });
    await actorRequest(moderator, config, `/trust/moderation/reports/${hierarchyReportId}/resolve`, {
      method: "POST",
      data: { action: "remove", notes: `Forbidden hierarchy removal ${mutationRunId}` },
      expected: 403,
    });
    const dismissed = await safeJson<{ status?: unknown; resolution?: unknown }>(
      await actorRequest(admin, config, `/trust/moderation/reports/${hierarchyReportId}/resolve`, {
        method: "POST",
        data: { action: "dismiss", notes: `Admin hierarchy dismissal ${mutationRunId}` },
        expected: 200,
      }),
      "admin dismiss hierarchy report",
    );
    safeInvariant(dismissed.status === "dismissed", "admin did not dismiss hierarchy report");

    console.info("[phase4-live] support ownership and admin workflow");
    const supportMessage = `Synthetic Phase 4 support ticket ${mutationRunId}; no customer data.`;
    const ticketCreated = await safeJson<{ success?: unknown; ticket_id?: unknown }>(
      await actorRequest(u1, config, "/community/support", {
        method: "POST",
        data: { message: supportMessage },
        expected: 200,
      }),
      "create support ticket",
    );
    safeInvariant(ticketCreated.success === true, "support ticket creation was not successful");
    safeInvariant(typeof ticketCreated.ticket_id === "number", "support ticket has no id");
    const ticketId = ticketCreated.ticket_id;
    const u1Tickets = await safeJson<Array<{ id?: unknown }>>(
      await actorRequest(u1, config, "/community/support?limit=100", { expected: 200 }),
      "u1 support list",
    );
    safeInvariant(u1Tickets.some((ticket) => ticket.id === ticketId), "u1 could not see its support ticket");
    const u2Tickets = await safeJson<Array<{ id?: unknown }>>(
      await actorRequest(u2, config, "/community/support?limit=100", { expected: 200 }),
      "u2 support list",
    );
    safeInvariant(!u2Tickets.some((ticket) => ticket.id === ticketId), "u2 could see u1's support ticket");
    await actorRequest(u2, config, "/admin/support-tickets", { expected: 403 });
    await actorRequest(moderator, config, "/admin/support-tickets", { expected: 403 });
    const adminTickets = await safeJson<Array<{ id?: unknown }>>(
      await actorRequest(admin, config, "/admin/support-tickets?limit=100", { expected: 200 }),
      "admin support list",
    );
    safeInvariant(adminTickets.some((ticket) => ticket.id === ticketId), "admin could not see the new support ticket");
    await actorRequest(admin, config, `/admin/support-tickets/${ticketId}`, {
      method: "PATCH",
      data: { status: "closed" },
      expected: 400,
    });
    const supportReply = `Synthetic Phase 4 support reply ${mutationRunId}.`;
    await actorRequest(admin, config, `/admin/support-tickets/${ticketId}`, {
      method: "PATCH",
      data: { status: "closed", reply: supportReply },
      expected: 200,
    });
    const u1TicketsAfterReply = await safeJson<Array<{ id?: unknown; status?: unknown; admin_reply?: unknown }>>(
      await actorRequest(u1, config, "/community/support?limit=100", { expected: 200 }),
      "u1 support list after reply",
    );
    const repliedTicket = u1TicketsAfterReply.find((ticket) => ticket.id === ticketId);
    safeInvariant(repliedTicket?.status === "closed", "support ticket did not close");
    safeInvariant(repliedTicket.admin_reply === supportReply, "support reply did not reach the ticket owner");

    console.info("[phase4-live] block, chat and realtime receipts");
    await actorRequest(u1, config, `/trust/blocks/${u2.userId}`, {
      method: "POST",
      expected: 200,
    });
    await actorRequest(u1, config, "/chat", {
      method: "POST",
      data: { receiver_id: u2.userId, content: `Blocked outbound ${mutationRunId}` },
      expected: 400,
    });
    await actorRequest(u2, config, "/chat", {
      method: "POST",
      data: { receiver_id: u1.userId, content: `Blocked inbound ${mutationRunId}` },
      expected: 400,
    });
    await actorRequest(u1, config, `/trust/blocks/${u2.userId}`, {
      method: "DELETE",
      expected: 204,
    });

    u1Socket = await openLiveSocket(browser, u1, config);
    await closeLiveSocket(u1Socket);
    u1Socket = await openLiveSocket(browser, u1, config);
    u2Socket = await openLiveSocket(browser, u2, config);
    const chatMessage = await safeJson<{ id?: unknown }>(
      await actorRequest(u1, config, "/chat", {
        method: "POST",
        data: { receiver_id: u2.userId, content: `Synthetic realtime message ${mutationRunId}` },
        expected: 200,
      }),
      "send realtime chat message",
    );
    safeInvariant(typeof chatMessage.id === "number", "chat message has no id");
    const messageId = chatMessage.id;
    await Promise.all([
      waitForSocketEvent(u1Socket, "message:new", messageId),
      waitForSocketEvent(u2Socket, "message:new", messageId),
    ]);
    const readResult = await safeJson<{ updated?: unknown; message_ids?: unknown }>(
      await actorRequest(u2, config, `/chat/${u1.userId}/read`, {
        method: "POST",
        expected: 200,
      }),
      "mark chat read",
    );
    safeInvariant(typeof readResult.updated === "number" && readResult.updated >= 1, "chat read updated no messages");
    safeInvariant(
      Array.isArray(readResult.message_ids) && readResult.message_ids.includes(messageId),
      "chat read result omitted the new message",
    );
    await waitForSocketEvent(u1Socket, "messages:read", messageId);

    console.info("[phase4-live] session ownership, revocation and WebSocket close");
    const u2Second = await loginActor("u2-b", config.u2, config, bypassCookie);
    actors.push(u2Second);
    safeInvariant(u2Second.sessionId !== u2.sessionId, "second u2 login reused the first session id");
    const sessions = await safeJson<Array<{ id?: unknown; current?: unknown }>>(
      await actorRequest(u2Second, config, "/auth/sessions", { expected: 200 }),
      "u2 session list",
    );
    safeInvariant(sessions.some((session) => session.id === u2.sessionId), "u2 first session is absent");
    safeInvariant(
      sessions.some((session) => session.id === u2Second.sessionId && session.current === true),
      "u2 second session is not marked current",
    );
    await actorRequest(u1, config, `/auth/sessions/${u2.sessionId}`, {
      method: "DELETE",
      expected: 404,
    });
    await actorRequest(u2Second, config, `/auth/sessions/${u2.sessionId}`, {
      method: "DELETE",
      expected: 204,
    });
    await actorRequest(u2, config, "/users/me", { expected: 401 });
    await actorRequest(u2Second, config, "/users/me", { expected: 200 });
    await expectSocketRevoked(u2Socket);
    await closeLiveSocket(u2Socket);
    u2Socket = undefined;

    console.info("[phase4-live] refresh-token replay rejection");
    const replayApi = await playwrightRequest.newContext({
      baseURL: config.previewOrigin,
      userAgent: USER_AGENT,
      storageState: { cookies: [bypassCookie, oldU1RefreshCookie], origins: [] },
    });
    try {
      const replayResponse = await replayApi.post("/api/backend/auth/refresh", {
        headers: mutationHeaders(config.previewOrigin),
      });
      assertStatus(replayResponse, 401, "old refresh-token replay");
    } finally {
      await replayApi.dispose();
    }
    await actorRequest(u1, config, "/users/me", { expected: 401 });

    console.info("[phase4-live] completed; external exact-email cleanup is still required");
  } finally {
    await closeLiveSocket(u1Socket);
    await closeLiveSocket(u2Socket);
    for (const actor of actors.reverse()) {
      await actor.api.dispose();
    }
    bypassCookie = undefined;
  }
});
