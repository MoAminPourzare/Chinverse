import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/api", () => ({ default: { get: mocks.get } }));
vi.mock("@/components/ui/PublicMediaImage", () => ({
    default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));
vi.mock("@/components/daily/DailyPracticeContent", () => ({ default: () => <span>روند یادگیری آزمایشی</span> }));

describe("home activities feed", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("shows the empty state only after a successful empty response", async () => {
        mocks.get.mockResolvedValue({ data: [] });

        render(<HomePage />);

        expect(await screen.findByText("هنوز فعالیتی ثبت نشده")).toBeInTheDocument();
        expect(screen.queryByText("فعالیت‌ها دریافت نشد")).not.toBeInTheDocument();
        expect(mocks.get).toHaveBeenCalledWith("/feed");
    });

    it("shows a retryable error instead of an empty feed, then recovers", async () => {
        mocks.get.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: [] });

        render(<HomePage />);

        expect(await screen.findByText("فعالیت‌ها دریافت نشد")).toBeInTheDocument();
        expect(screen.queryByText("هنوز فعالیتی ثبت نشده")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));

        await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByText("هنوز فعالیتی ثبت نشده")).toBeInTheDocument();
        expect(screen.queryByText("فعالیت‌ها دریافت نشد")).not.toBeInTheDocument();
    });
});
