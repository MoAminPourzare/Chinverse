// ==================== Shared Types for ChinVerse Domain Routes ====================

export interface Lesson {
    id: number;
    title: string;
    duration_minutes: number;
    is_free: boolean;
    media_id?: number | null;
    metadata_json?: Record<string, unknown>;
}

export interface Section {
    id: number;
    title: string;
    lessons: Lesson[];
    metadata_json?: Record<string, unknown>;
}

export interface Course {
    id: number;
    title: string;
    slug?: string;
    description: string;
    /** App-signed cover URL; absent when the cover is not licensed. */
    cover_image_url?: string | null;
    cover_url?: string | null;
    level: string;
    metadata_json?: Record<string, unknown>;
    sections: Section[];
    category?: string;
}

// Extended interface for Series (entertainment domain)
export interface SeriesData extends Course {
    synopsis?: string;
    genre?: string;
    year?: number;
    cast?: string[];
    rating?: number;
    episodes_count?: number;
}
