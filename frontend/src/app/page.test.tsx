import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const mocks = vi.hoisted(() => ({ get: vi.fn(), search: "" }));

vi.mock("@/lib/api", () => ({ default: { get: mocks.get } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(mocks.search) }));
vi.mock("@/components/ui/PublicMediaImage", () => ({
    default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));
vi.mock("@/components/daily/DailyPracticeContent", () => ({ default: () => <span>روند یادگیری آزمایشی</span> }));
vi.mock("@/components/engagement/LikeButton", () => ({ default: () => <button>لایک آزمایشی</button> }));
vi.mock("@/components/engagement/PostViewerModal", () => ({ default: () => <div role="dialog">پست باز شد</div> }));
vi.mock("@/components/engagement/PostCommentsSheet", () => ({ default: () => <div role="dialog">دیدگاه‌های پست</div> }));

const provider = { id: 9, display_name: "عرفان", headline: "مدرس زبان چینی" };
const service = { id: "service_41", type: "service", provider, data: { id: 41, title: "آموزش چینی", description: "کلاس زبان چینی", price_label: "جلسه‌ای" } };
const post = { id: "gallery_42", type: "gallery", provider, data: { id: 42, image_url: "/uploads/gallery/post.jpg", caption: "یادگیری زبان چینی" } };

describe("home activities feed", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.search = "";
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
        expect(mocks.get).toHaveBeenCalledWith("/feed", expect.objectContaining({ params: { limit: 20, skip: 0 }, chinverseCacheTtlMs: 0 }));
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

    it("renders real posts and services with author, details, price and post viewer", async () => {
        mocks.get.mockResolvedValue({ data: [service, post] });
        render(<HomePage />);
        expect(await screen.findByRole("heading", { name: "آموزش چینی" })).toBeInTheDocument();
        expect(screen.getByText("جلسه‌ای")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "مشاهدهٔ خدمت" })).toHaveAttribute("href", "/services/41");
        expect(screen.getAllByRole("link", { name: "پروفایل عرفان" })[0]).toHaveAttribute("href", "/users/9");
        fireEvent.click(screen.getByRole("button", { name: "دیدگاه‌های پست" }));
        expect(screen.getByRole("dialog")).toHaveTextContent("دیدگاه‌های پست");
        expect(screen.queryByText("پست باز شد")).not.toBeInTheDocument();
    });

    it("filters on the server and ignores a response from the previous filter", async () => {
        let resolveOld!: (value: unknown) => void;
        mocks.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
            .mockResolvedValueOnce({ data: [service] });
        render(<HomePage />);
        fireEvent.click(screen.getByRole("button", { name: "خدمات" }));
        expect(await screen.findByRole("heading", { name: "آموزش چینی" })).toBeInTheDocument();
        await waitFor(() => expect(mocks.get).toHaveBeenLastCalledWith("/feed", expect.objectContaining({ params: { limit: 20, skip: 0, kind: "service" } })));
        resolveOld({ data: [post] });
        await waitFor(() => expect(screen.queryByText("یادگیری زبان چینی")).not.toBeInTheDocument());
    });

    it("keeps the first page after a load-more error and retries the same page", async () => {
        const firstPage = Array.from({ length: 20 }, (_, i) => ({ ...service, id: `service_${i}`, data: { ...service.data, id: i } }));
        mocks.get.mockResolvedValueOnce({ data: firstPage }).mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValueOnce({ data: [post] });
        render(<HomePage />);
        fireEvent.click(await screen.findByRole("button", { name: "نمایش بیشتر" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("فعالیت‌ها دریافت نشد");
        expect(screen.getAllByRole("heading", { name: "آموزش چینی" })).toHaveLength(20);
        fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
        expect(await screen.findByText("یادگیری زبان چینی")).toBeInTheDocument();
        expect(mocks.get).toHaveBeenLastCalledWith("/feed", expect.objectContaining({ params: { limit: 20, skip: 20 } }));
    });

    it("refreshes the first page without using the GET cache", async () => {
        mocks.get.mockResolvedValueOnce({ data: [service] }).mockResolvedValueOnce({ data: [post] });
        render(<HomePage />);
        await screen.findByRole("heading", { name: "آموزش چینی" });
        fireEvent.click(screen.getByRole("button", { name: "تازه‌سازی" }));
        expect(await screen.findByText("یادگیری زبان چینی")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "آموزش چینی" })).not.toBeInTheDocument();
        expect(mocks.get).toHaveBeenLastCalledWith("/feed", expect.objectContaining({ params: { limit: 20, skip: 0 }, chinverseCacheTtlMs: 0 }));
    });

    it("preserves the learning-tab deep link without fetching an unseen activity feed", () => {
        mocks.search = "tab=daily";
        render(<HomePage />);
        expect(screen.getByText("روند یادگیری آزمایشی")).toBeInTheDocument();
        expect(mocks.get).not.toHaveBeenCalled();
    });
});
