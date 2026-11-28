import api, { clearApiCache } from "@/lib/api";
import {
    normalizeLessonPlayback,
    type LessonPlayback,
    type RawLessonPlayback,
} from "@/lib/lessonPlayback";

export interface FetchLessonPlaybackOptions {
    forceRefresh?: boolean;
    signal?: AbortSignal;
    learningPath?: boolean;
}

export const lessonPlaybackService = {
    async fetch(
        lessonId: number,
        { forceRefresh = false, signal, learningPath = false }: FetchLessonPlaybackOptions = {},
    ): Promise<LessonPlayback> {
        if (!Number.isSafeInteger(lessonId) || lessonId <= 0) {
            throw new Error("A positive lesson ID is required for playback");
        }
        if (forceRefresh) clearApiCache();

        const response = await api.get<RawLessonPlayback>(
            `/courses/lessons/${lessonId}/playback`,
            {
                signal,
                params: learningPath ? { learning_path: true } : undefined,
                headers: { "Cache-Control": "no-store" },
            },
        );
        return normalizeLessonPlayback(response.data);
    },
};
