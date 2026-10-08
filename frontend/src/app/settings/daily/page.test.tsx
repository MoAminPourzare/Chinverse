import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DailyGoalSettingsPage from "./page";
import { getStoredLearningPreferences } from "@/lib/learningPreferences";

vi.mock("@/components/ui/IconButton", () => ({ AppHeader: () => <h1>هدف روزانه</h1> }));
vi.mock("next/image", () => ({ default: () => null }));
afterEach(cleanup);

describe("daily study goal", () => {
    it("selects each ten-minute marker, stores the goal and exposes only the active quote", async () => {
        render(<DailyGoalSettingsPage />);
        const slider = screen.getByRole("slider", { name: "زمان مطالعه روزانه" });
        for (const value of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
            fireEvent.click(screen.getByRole("button", { name: `${value} دقیقه` }));
            await waitFor(() => expect(slider).toHaveValue(String(value)));
            expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(value);
            expect(screen.getAllByText(/هدف مطالعه:/).filter((node) => !node.closest('[aria-hidden="true"]'))).toHaveLength(1);
        }
    });

    it("allows a single-minute goal on the slider and a custom goal above 100", async () => {
        render(<DailyGoalSettingsPage />);
        const slider = screen.getByRole("slider", { name: "زمان مطالعه روزانه" });
        expect(slider).toHaveAttribute("step", "1");
        fireEvent.change(slider, { target: { value: "27" } });
        await waitFor(() => expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(27));
        fireEvent.change(screen.getByLabelText("سایر دقایق"), { target: { value: "255" } });
        fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
        await waitFor(() => expect(getStoredLearningPreferences().dailyGoalMinutes).toBe(255));
        expect(slider).toHaveValue("100");
        expect(screen.getByText("۲۵۵ دقیقه")).toBeInTheDocument();
    });
});
