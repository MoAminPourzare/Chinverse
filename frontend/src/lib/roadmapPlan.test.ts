import { expect, it } from "vitest";
import { buildRoadmapPlan } from "./roadmapPlan";
import type { Course } from "./courses";
import type { LearningPath, LearningPathStep } from "./learningPath";

const step = (id: number, state: LearningPathStep["state"] = "current"): LearningPathStep => ({
    lesson_id: id, course_id: 70, course_title: "HSK 1 — نمونهٔ آزمایشی", domain: "hsk",
    title: "ویدیوی منتشرشده", summary: "", duration_minutes: 6, cover_url: null, kind: "lesson", state,
});
const course = (indices: number[]): Course => ({
    id: 70, slug: "hsk-1", title: "HSK 1", description: "", level: "beginner", subcategory_slug: "hsk",
    sections: [{ id: 1, lessons: indices.map(index => ({ id: 205 + index, metadata_json: { lesson_index: index } })) }],
});
const path = (steps: LearningPathStep[]): LearningPath => ({ steps, total_count: steps.length,
    completed_count: steps.filter(item => item.state === "completed").length,
    next_lesson_id: steps.find(item => item.state === "current")?.lesson_id || null });

it("shows the remaining fourteen real HSK 1 syllabus slots without playback identifiers", () => {
    const result = buildRoadmapPlan(path([step(206)]), [course([1])]);
    expect(result.total_count).toBe(15);
    expect(result.upcoming_count).toBe(14);
    expect(result.steps[0]).toMatchObject({ lesson_id: 206, availability: "published", state: "current" });
    expect(result.steps[1]).toMatchObject({ title: "درس ۲", summary: "谢谢你！", availability: "upcoming" });
    expect(result.steps.slice(1).every(item => item.state === "locked" && item.lesson_id === null && item.course_id === null)).toBe(true);
});

it("replaces an upcoming slot with the real published lesson without changing server lock states", () => {
    const result = buildRoadmapPlan(path([step(206, "completed"), step(207, "locked")]), [course([1, 2])]);
    expect(result.total_count).toBe(15);
    expect(result.upcoming_count).toBe(13);
    expect(result.steps[1]).toMatchObject({ lesson_id: 207, availability: "published", state: "locked" });
    expect(result.steps.some(item => item.key === "planned:hsk-1:2")).toBe(false);
    expect(result.completed_count).toBe(1);
});

it("never turns curriculum metadata alone into an available video", () => {
    const result = buildRoadmapPlan(path([step(206)]), [course([1, 2, 3])]);
    expect(result.steps.filter(item => item.availability === "published")).toHaveLength(1);
    expect(result.steps[1]).toMatchObject({ key: "planned:hsk-1:2", state: "locked", lesson_id: null });
});

it("shows an entirely locked syllabus before videos are available", () => {
    const result = buildRoadmapPlan(path([]), []);
    expect(result.steps).toHaveLength(15);
    expect(result.steps.every(item => item.availability === "upcoming" && item.state === "locked")).toBe(true);
    expect(result.completed_count).toBe(0);
});

it("continues into the next book after the last published position", () => {
    const result = buildRoadmapPlan(path([step(220, "completed")]), [course([15])]);
    expect(result.steps[1]).toMatchObject({ course_title: "HSK 2", title: "درس ۱", state: "locked" });
});

it("falls back to book milestones when no reliable lesson position is available", () => {
    const result = buildRoadmapPlan(path([step(206)]), []);
    expect(result.steps[0]).toMatchObject({ lesson_id: 206, state: "current" });
    expect(result.steps.slice(1).every(item => item.lesson_id === null && item.state === "locked")).toBe(true);
    expect(result.steps[1].title).toBe("HSK 2");
});
