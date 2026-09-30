import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/components/layout/BottomNav", () => ({ default: () => <nav aria-label="ناوبری اصلی" /> }));
vi.mock("@/components/layout/RouteTransition", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/pwa/PwaProvider", () => ({ PwaProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/layout/ThemeController", () => ({ default: () => null }));
vi.mock("@/components/layout/MobileUxController", () => ({ default: () => null }));
vi.mock("@/components/notifications/NotificationToaster", () => ({ default: () => null }));

const scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
});
afterAll(() => {
    if (scrollToDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollTo", scrollToDescriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});
afterEach(cleanup);

it.each([
    ["/", false],
    ["/profile", false],
    ["/leitner", false],
    ["/explore/pronunciation", false],
    ["/pronunciation/1", false],
    ["/showcase", false],
    ["/community", false],
    ["/settings", false],
    ["/support", false],
    ["/chatty", false],
    ["/chat", true],
    ["/chat/42", true],
])("limits the support shortcut to messages at %s", (pathname, visible) => {
    route.pathname = pathname;
    render(<AppShell releaseSha="test-release"><main>محتوا</main></AppShell>);
    const support = screen.queryByRole("link", { name: "پشتیبانی" });
    if (visible) expect(support).toHaveAttribute("href", "/support");
    else expect(support).not.toBeInTheDocument();
});
