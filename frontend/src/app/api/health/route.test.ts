import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

it.each([
    { provider: "abc1234", github: "def5678", manual: "789abcd", expected: "abc1234" },
    { provider: "", github: "def5678", manual: "789abcd", expected: "def5678" },
    { provider: "", github: "", manual: "789abcd", expected: "789abcd" },
    { provider: "", github: "", manual: "", expected: "local" },
])("reports the actual release when CLI deployments leave Git metadata empty: $expected", async ({ provider, github, manual, expected }) => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", provider);
    vi.stubEnv("GITHUB_SHA", github);
    vi.stubEnv("NEXT_PUBLIC_RELEASE_SHA", manual);
    const response = GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ status: "ok", release: expected });
});
