import api from "@/lib/api";

export interface LessonSummary {
    id: number;
    title?: string;
    duration_minutes?: number;
    is_free?: boolean;
    video_url?: string;
    metadata_json?: Record<string, unknown>;
}

export interface CourseSectionSummary {
    id: number;
    title?: string;
    order_index?: number;
    lessons?: LessonSummary[];
    metadata_json?: Record<string, unknown>;
}

export interface Course {
    id: number;
    title: string;
    slug?: string;
    description: string;
    cover_image_url: string;
    level: string;
    metadata_json?: Record<string, unknown>;
    sections?: CourseSectionSummary[];
}

export interface SubcategorySummary {
    id: number;
    name: string;
    slug: string;
    category_id: number;
}

export interface CategorySummary {
    id: number;
    name: string;
    slug: string;
    icon_url?: string | null;
    subcategories: SubcategorySummary[];
}

export const fetchCoursesBySubcategory = async (subcategorySlug: string): Promise<Course[]> => {
    const response = await api.get(`/courses?subcategory_slug=${subcategorySlug}`);
    return Array.isArray(response.data) ? response.data : [];
};

export const fetchAllCourses = async (): Promise<Course[]> => {
    const response = await api.get('/courses', { params: { limit: 1000 } });
    return Array.isArray(response.data) ? response.data : [];
};

export const fetchCourseTaxonomy = async (): Promise<CategorySummary[]> => {
    const response = await api.get<CategorySummary[]>('/courses/taxonomy');
    return Array.isArray(response.data) ? response.data : [];
};

export const getCourseMetaNumber = (
    course: Course,
    key: string,
    fallback = 0,
): number => {
    const value = course.metadata_json?.[key];
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
};

export const getCourseMetaString = (
    course: Course,
    key: string,
    fallback = "",
): string => {
    const value = course.metadata_json?.[key];
    return typeof value === "string" ? value : fallback;
};

export const getLessonCount = (course: Course): number => {
    return course.sections?.reduce((total, section) => total + (section.lessons?.length || 0), 0) || 0;
};

export const getDisplayCount = (course: Course, keys: string[], fallbackLabel: string): string => {
    for (const key of keys) {
        const count = getCourseMetaNumber(course, key);
        if (count > 0) {
            return `${count} ${fallbackLabel}`;
        }
    }

    const lessons = getLessonCount(course);
    return lessons > 0 ? `${lessons} ${fallbackLabel}` : course.level;
};

export const mergeCourseMetadata = <T extends { metadata_json?: Record<string, unknown> }>(course: T): T => {
    const metadata = course.metadata_json || {};

    return {
        ...course,
        ...metadata,
        episodes_count: metadata.episodes_count ?? metadata.tracks_count ?? (course as { episodes_count?: unknown }).episodes_count,
    };
};
