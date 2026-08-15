export type PlaybackType = "hls" | "mp4";

export interface PlaybackCue {
    id: number;
    start: number;
    end: number;
    chinese: string;
    pinyin: string;
    translation: string;
    highlightedWords: string[];
}

export interface PlaybackSubtitleTrack {
    id: number;
    language: string;
    format: "json" | "srt" | "vtt";
    version: number;
    qualityScore: number | null;
    qualityWarnings: string[];
    cues: PlaybackCue[];
}

export interface LessonPlayback {
    lesson: {
        id: number;
        courseId: number;
        title: string;
        durationSeconds: number | null;
    };
    media: {
        id: number;
        playbackUrl: string;
        playbackType: PlaybackType;
        posterUrl: string | null;
        expiresAt: string | null;
    };
    entitlement: {
        required: boolean;
        granted: boolean;
        reason: string | null;
    };
    subtitles: PlaybackSubtitleTrack[];
}

export interface RawPlaybackCue {
    id?: unknown;
    start?: unknown;
    end?: unknown;
    zh_text?: unknown;
    pinyin?: unknown;
    target_text?: unknown;
    highlighted_words?: unknown;
}

export interface RawPlaybackSubtitleTrack {
    id?: unknown;
    language?: unknown;
    format?: unknown;
    version?: unknown;
    status?: unknown;
    quality_status?: unknown;
    quality_score?: unknown;
    quality_report?: unknown;
    cues?: unknown;
}

export interface RawLessonPlayback {
    lesson?: {
        id?: unknown;
        course_id?: unknown;
        title?: unknown;
        duration_seconds?: unknown;
    };
    media?: {
        id?: unknown;
        playback_url?: unknown;
        playback_type?: unknown;
        poster_url?: unknown;
        expires_at?: unknown;
    };
    entitlement?: {
        required?: unknown;
        granted?: unknown;
        reason?: unknown;
    };
    subtitles?: unknown;
}

const finiteNumber = (value: unknown): number | null => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const positiveInteger = (value: unknown, fallback: number): number => {
    const parsed = finiteNumber(value);
    return parsed !== null && parsed > 0 ? Math.floor(parsed) : fallback;
};

const textValue = (value: unknown): string => typeof value === "string" ? value.trim() : "";

const stringList = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

const SIGNED_MEDIA_PATH = /^\/api\/(?:v1|backend)\/media\/assets\/(\d+)\/content$/;
const PUBLIC_IMAGE_PATH = /^\/api\/(?:v1|backend)\/media\/public-images\/(\d+)$/;

export const resolvePublicImageUrl = (value: string): string => {
    const raw = textValue(value);
    let parsed: URL;
    try {
        parsed = new URL(raw, "https://chinverse.invalid");
    } catch {
        throw new Error("Poster URL is not valid");
    }
    const match = PUBLIC_IMAGE_PATH.exec(parsed.pathname);
    if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) <= 0 || parsed.search || parsed.hash) {
        throw new Error("Poster URL is not an application media URL");
    }
    return `/api/backend/media/public-images/${match[1]}`;
};

/**
 * Keeps signed media on the same-origin streaming BFF. Provider URLs and
 * arbitrary public media URLs are deliberately rejected: playback must come
 * from the entitlement-checked application gateway.
 */
