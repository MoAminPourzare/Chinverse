import { describe, expect, it } from "vitest";
import {
    findActivePlaybackCueIndex,
    millisecondsUntilPlaybackRefresh,
    normalizeLessonPlayback,
    normalizePlaybackCues,
    resolveSignedMediaUrl,
    resolvePublicImageUrl,
    selectInitialSubtitleTrack,
} from "./lessonPlayback";

const signedUrl = (mediaId: number, lessonId: number) =>
    `/api/v1/media/assets/${mediaId}/content?lesson_id=${lessonId}&subject_id=11&expires=1914537600&signature=${"a".repeat(43)}`;

describe("lesson playback contract", () => {
    it("normalizes the signed playback response and keeps only published valid tracks", () => {
        const playback = normalizeLessonPlayback({
            lesson: { id: 9, course_id: 3, title: "Lesson", duration_seconds: "60" },
            media: {
                id: 4,
                playback_url: signedUrl(4, 9),
                playback_type: "hls",
                poster_url: "/api/v1/media/public-images/8",
                expires_at: "2030-01-01T00:00:00Z",
            },
            entitlement: { required: true, granted: true },
            subtitles: [
                {
                    id: 2,
                    language: "fa-IR",
                    format: "json",
                    version: 3,
                    status: "published",
                    quality_status: "valid",
                    quality_score: 98,
                    quality_report: { warnings: ["cue_1_missing_pinyin"] },
                    cues: [{
                        id: 7,
                        start: 1,
                        end: 3,
                        zh_text: "你好",
                        pinyin: "nǐ hǎo",
                        target_text: "سلام",
                        highlighted_words: ["你好", "你好", ""],
                    }],
                },
                {
                    id: 3,
                    language: "en",
                    status: "draft",
                    quality_status: "valid",
                    cues: [{ id: 1, start: 0, end: 1, target_text: "hidden" }],
                },
            ],
        });

        expect(playback.media.playbackType).toBe("hls");
        expect(playback.media.posterUrl).toBe("/api/backend/media/public-images/8");
        expect(playback.media.playbackUrl).toBe(signedUrl(4, 9).replace("/api/v1/", "/api/backend/"));
        expect(playback.lesson.durationSeconds).toBe(60);
        expect(playback.subtitles).toHaveLength(1);
        expect(playback.subtitles[0].cues[0]).toMatchObject({
            chinese: "你好",
            translation: "سلام",
            highlightedWords: ["你好"],
        });
        expect(playback.subtitles[0]).toMatchObject({ qualityScore: 98, qualityWarnings: ["cue_1_missing_pinyin"] });
    });

    it("rejects incomplete media responses instead of falling back to a public URL", () => {
        expect(() => normalizeLessonPlayback({
            lesson: { id: 1, course_id: 2 },
            media: { id: 4, playback_url: "", playback_type: "mp4", expires_at: "2030-01-01T00:00:00Z" },
        })).toThrow("missing required");
    });

    it("drops malformed and duplicate cues while preserving deterministic overlap order", () => {
        const cues = normalizePlaybackCues([
            { id: 2, start: 3, end: 5, target_text: "second" },
            { id: 1, start: 1, end: 4, target_text: "first" },
            { id: 4, start: 1, end: 4, target_text: "first" },
            { id: 5, start: 6, end: 5, target_text: "invalid" },
        ]);

        expect(cues.map((cue) => cue.id)).toEqual([1, 2]);
        expect(findActivePlaybackCueIndex(cues, 3.5)).toBe(1);
        expect(findActivePlaybackCueIndex(cues, 5.5)).toBe(-1);
    });

    it("chooses a preferred language and calculates signed URL refresh time", () => {
        const playback = normalizeLessonPlayback({
            lesson: { id: 1, course_id: 2 },
            media: { id: 3, playback_url: signedUrl(3, 1), playback_type: "mp4", expires_at: "2030-01-01T00:00:00Z" },
            entitlement: { granted: true },
            subtitles: [
                { id: 1, language: "en", status: "published", quality_status: "valid", cues: [{ start: 0, end: 1, target_text: "Hi" }] },
                { id: 2, language: "fa-IR", status: "published", quality_status: "valid", cues: [{ start: 0, end: 1, target_text: "سلام" }] },
            ],
        });

        expect(selectInitialSubtitleTrack(playback.subtitles, "fa")?.language).toBe("fa-ir");
        expect(millisecondsUntilPlaybackRefresh("2026-08-11T00:01:00.000Z", Date.parse("2026-08-11T00:00:00.000Z")))
            .toBe(30_000);
        expect(millisecondsUntilPlaybackRefresh("invalid")).toBeNull();
    });

    it("maps only application-signed media URLs to the streaming BFF", () => {
        expect(resolveSignedMediaUrl(signedUrl(7, 5), { mediaId: 7, lessonId: 5 }))
            .toBe(signedUrl(7, 5).replace("/api/v1/", "/api/backend/"));
        expect(resolveSignedMediaUrl(signedUrl(7, 5).replace("/api/v1/", "/api/backend/")))
            .toBe(signedUrl(7, 5).replace("/api/v1/", "/api/backend/"));
        expect(() => resolveSignedMediaUrl("https://provider.example/video.mp4?token=secret"))
            .toThrow("application-signed");
        expect(() => resolveSignedMediaUrl(signedUrl(7, 5), { mediaId: 8, lessonId: 5 }))
            .toThrow("does not match the media");
    });

    it("maps only stable application image URLs to the same-origin BFF", () => {
        expect(resolvePublicImageUrl("/api/v1/media/public-images/8"))
            .toBe("/api/backend/media/public-images/8");
        expect(() => resolvePublicImageUrl("https://provider.example/poster.jpg"))
            .toThrow("application media URL");
    });

    it("keeps only valid published subtitle revisions", () => {
        const playback = normalizeLessonPlayback({
            lesson: { id: 1, course_id: 2 },
            media: { id: 3, playback_url: signedUrl(3, 1), playback_type: "mp4", expires_at: "2030-01-01T00:00:00Z" },
            entitlement: { granted: true },
            subtitles: [
                { id: 1, language: "fa", version: 1, status: "published", quality_status: "invalid", cues: [{ start: 0, end: 1, target_text: "bad" }] },
                { id: 2, language: "fa", version: 2, status: "published", quality_status: "valid", cues: [{ start: 0, end: 1, target_text: "old" }] },
                { id: 3, language: "fa", version: 3, status: "published", quality_status: "valid", cues: [{ start: 0, end: 1, target_text: "new" }] },
            ],
        });

        expect(playback.subtitles).toHaveLength(1);
        expect(playback.subtitles[0]).toMatchObject({ id: 3, version: 3 });
    });
});
