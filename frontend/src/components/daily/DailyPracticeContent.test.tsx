import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DailyPracticeContent from "@/components/daily/DailyPracticeContent";

const mocks = vi.hoisted(() => ({ getSummary: vi.fn() }));

vi.mock("@/services/dailyActivity.service", () => ({
    dailyActivityService: { getSummary: mocks.getSummary },
}));

const apiFailure = (status: number) => Object.assign(new Error("request failed"), {
    isAxiosError: true,
    response: { status },
});

describe("daily practice access and failures", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("guides a guest to login when the personal summary returns 401", async () => {
        mocks.getSummary.mockRejectedValue(apiFailure(401));

        render(<DailyPracticeContent />);

        expect(await screen.findByText("برای دیدن روند یادگیری وارد حساب شو")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "ورود به حساب" })).toHaveAttribute("href", "/login?next=%2F%3Ftab%3Ddaily");
        expect(screen.queryByText("آمار باز نشد")).not.toBeInTheDocument();
        expect(mocks.getSummary).toHaveBeenCalledWith(370);
    });

    it("keeps a retryable loading error separate from the guest state", async () => {
        mocks.getSummary.mockRejectedValueOnce(apiFailure(503)).mockRejectedValueOnce(apiFailure(401));

        render(<DailyPracticeContent />);

        expect(await screen.findByText("آمار باز نشد")).toBeInTheDocument();
        expect(screen.queryByText("برای دیدن روند یادگیری وارد حساب شو")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));

        await waitFor(() => expect(mocks.getSummary).toHaveBeenCalledTimes(2));
        expect(await screen.findByText("برای دیدن روند یادگیری وارد حساب شو")).toBeInTheDocument();
        expect(screen.queryByText("آمار باز نشد")).not.toBeInTheDocument();
    });
});
