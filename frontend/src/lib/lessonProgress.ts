/** Local feedback for acknowledged viewing time. Unlocking always comes from /learning-path. */
export const LESSON_PROGRESS_EVENT = "chinverse-learning-progress";
export interface LessonProgressSnapshot {
    watchedSeconds: number;
    positionSeconds: number;
    durationSeconds: number;
}
const key = (userId: number, lessonId: number) => `chinverse.lesson-progress.${userId}.${lessonId}`;

export function readLessonProgress(userId: number, lessonId: number): LessonProgressSnapshot {
    const empty = { watchedSeconds: 0, positionSeconds: 0, durationSeconds: 0 };
    try {
        const value = JSON.parse(localStorage.getItem(key(userId, lessonId)) || "null");
        if (!value || ![value.watchedSeconds, value.positionSeconds, value.durationSeconds].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0)) return empty;
        return value;
    } catch { return empty; }
}

export function acknowledgeLessonProgress(userId: number, lessonId: number, delta: number, position: number, duration: number) {
    const previous = readLessonProgress(userId, lessonId);
    const snapshot = {
        watchedSeconds: previous.watchedSeconds + delta,
        positionSeconds: Math.max(previous.positionSeconds, position),
        durationSeconds: duration || previous.durationSeconds,
    };
    try { localStorage.setItem(key(userId, lessonId), JSON.stringify(snapshot)); } catch { /* Private browsing must not interrupt saving. */ }
    // Also dispatch after the player unmounts: the profile may already be open.
    window.dispatchEvent(new CustomEvent(LESSON_PROGRESS_EVENT, { detail: { userId, lessonId } }));
    return snapshot;
}

export function lessonProgressPercent(snapshot: LessonProgressSnapshot) {
    if (snapshot.durationSeconds <= 0) return 0;
    return Math.min(99, Math.floor(Math.min(snapshot.watchedSeconds, snapshot.positionSeconds) / snapshot.durationSeconds * 100));
}
