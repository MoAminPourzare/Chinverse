import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouteTransition from "./RouteTransition";

const navigation = vi.hoisted(() => ({ pathname: "/signup", search: "" }));
vi.mock("next/navigation", () => ({
    usePathname: () => navigation.pathname,
    useSearchParams: () => new URLSearchParams(navigation.search),
}));

function DraftForm({ caption }: { caption: string }) {
    const [draft, setDraft] = useState("");
    return (
        <>
            <label>Draft<input value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
            <p>{caption}</p>
        </>
    );
}

describe("RouteTransition state preservation", () => {
    afterEach(cleanup);
    beforeEach(() => {
        navigation.pathname = "/signup";
        navigation.search = "";
    });

    it("keeps drafts and updates content when only query parameters change", () => {
        const { rerender } = render(<RouteTransition><DraftForm caption="Registration" /></RouteTransition>);
        fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Unsubmitted draft" } });
        navigation.search = "legal=terms";
        rerender(<RouteTransition><DraftForm caption="Reading terms" /></RouteTransition>);
        expect(screen.getByLabelText("Draft")).toHaveValue("Unsubmitted draft");
        expect(screen.getByText("Reading terms")).toBeInTheDocument();
        navigation.search = "";
        rerender(<RouteTransition><DraftForm caption="Registration" /></RouteTransition>);
        expect(screen.getByLabelText("Draft")).toHaveValue("Unsubmitted draft");
    });

    it("starts a fresh form when navigating to a different page", () => {
        const { rerender } = render(<RouteTransition><DraftForm caption="Registration" /></RouteTransition>);
        fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Signup draft" } });
        navigation.pathname = "/login";
        rerender(<RouteTransition><DraftForm caption="Login" /></RouteTransition>);
        expect(screen.getByLabelText("Draft")).toHaveValue("");
        expect(screen.getByText("Login")).toBeInTheDocument();
    });
});
