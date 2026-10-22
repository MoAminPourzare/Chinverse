import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LeitnerGoalSheet from "./LeitnerGoalSheet";

vi.mock("next/image", () => ({ default: () => null }));
afterEach(cleanup);

describe("Leitner daily goal", () => {
    it("shows the six requested presets and saves only after confirmation", () => {
        const onSave = vi.fn();
        render(<LeitnerGoalSheet value={5} onClose={vi.fn()} onSave={onSave} />);
        for (const name of ["۳ لغت – سبک", "۵ لغت – راحت", "۸ لغت – متعادل", "۱۰ لغت – پیشنهادی", "۱۵ لغت – جدی", "۲۰ لغت – فشرده"]) expect(screen.getByRole("radio", { name })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("radio", { name: "۱۰ لغت – پیشنهادی" }));
        expect(onSave).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "ثبت هدف" }));
        expect(onSave).toHaveBeenCalledWith(10);
    });

    it("accepts Persian custom counts, supports the stepper, and rejects zero", () => {
        const onSave = vi.fn();
        render(<LeitnerGoalSheet value={12} onClose={vi.fn()} onSave={onSave} />);
        const input = screen.getByLabelText("لغت در روز");
        expect(input).toHaveValue("12");
        fireEvent.change(input, { target: { value: "۰" } });
        expect(screen.getByRole("button", { name: "ثبت هدف" })).toBeDisabled();
        fireEvent.change(input, { target: { value: "۲۵" } });
        fireEvent.click(screen.getByRole("button", { name: "افزایش تعداد لغت" }));
        expect(input).toHaveValue("26");
        fireEvent.click(screen.getByRole("button", { name: "کاهش تعداد لغت" }));
        fireEvent.click(screen.getByRole("button", { name: "ثبت هدف" }));
        expect(onSave).toHaveBeenCalledWith(25);
    });

    it("cancels without changing the saved goal and supports radio arrow keys", () => {
        const onClose = vi.fn();
        const onSave = vi.fn();
        render(<LeitnerGoalSheet value={5} onClose={onClose} onSave={onSave} />);
        const selected = screen.getByRole("radio", { name: "۵ لغت – راحت" });
        selected.focus();
        fireEvent.keyDown(selected, { key: "ArrowRight" });
        expect(screen.getByRole("radio", { name: "۸ لغت – متعادل" })).toHaveAttribute("aria-checked", "true");
        fireEvent.click(screen.getByRole("button", { name: "بستن" }));
        expect(onClose).toHaveBeenCalledOnce();
        expect(onSave).not.toHaveBeenCalled();
    });
});