export const resolveSignedMediaUrl = (
    value: string,
    expected: { mediaId?: number; lessonId?: number } = {},
): string => {
    const raw = textValue(value);
    let parsed: URL;
    try {
        parsed = new URL(raw, "https://chinverse.invalid");
    } catch {
        throw new Error("Playback URL is not valid");
    }

    const match = SIGNED_MEDIA_PATH.exec(parsed.pathname);
    const mediaId = match ? Number(match[1]) : 0;
    const lessonId = Number(parsed.searchParams.get("lesson_id"));
    const subjectId = Number(parsed.searchParams.get("subject_id"));
    const expires = Number(parsed.searchParams.get("expires"));
    const signature = parsed.searchParams.get("signature") || "";
    if (
        !match
        || !Number.isSafeInteger(mediaId)
        || mediaId <= 0
        || !Number.isSafeInteger(lessonId)
        || lessonId < 0
        || !Number.isSafeInteger(subjectId)
        || subjectId < 0
        || !Number.isSafeInteger(expires)
        || expires <= 0
        || signature.length < 20
        || parsed.username
        || parsed.password
        || parsed.hash
    ) {
        throw new Error("Playback URL is not an application-signed media URL");
    }
    if (expected.mediaId && mediaId !== expected.mediaId) {
        throw new Error("Playback URL does not match the media response");
    }
    if (expected.lessonId !== undefined && lessonId !== expected.lessonId) {
        throw new Error("Playback URL does not match the lesson response");
    }

    return `/api/backend/media/assets/${mediaId}/content${parsed.search}`;
};

export const normalizePlaybackCues = (value: unknown): PlaybackCue[] => {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    return value
        .reduce<PlaybackCue[]>((result, rawValue, index) => {
            if (!rawValue || typeof rawValue !== "object") return result;
            const raw = rawValue as RawPlaybackCue;
            const start = finiteNumber(raw.start);
            const end = finiteNumber(raw.end);
            if (start === null || end === null || start < 0 || end <= start) return result;

            const chinese = textValue(raw.zh_text);
            const pinyin = textValue(raw.pinyin);
            const translation = textValue(raw.target_text);
            if (!chinese && !pinyin && !translation) return result;

            const highlightedWords = Array.isArray(raw.highlighted_words)
                ? Array.from(new Set(raw.highlighted_words
                    .filter((word): word is string => typeof word === "string")
                    .map((word) => word.trim())
                    .filter(Boolean)))
                : [];
            const fingerprint = `${start}\u0000${end}\u0000${chinese}\u0000${pinyin}\u0000${translation}`;
            if (seen.has(fingerprint)) return result;
            seen.add(fingerprint);

            result.push({
                id: positiveInteger(raw.id, index + 1),
                start,
                end,
                chinese,
                pinyin,
                translation,
                highlightedWords,
            });
            return result;
        }, [])
        .sort((left, right) => left.start - right.start || left.end - right.end || left.id - right.id);
};

const normalizeSubtitleTracks = (value: unknown): PlaybackSubtitleTrack[] => {
    if (!Array.isArray(value)) return [];

    const candidates = value.reduce<PlaybackSubtitleTrack[]>((tracks, rawValue, index) => {
        if (!rawValue || typeof rawValue !== "object") return tracks;
        const raw = rawValue as RawPlaybackSubtitleTrack;
        if (
            textValue(raw.status).toLowerCase() !== "published"
            || textValue(raw.quality_status).toLowerCase() !== "valid"
        ) return tracks;

        const language = textValue(raw.language).toLowerCase();
        const rawFormat = textValue(raw.format).toLowerCase();
        const format = rawFormat === "srt" || rawFormat === "vtt" ? rawFormat : "json";
        const cues = normalizePlaybackCues(raw.cues);
        if (!language || cues.length === 0) return tracks;

        tracks.push({
            id: positiveInteger(raw.id, index + 1),
            language,
            format,
            version: positiveInteger(raw.version, 1),
            qualityScore: finiteNumber(raw.quality_score),
            qualityWarnings: raw.quality_report && typeof raw.quality_report === "object"
                ? stringList((raw.quality_report as { warnings?: unknown }).warnings)
                : [],
            cues,
        });
        return tracks;
    }, []);

    // The database enforces one published track per language. Keep the newest
    // revision anyway so malformed/mixed-version responses cannot confuse UI.
    const newestByLanguage = new Map<string, PlaybackSubtitleTrack>();
    for (const track of candidates) {
        const current = newestByLanguage.get(track.language);
        if (!current || track.version > current.version) newestByLanguage.set(track.language, track);
    }
    return Array.from(newestByLanguage.values()).sort((left, right) => left.language.localeCompare(right.language));
};

