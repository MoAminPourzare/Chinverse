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
    subcategory_slug?: string | null;
    metadata_json?: Record<string, unknown>;
    sections?: CourseSectionSummary[];
    likes_count?: number;
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

export const fetchSavedCourses = async (): Promise<Course[]> => {
    const response = await api.get('/courses/saved', { params: { limit: 100 } });
    return Array.isArray(response.data) ? response.data : [];
};

export const checkCourseSaved = async (courseId: number): Promise<boolean> => {
    const response = await api.get<{ saved: boolean }>(`/courses/${courseId}/saved`);
    return Boolean(response.data?.saved);
};

export const saveCourse = async (courseId: number): Promise<boolean> => {
    const response = await api.post<{ saved: boolean }>(`/courses/${courseId}/save`);
    return Boolean(response.data?.saved);
};

export const unsaveCourse = async (courseId: number): Promise<boolean> => {
    const response = await api.delete<{ saved: boolean }>(`/courses/${courseId}/save`);
    return Boolean(response.data?.saved);
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

export const COURSE_DETAIL_PATHS: Record<string, string> = {
    hsk: "/hsk",
    pronunciation: "/pronunciation",
    characters: "/characters",
    grammar: "/grammar",
    idioms: "/idioms",
    practical: "/practical",
    vlogs: "/vlogs",
    synonyms: "/synonyms",
    classical: "/classical",
    series: "/series",
    movies: "/movies",
    cartoons: "/cartoons",
    cooking: "/cooking",
    podcasts: "/podcasts",
    music: "/music",
    reality: "/reality",
    "topic-talks": "/topic-talks",
    "arts-cooking": "/arts-cooking",
    "martial-arts": "/martial-arts",
    "energy-health": "/energy-health",
    calligraphy: "/calligraphy",
    "tea-culture": "/tea-culture",
    "culture-texts": "/culture-texts",
    "historical-stories": "/historical-stories",
    "classical-poetry": "/classical-poetry",
    "festivals-customs": "/festivals-customs",
};

export const getCourseDetailHref = (course: Course): string => {
    const subcategorySlug = course.subcategory_slug || "";
    const basePath = COURSE_DETAIL_PATHS[subcategorySlug];
    return basePath ? `${basePath}/${course.id}` : `/explore`;
};
