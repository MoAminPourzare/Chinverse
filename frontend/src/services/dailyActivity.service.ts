import api from "@/lib/api";

export interface DailyActivityDay {
    date: string;
    minutes: number;
    watched_seconds: number;
    learned_words_count: number;
    reviewed_words_count: number;
    is_active: boolean;
    intensity: number;
    minutes_ratio?: number;
    words_ratio?: number;
}

export interface DailyActivitySummary {
    today: {
        date: string;
        minutes: number;
        watched_seconds: number;
        learned_words_count: number;
        reviewed_words_count: number;
        is_active: boolean;
    };
    streak: {
        current_days: number;
        longest_days: number;
        last_active_date: string | null;
    };
    totals: {
        minutes: number;
        watched_seconds: number;
        learned_words_count: number;
        reviewed_words_count: number;
        active_days: number;
    };
    calendar: DailyActivityDay[];
    weekly_chart: DailyActivityDay[];
    learning: {
        due_flashcards: number;
        mastered_words: number;
        total_flashcards: number;
    };
}

export interface VideoProgressPayload {
    lesson_id: number;
    seconds_delta: number;
    position_seconds?: number;
    duration_seconds?: number;
}

export const dailyActivityService = {
    async getSummary(days = 370): Promise<DailyActivitySummary> {
        const response = await api.get<DailyActivitySummary>("/daily-activity/summary", {
            params: { days },
        });
        return response.data;
    },

    async recordVideoProgress(payload: VideoProgressPayload): Promise<void> {
        await api.post("/daily-activity/video-progress", payload);
    },
};
