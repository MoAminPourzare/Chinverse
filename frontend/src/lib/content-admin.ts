import api from "@/lib/api";
import type { Course } from "@/lib/courses";

export interface AdminCourseCreatePayload {
    subcategory_id: number;
    title: string;
    slug: string;
    description: string;
    /** Existing, licensed cover asset. Raw provider URLs are never accepted. */
    cover_media_id: number;
    level: string;
    metadata_json?: Record<string, unknown>;
}

export interface AdminSectionCreatePayload {
    title: string;
    order_index?: number;
    metadata_json?: Record<string, unknown>;
}

export interface AdminLessonCreatePayload {
    title: string;
    duration_minutes?: number;
    is_free?: boolean;
    /** Existing, licensed media asset. Raw provider URLs are never accepted here. */
    media_id: number;
    poster_media_id?: number | null;
    metadata_json?: Record<string, unknown>;
}

export interface AdminMediaAssetCreatePayload {
    media_type: "image" | "video" | "audio";
    file_url: string;
    storage_provider: "local" | "mounted" | "s3";
    storage_key: string;
    mime_type: string;
    duration_seconds?: number | null;
    playback_type: "hls" | "progressive";
    checksum_sha256: string;
    source_name: string;
    source_url?: string | null;
    rights_holder: string;
    license_type: string;
    license_url?: string | null;
    metadata_json?: Record<string, unknown>;
}

export interface AdminMediaAsset {
    id: number;
    status: "draft" | "published" | "archived";
    license_status: "pending" | "approved" | "rejected";
    revision: number;
    media_type: string;
    playback_type: string;
    storage_key: string;
    checksum_sha256: string | null;
}

export interface AdminSubtitleTrack {
    id: number;
    lesson_id: number;
    language: string;
    version: number;
    status: "draft" | "published" | "archived";
    quality_status: "pending" | "valid" | "invalid";
    quality_score: number | null;
    quality_report: { errors?: string[]; warnings?: string[] };
    cues: Array<{ id: number; start: number; end: number; zh_text: string; pinyin: string; target_text: string }>;
}

type AdminCourseCollection = Course[] | Course | { courses?: Course[]; items?: Course[] };

function normalizeAdminCourses(payload: AdminCourseCollection): Course[] {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
        const collection = payload as { courses?: Course[]; items?: Course[] };
        if (Array.isArray(collection.courses)) return collection.courses;
        if (Array.isArray(collection.items)) return collection.items;
        if ("id" in payload && typeof payload.id === "number") return [payload as Course];
    }
    throw new TypeError("Admin course endpoint returned an invalid collection");
}

export const contentAdminService = {
    async listCourses(): Promise<Course[]> {
        const response = await api.get<AdminCourseCollection>("/courses/admin/courses", {
            params: { _fresh: Date.now() },
            chinverseCacheTtlMs: 0,
        });
        return normalizeAdminCourses(response.data);
    },

    async createCourse(payload: AdminCourseCreatePayload): Promise<Course> {
        const response = await api.post<Course>("/courses/admin/courses", payload);
        return response.data;
    },

    async getCourseBySlug(slug: string): Promise<Course> {
        const response = await api.get<Course>(`/courses/admin/courses/by-slug/${encodeURIComponent(slug)}`, {
            params: { _fresh: Date.now() },
            chinverseCacheTtlMs: 0,
        });
        return response.data;
    },

    async createSection(courseId: number, payload: AdminSectionCreatePayload): Promise<Course> {
        const response = await api.post<Course>(`/courses/admin/courses/${courseId}/sections`, payload);
        return response.data;
    },

    async createLesson(sectionId: number, payload: AdminLessonCreatePayload): Promise<Course> {
        const response = await api.post<Course>(`/courses/admin/sections/${sectionId}/lessons`, payload);
        return response.data;
    },

    async registerMedia(payload: AdminMediaAssetCreatePayload): Promise<AdminMediaAsset> {
        const response = await api.post<AdminMediaAsset>("/media/admin/assets", payload);
        return response.data;
    },

    async getMedia(mediaId: number): Promise<AdminMediaAsset> {
        const response = await api.get<AdminMediaAsset>(`/media/admin/assets/${mediaId}`, {
            params: { _fresh: Date.now() },
            chinverseCacheTtlMs: 0,
        });
        return response.data;
    },

    async reviewMediaLicense(mediaId: number, status: "approved" | "rejected", notes: string): Promise<AdminMediaAsset> {
        const response = await api.post<AdminMediaAsset>(`/media/admin/assets/${mediaId}/license-review`, { status, notes: notes.trim() || null });
        return response.data;
    },

    async publishMedia(mediaId: number): Promise<AdminMediaAsset> {
        const response = await api.post<AdminMediaAsset>(`/media/admin/assets/${mediaId}/publish`);
        return response.data;
    },

    async ingestSubtitle(payload: {
        lessonId: number;
        language: string;
        format: "srt" | "vtt";
        sourceName: string;
        content: string;
    }): Promise<AdminSubtitleTrack> {
        const response = await api.post<AdminSubtitleTrack>(`/courses/admin/lessons/${payload.lessonId}/subtitle-tracks`, {
            language: payload.language,
            format: payload.format,
            source_name: payload.sourceName,
            content: payload.content,
            cues: [],
        });
        return response.data;
    },

    async validateSubtitle(trackId: number): Promise<AdminSubtitleTrack> {
        const response = await api.post<AdminSubtitleTrack>(`/courses/admin/subtitle-tracks/${trackId}/validate`);
        return response.data;
    },

    async publishSubtitle(trackId: number): Promise<AdminSubtitleTrack> {
        const response = await api.post<AdminSubtitleTrack>(`/courses/admin/subtitle-tracks/${trackId}/publish`);
        return response.data;
    },

    async publishLesson(lessonId: number): Promise<void> {
        await api.post(`/courses/admin/lessons/${lessonId}/publish`);
    },

    async publishCourse(courseId: number): Promise<Course> {
        const response = await api.post<Course>(`/courses/admin/courses/${courseId}/publish`);
        return response.data;
    },
};
