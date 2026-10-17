import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import VocabularyCollocations from "./VocabularyCollocations";

const highlight = (text: string) => text;
afterEach(cleanup);

describe("VocabularyCollocations", () => {
    it("groups by meaning and numbers each phrase in order instead of repeating sense numbers", () => {
        render(<VocabularyCollocations keyword="学" highlight={highlight} definitions={[{ sense_order: 2, definition_text: "معنی دوم" }]} items={[
            { id: 4, sense_order: 2, phrase_zh: "学习", phrase_pinyin: "xuéxí", translation_target: "یادگیری" },
            { id: 3, sense_order: 1, phrase_zh: "学校" },
            { id: 2, sense_order: 2, phrase_zh: "学生" },
        ]} />);
        const groups = screen.getAllByRole("region");
        expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual(["ترکیب‌های معنی 1", "ترکیب‌های معنی 2"]);
        const phrases = within(groups[1]).getAllByRole("listitem");
        expect(phrases[0]).toHaveTextContent("1学生");
        expect(phrases[1]).toHaveTextContent("2学习");
        expect(within(groups[1]).getByText("معنی دوم")).toBeVisible();
        expect(screen.getByText("学习")).toHaveAttribute("dir", "ltr");
        expect(screen.getByText("یادگیری")).toHaveAttribute("dir", "rtl");
    });

    it("uses the first meaning for ungrouped phrases and shows plain composition without blank lines", () => {
        const { rerender } = render(<VocabularyCollocations keyword="学" highlight={highlight} items={[{ id: 1, phrase_zh: "学校" }]} definitions={[{ definition_text: "مدرسه" }]} />);
        expect(screen.getByRole("region", { name: "ترکیب‌های معنی 1" })).toHaveTextContent("مدرسه");
        rerender(<VocabularyCollocations keyword="学" highlight={highlight} items={[]} definitions={[]} composition={"\n 学习 \n\n 学生\n"} />);
        expect(screen.getByText("1. 学习")).toBeVisible();
        expect(screen.getByText("2. 学生")).toBeVisible();
        expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    it("handles missing composition and definitions with an empty state", () => {
        render(<VocabularyCollocations keyword="学" highlight={highlight} items={[]} definitions={[]} />);
        expect(screen.getByText("ترکیب واژگانی موجود نیست")).toBeVisible();
    });
});
