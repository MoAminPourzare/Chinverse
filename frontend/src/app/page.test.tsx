import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HomePage from "./page";

const query = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(query.value) }));
vi.mock("@/components/ui/PublicMediaImage", () => ({ default: () => <span /> }));
vi.mock("@/components/community/CommunityForum", () => ({ default: () => <section>محتوای تالار گفتگو</section> }));
vi.mock("@/components/daily/DailyPracticeContent", () => ({ default: () => <section>محتوای روند یادگیری</section> }));
beforeEach(() => { query.value = ""; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("opens the forum on home and removes activities", () => {
    render(<HomePage />);
    expect(screen.getByText("محتوای تالار گفتگو")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تالار گفتگو" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("فعالیت‌ها")).not.toBeInTheDocument();
});

it("preserves the learning progress deep link", () => {
    query.value = "tab=daily";
    render(<HomePage />);
    expect(screen.getByText("محتوای روند یادگیری")).toBeInTheDocument();
    expect(screen.queryByText("محتوای تالار گفتگو")).not.toBeInTheDocument();
});

it("stores tab selection in the URL", () => {
    const replace = vi.spyOn(window.history, "replaceState");
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "روند یادگیری" }));
    expect(replace).toHaveBeenCalledWith(null, "", expect.stringContaining("tab=daily"));
});

it("sends the retired activities deep link to the forum", () => {
    query.value = "tab=activities";
    render(<HomePage />);
    expect(screen.getByText("محتوای تالار گفتگو")).toBeInTheDocument();
});
