import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import LearningRoadmap from "./LearningRoadmap";
import { acknowledgeLessonProgress } from "@/lib/lessonProgress";

const fetchPath = vi.hoisted(() => vi.fn());
const fetchCatalog = vi.hoisted(() => vi.fn());
vi.mock("@/lib/learningPath", async importOriginal => ({ ...await importOriginal<object>(), fetchLearningPath: fetchPath, fetchLearningPathCatalog: fetchCatalog }));
vi.mock("@/components/ui/PublicMediaImage", () => ({ default: () => null }));
const path = (complete = false) => ({ steps: [
    { lesson_id: 1, course_id: 9, course_title: "دوره", domain: "hsk", title: "شروع سفر", summary: "", duration_minutes: 1, cover_url: null, kind: "lesson", state: complete ? "completed" : "current" },
    { lesson_id: 2, course_id: 9, course_title: "دوره", domain: "hsk", title: "مرحلهٔ دوم", summary: "", duration_minutes: 1, cover_url: null, kind: "lesson", state: complete ? "current" : "locked" },
], completed_count: complete ? 1 : 0, total_count: 2, next_lesson_id: complete ? 2 : 1 });

beforeEach(() => {
    localStorage.clear(); fetchPath.mockReset().mockResolvedValue(path());
    fetchCatalog.mockReset().mockResolvedValue([{ id: 9, title: "HSK 1", slug: "hsk-1", subcategory_slug: "hsk", sections: [{ lessons: [
        { id: 1, metadata_json: { lesson_index: 1 } }, { id: 2, metadata_json: { lesson_index: 2 } },
    ] }] }]);
});
afterEach(cleanup);

it("shows acknowledged partial watching without unlocking the following lesson", async () => {
    acknowledgeLessonProgress(7, 1, 30, 30, 60);
    render(<LearningRoadmap userId={7} />);
    await screen.findByText("۵۰٪ تماشا شده · ادامهٔ درس");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByRole("link", { name: "مرحلهٔ ۲: مرحلهٔ دوم" })).not.toBeInTheDocument();
});

it("refreshes an already mounted profile when a former player's save is acknowledged", async () => {
    render(<LearningRoadmap userId={7} />);
    await screen.findByRole("link", { name: "مرحلهٔ ۱: شروع سفر" });
    fetchPath.mockResolvedValue(path(true));
    await act(async () => { acknowledgeLessonProgress(7, 1, 55, 55, 60); });
    await screen.findByRole("link", { name: "مرحلهٔ ۲: مرحلهٔ دوم" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
});

it("does not overwrite a fresh save response with an earlier slow request", async () => {
    let resolve!: (value: ReturnType<typeof path>) => void;
    fetchPath.mockImplementationOnce(() => new Promise(value => { resolve = value; }));
    render(<LearningRoadmap userId={7} />);
    await waitFor(() => expect(fetchPath).toHaveBeenCalledTimes(1));
    fetchPath.mockResolvedValue(path(true));
    await act(async () => { acknowledgeLessonProgress(7, 1, 55, 55, 60); });
    await screen.findByRole("link", { name: "مرحلهٔ ۲: مرحلهٔ دوم" });
    await act(async () => resolve(path()));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
});

it("keeps future syllabus cards locked after all available videos are complete", async () => {
    const result = path(true);
    result.steps = [result.steps[0]];
    result.total_count = 1;
    fetchPath.mockResolvedValue(result);
    render(<LearningRoadmap userId={7} />);
    await screen.findByText("۱۴ مرحله در حال آماده‌سازی است.");
    expect(screen.getAllByLabelText(/قفل است/)).toHaveLength(14);
    expect(screen.queryByRole("link", { name: /درس ۲/ })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "15");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
});
