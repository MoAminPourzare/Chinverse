# Phase 4 live staging smoke

This Playwright spec is a deliberately opt-in, stateful verification of the Phase 4 contracts against the protected Vercel preview and the Hugging Face staging API:

- `phase4-live-staging.spec.ts`
- skipped unless `RUN_PHASE4_LIVE=1`
- runs once in `desktop-chromium`; the other configured projects skip it
- trace, screenshot, and video are forced off
- never logs passwords, access tokens, refresh cookies, TOTP secrets, or the Vercel bypass secret
- does not delete fixture users or perform database cleanup

## Safety contract

Use only four dedicated, verified, synthetic staging accounts. Their roles must be:

- U1: `user`
- U2: `user`
- moderator: `moderator`, without admin MFA requirements
- admin: `admin`, with MFA initially disabled (the suite enrolls and verifies it)

`CHINVERSE_PHASE4_RUN_ID` is normalized to lowercase and must match the exact backend fixture regex (`^[a-z0-9](?:[a-z0-9-]{4,38}[a-z0-9])?$`). The suite derives exactly these four addresses and accepts no email override:

- `phase4-<run-id>-user-1@example.com`
- `phase4-<run-id>-user-2@example.com`
- `phase4-<run-id>-moderator@example.com`
- `phase4-<run-id>-admin@example.com`

The spec creates and moderates forum content, creates reports, writes and closes a support ticket, writes a chat message, creates/revokes sessions, and deliberately replays an old refresh token. It prints only the four fixture email addresses and a non-secret run ID so the caller can run the separately audited, fail-closed fixture cleanup tool. Cleanup is required after both success and failure.

## Required environment

Set these values through the local shell or an approved secret manager. Do not add them to `.env`, the repository, CI logs, or the Playwright command line.

```text
RUN_PHASE4_LIVE=1
PHASE4_LIVE_PREVIEW_URL=https://<protected-preview-host>
PHASE4_LIVE_API_URL=https://<staging-api-host>/api/v1
PHASE4_LIVE_VERCEL_BYPASS_SECRET=<temporary-automation-bypass>

CHINVERSE_PHASE4_RUN_ID=<fixture-run-id>
CHINVERSE_PHASE4_USER_1_PASSWORD=<synthetic-u1-password>
CHINVERSE_PHASE4_USER_2_PASSWORD=<synthetic-u2-password>
CHINVERSE_PHASE4_MODERATOR_PASSWORD=<synthetic-moderator-password>
CHINVERSE_PHASE4_ADMIN_PASSWORD=<synthetic-admin-password>
```

These `CHINVERSE_PHASE4_*` values are shared with `backend/scripts/phase4_staging_fixtures.py`. The equivalent `PHASE4_LIVE_*_PASSWORD` values can override only the shared passwords; fixture identities cannot be overridden.

`PHASE4_LIVE_REFRESH_COOKIE_NAME` is optional and defaults to `__Host-chinverse_refresh`. No pre-existing TOTP secret is required: the admin fixture must start with MFA disabled, and the suite performs setup, confirmation, old-session revocation, and a fresh MFA login without logging the generated secret or backup codes.

For token-leak prevention, the preview host must end in `.vercel.app`, redirects are disabled on the one request carrying the bypass secret, and the WebSocket API host must equal `moamin9-chinverse-api.hf.space`. If the staging Space is intentionally renamed, set the non-secret `PHASE4_LIVE_EXPECTED_API_HOST` only after reviewing the new deployment target.

## Vercel bypass handling

Create a temporary **Protection Bypass for Automation** secret immediately before the run. The harness sends it only once, to the preview `/api/health` bootstrap request, with `x-vercel-set-bypass-cookie: true`. Vercel may answer that non-followed bootstrap with `200` or `307`; the harness then performs a second cookie-only health request and requires `200`. Every later BFF or browser request uses the resulting `_vercel_jwt` cookie; the secret is not installed as a global HTTP header and therefore cannot leak to the Hugging Face API or third-party assets.

Revoke the temporary automation bypass as soon as the test process exits, whether it passes or fails.

## Run

From `frontend`, after exporting the required environment values without echoing them:

```text
npm run test:e2e -- phase4-live-staging.spec.ts --project=desktop-chromium --retries=0 --workers=1
```

The suite verifies:

- BFF login, strict refresh-cookie metadata, rotation, old-token replay rejection
- user/moderator/admin boundaries, admin MFA setup/confirmation, old-session revocation, and MFA-protected admin access
- forum ownership, report duplicate/self-report rules, moderation claim/resolve, role hierarchy
- support-ticket ownership, admin-only queue, required reply before close
- bidirectional block enforcement and unblock
- WebSocket first-frame authentication, `connection:ready`, reconnect, `message:new`, `messages:read`, and close code `1008` after session revocation
- session ownership, second-login enumeration, cross-user revoke rejection, same-user revoke success, and stale access-token rejection

After the process exits, run `backend/scripts/phase4_staging_fixtures.py cleanup` first as a dry-run and then with `--apply --confirm-run-id <fixture-run-id>`. The tool accepts only the approved Neon staging endpoint, requires `sslmode=verify-full` and the provider's `channel_binding=require` intent, supplies its own system-CA hostname-verifying TLS context, verifies the exact four identities, rejects storage-backed or cross-user state, and confirms that exactly four synthetic users were deleted. The current asyncpg driver does not implement libpq channel binding, so the tool validates and then removes that unsupported query option; certificate and hostname verification remain enforced. Revoke the Vercel bypass secret immediately afterward.
