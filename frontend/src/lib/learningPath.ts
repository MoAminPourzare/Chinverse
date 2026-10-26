import api from "@/lib/api";

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
