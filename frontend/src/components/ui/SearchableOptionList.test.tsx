import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SearchableOptionList from "./SearchableOptionList";
import { COUNTRY_REGION_OPTIONS, PROFILE_HEADLINE_OPTIONS, isKnownProfileHeadline } from "@/profileOptions";

afterEach(cleanup);

describe("searchable profile choices", () => {
    it("offers all 46 titles and finds/selects a newly requested title without scrolling", () => {
        const onSelect = vi.fn();
        render(<SearchableOptionList label="عنوان شغلی" options={PROFILE_HEADLINE_OPTIONS} selectedValues={[]} onSelect={onSelect} />);
        expect(screen.getAllByRole("button")).toHaveLength(46);
        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "مطالعات چين" } });
        expect(screen.getAllByRole("button")).toHaveLength(1);
        fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
        expect(onSelect).toHaveBeenCalledWith("کارشناس مطالعات چین");
    });

    it("normalizes Persian/Arabic characters and spacing, then restores all choices when cleared", () => {
        render(<SearchableOptionList label="شغل" options={PROFILE_HEADLINE_OPTIONS} selectedValues={["مدرس تای‌چی / چی‌گونگ"]} onSelect={vi.fn()} />);
        const input = screen.getByRole("searchbox");
        fireEvent.change(input, { target: { value: "تايچي" } });
        expect(screen.getByRole("button", { name: "مدرس تای‌چی / چی‌گونگ" })).toHaveAttribute("aria-pressed", "true");
        fireEvent.change(input, { target: { value: "عنوان ناموجود" } });
        expect(screen.getByRole("status")).toHaveTextContent("گزینه‌ای پیدا نشد.");
        fireEvent.change(input, { target: { value: "" } });
        expect(screen.getAllByRole("button")).toHaveLength(46);
    });

    it("keeps multiple selected filter values when searching", () => {
        render(<SearchableOptionList label="شغل" options={PROFILE_HEADLINE_OPTIONS} selectedValues={["صراف", "مدرس HSK"]} onSelect={vi.fn()} />);
        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "hsk" } });
        expect(screen.getByRole("button", { name: "مدرس HSK" })).toHaveAttribute("aria-pressed", "true");
        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "صراف" } });
        expect(screen.getByRole("button", { name: "صراف" })).toHaveAttribute("aria-pressed", "true");
    });

    it("sorts countries by Persian name and searches a country with an Arabic kaf", () => {
        expect(COUNTRY_REGION_OPTIONS).toEqual([...COUNTRY_REGION_OPTIONS].sort((a, b) => a.localeCompare(b, "fa")));
        render(<SearchableOptionList label="کشور" options={COUNTRY_REGION_OPTIONS} selectedValues={[]} onSelect={vi.fn()} />);
        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "كانادا" } });
        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(screen.getByRole("button", { name: "کانادا" })).toBeInTheDocument();
    });

    it("preserves previously saved titles when another profile field is edited", () => {
        expect(isKnownProfileHeadline("مترجم زبان چینی")).toBe(true);
        expect(isKnownProfileHeadline("کارشناس مطالعات چین")).toBe(true);
        expect(isKnownProfileHeadline("عنوان نامعتبر")).toBe(false);
    });
});
