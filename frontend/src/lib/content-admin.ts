import api from "@/lib/api";
import type { Course } from "@/lib/courses";

export interface AdminCourseCreatePayload {
    subcategory_id: number;
    title: string;
    slug: string;
    description: string;
    cover_image_url: string;
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
    video_url: string;
    thumbnail_url?: string | null;
    metadata_json?: Record<string, unknown>;
}

export const contentAdminService = {
    async createCourse(payload: AdminCourseCreatePayload): Promise<Course> {
        const response = await api.post<Course>("/courses/admin/courses", payload);
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
};