export const normalizeLessonPlayback = (raw: RawLessonPlayback): LessonPlayback => {
    const lessonId = positiveInteger(raw.lesson?.id, 0);
    const courseId = positiveInteger(raw.lesson?.course_id, 0);
    const mediaId = positiveInteger(raw.media?.id, 0);
    const rawPlaybackUrl = textValue(raw.media?.playback_url);
    const rawPlaybackType = textValue(raw.media?.playback_type).toLowerCase();
    const playbackType: PlaybackType | null = rawPlaybackType === "hls" || rawPlaybackType === "mp4"
        ? rawPlaybackType
        : null;
    const durationSeconds = finiteNumber(raw.lesson?.duration_seconds);

    if (!lessonId || !courseId || !mediaId || !rawPlaybackUrl || !playbackType) {
        throw new Error("Playback response is missing required lesson or media fields");
    }
    const playbackUrl = resolveSignedMediaUrl(rawPlaybackUrl, { mediaId, lessonId });
    const rawExpiresAt = textValue(raw.media?.expires_at);
    const expiresAt = Date.parse(rawExpiresAt);
    if (!rawExpiresAt || !Number.isFinite(expiresAt)) {
        throw new Error("Playback response is missing a valid expiry");
    }

    const rawPosterUrl = textValue(raw.media?.poster_url);
    const posterUrl = rawPosterUrl ? resolvePublicImageUrl(rawPosterUrl) : null;

    return {
        lesson: {
            id: lessonId,
            courseId,
            title: textValue(raw.lesson?.title),
            durationSeconds: durationSeconds !== null && durationSeconds >= 0 ? durationSeconds : null,
        },
        media: {
            id: mediaId,
            playbackUrl,
            playbackType,
            posterUrl,
            expiresAt: rawExpiresAt,
        },
        entitlement: {
            required: Boolean(raw.entitlement?.required),
            granted: Boolean(raw.entitlement?.granted),
            reason: textValue(raw.entitlement?.reason) || null,
        },
        subtitles: normalizeSubtitleTracks(raw.subtitles),
    };
};

export const selectInitialSubtitleTrack = (
    tracks: PlaybackSubtitleTrack[],
    preferredLanguage = "fa",
): PlaybackSubtitleTrack | null => {
    if (tracks.length === 0) return null;
    const normalizedLanguage = preferredLanguage.toLowerCase();
    return tracks.find((track) => track.language === normalizedLanguage)
        || tracks.find((track) => track.language.startsWith(`${normalizedLanguage}-`))
        || tracks.find((track) => track.language.includes(normalizedLanguage))
        || tracks[0];
};

/**
 * Returns only a cue that actually covers the current time. During a subtitle
 * gap it returns -1; for overlaps the cue with the latest start wins.
 */
export const findActivePlaybackCueIndex = (cues: PlaybackCue[], currentTime: number): number => {
    if (cues.length === 0 || !Number.isFinite(currentTime) || currentTime < 0) return -1;

    let low = 0;
    let high = cues.length - 1;
    let candidate = -1;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (cues[middle].start <= currentTime) {
            candidate = middle;
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }

    for (let index = candidate; index >= 0; index -= 1) {
        const cue = cues[index];
        if (cue.start <= currentTime && currentTime < cue.end) return index;
    }
    return -1;
};

export const millisecondsUntilPlaybackRefresh = (
    expiresAt: string | null,
    now = Date.now(),
    refreshMarginMs = 30_000,
): number | null => {
    if (!expiresAt) return null;
    const expiry = Date.parse(expiresAt);
    if (!Number.isFinite(expiry)) return null;
    return Math.max(expiry - now - refreshMarginMs, 0);
};
