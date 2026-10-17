import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BackButton } from "@/components/ui/IconButton";
import ReturnAwareLink from "@/components/ui/ReturnAwareLink";

const route = vi.hoisted(() => ({ pathname: "/settings/daily", search: "returnTo=%2F%3Ftab%3Ddaily" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useSearchParams: () => new URLSearchParams(route.search) }));
beforeEach(() => { route.pathname = "/settings/daily"; route.search = "returnTo=%2F%3Ftab%3Ddaily"; });
afterEach(cleanup);

it("uses the current router query when the browser URL still belongs to the previous page", () => {
    window.history.replaceState({}, "", "/older-page");
    const { rerender } = render(<BackButton href="/settings" />);
    expect(screen.getByRole("link", { name: "بازگشت" })).toHaveAttribute("href", "/?tab=daily");
    route.search = "returnTo=%2Fexplore%3FreturnTo%3D%252F%253Ftab%253Ddaily";
    rerender(<BackButton href="/settings" />);
    expect(screen.getByRole("link", { name: "بازگشت" })).toHaveAttribute("href", "/explore?returnTo=%2F%3Ftab%3Ddaily");
});

it("advances a video using its router parent rather than stale browser history", () => {
    route.pathname = "/watch/pronunciation/7";
    route.search = "lesson=21&returnTo=%2Fpronunciation%2F7%3FreturnTo%3D%252F%253Ftab%253Ddaily";
    window.history.replaceState({}, "", "/older-page");
    render(<ReturnAwareLink href="/watch/pronunciation/7?lesson=22">درس بعدی</ReturnAwareLink>);
    const href = screen.getByRole("link", { name: "درس بعدی" }).getAttribute("href")!;
    const url = new URL(href, "https://chinverse.invalid");
    expect(url.searchParams.get("lesson")).toBe("22");
    expect(url.searchParams.get("returnTo")).toBe("/pronunciation/7?returnTo=%2F%3Ftab%3Ddaily");
});
