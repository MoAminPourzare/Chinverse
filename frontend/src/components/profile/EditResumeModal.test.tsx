import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EditResumeModal from "./EditResumeModal";

const mocks = vi.hoisted(() => ({ updateProfile: vi.fn() }));

vi.mock("@/services/user.service", () => ({ userService: { updateProfile: mocks.updateProfile } }));

beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
        observe() {}
        unobserve() {}
        disconnect() {}
    });
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    mocks.updateProfile.mockReset();
});

it("saves values selected from the resume menus in the existing resume format", async () => {
    mocks.updateProfile.mockResolvedValue({});
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(<EditResumeModal isOpen onClose={vi.fn()} user={null} onUpdate={onUpdate} initialSection="work" />);
    await user.click(screen.getByRole("button", { name: "سوابق کاریتو اضافه کن" }));
    await user.type(screen.getByRole("textbox", { name: "نام شرکت، سابقه 1" }), "نمونه");
    await user.type(screen.getByRole("textbox", { name: "عنوان شغلی، سابقه 1" }), "مترجم");

    await user.click(screen.getByRole("button", { name: /سال شروع/ }));
    await user.click(screen.getByRole("option", { name: "1399" }));
    await user.click(screen.getByRole("button", { name: /سال پایان/ }));
    await user.click(screen.getByRole("option", { name: "1401" }));
    await user.click(screen.getByRole("button", { name: "ذخیره کردن" }));

    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({
        resume: expect.objectContaining({
            work_experiences: [{ company: "نمونه", job_title: "مترجم", start_date: "1399", end_date: "1401" }],
        }),
    }));
    expect(onUpdate).toHaveBeenCalledOnce();
});
