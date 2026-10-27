import api from "@/lib/api";
import type { Course } from "@/lib/courses";

export interface LearningPathStep {
    lesson_id: number;
    course_id: number;
    course_title: string;
    domain: string;
    title: string;
    summary: string;
    duration_minutes: number;
    cover_url: string | null;
    kind: "lesson" | "explore";
    state: "completed" | "current" | "locked";
}

export interface LearningPath {
    steps: LearningPathStep[];
    completed_count: number;
    total_count: number;
    next_lesson_id: number | null;
}

export async function fetchLearningPath(signal?: AbortSignal): Promise<LearningPath> {
    const response = await api.get<LearningPath>("/learning-path", { signal, chinverseCacheTtlMs: 0 });
    if (!response.data || !Array.isArray(response.data.steps) || !Number.isFinite(response.data.total_count)) {
        throw new Error("Invalid learning path response");
    }
    return response.data;
}

export function learningPathLessonHref(step: LearningPathStep) {
    const query = new URLSearchParams({ lesson: String(step.lesson_id), roadmap: "1", returnTo: "/profile" });
    return `/watch/${encodeURIComponent(step.domain)}/${step.course_id}?${query}`;
}

/** Public curriculum metadata only; publication/access still comes from the path. */
export async function fetchLearningPathCatalog(signal?: AbortSignal): Promise<Course[]> {
    const response = await api.get<Course[]>("/courses/", {
        params: { subcategory_slug: "hsk", limit: 1000 }, signal, chinverseCacheTtlMs: 0,
    });
    return Array.isArray(response.data) ? response.data : [];
}
