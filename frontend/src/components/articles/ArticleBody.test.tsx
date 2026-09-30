import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { ArticleDocument } from "@/lib/articles";
import { articleHref, articleMediaUrl } from "@/lib/articles";
import { ArticleBody } from "./ArticleBody";

afterEach(cleanup);

it("renders headings, emphasis, quotations and lists without interpreting markup", () => {
    const document: ArticleDocument = { version: 1, category: "یادگیری", blocks: [
        { type: "heading", text: "بخش اول", level: 2 },
        { type: "paragraph", spans: [{ text: "<script>alert(1)</script>", bold: false }, { text: "تأکید", bold: true }] },
        { type: "quote", spans: [{ text: "شروع کوچک", bold: false }] },
        { type: "list", ordered: true, items: ["یک", "دو"] },
    ] };
    const { container } = render(<ArticleBody document={document} content="fallback" />);
    expect(screen.getByRole("heading", { name: "بخش اول", level: 2 })).toHaveAttribute("id", "section-0");
    expect(screen.getByText("تأکید").tagName).toBe("STRONG");
    expect(screen.getByText("شروع کوچک").closest("blockquote")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
});

it("keeps older plain-text articles readable and keeps their numeric links", () => {
    render(<ArticleBody content={"متن قدیمی\nبخش دوم"} />);
    expect(screen.getByText("متن قدیمی بخش دوم")).toHaveClass("whitespace-pre-wrap");
    expect(articleHref({ id: 12 })).toBe("/articles/12");
    expect(articleHref({ id: 12, slug: "example-article" })).toBe("/articles/example-article");
    expect(articleMediaUrl("/assets/chinverse/articles/example-article/cover.png")).toBe("/assets/chinverse/articles/example-article/cover.png");
});
