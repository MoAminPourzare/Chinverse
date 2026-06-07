import api from "@/lib/api";

export interface AdminStat {
    key: string;
    label: string;
    value: number;
}

export interface AdminUserSummary {
    id: number;
    email: string;
    phone: string;
    status: string;
    is_verified: boolean;
    display_name?: string | null;
    headline?: string | null;
    created_at: string;
}

export interface AdminCourseSummary {
    id: number;
    title: string;
    slug: string;
    level: string;
    created_at: string;
}

export interface AdminWordSummary {
    id: number;
    chinese: string;
    pinyin: string;
    level: string;
    persian_meaning?: string | null;
    created_at: string;
}

export interface AdminOverview {
    stats: AdminStat[];
    recent_users: AdminUserSummary[];
    recent_courses: AdminCourseSummary[];
    recent_words: AdminWordSummary[];
}

export interface AdminAccess {
    is_admin: boolean;
    email: string;
}

export interface AdminWordDefinition {
    id?: number;
    lang_code: string;
    definition_text: string;
    part_of_speech: string;
}

export interface AdminWordExample {
    id?: number;
    zh_text: string;
    pinyin: string;
    target_text: string;
}

export interface AdminWordCollocation {
    id?: number;
    phrase_zh: string;
    phrase_pinyin: string;
    translation_target: string;
}

export interface AdminDictionaryWord {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string | null;
    level: string;
    persian_meaning?: string | null;
    chinese_meaning?: string | null;
    composition?: string | null;
    definitions: AdminWordDefinition[];
    examples: AdminWordExample[];
    collocations: AdminWordCollocation[];
    created_at: string;
    updated_at: string;
}

export interface AdminDictionaryWordPayload {
    chinese: string;
    pinyin: string;
    audio_url?: string | null;
    level: string;
    persian_meaning?: string | null;
    chinese_meaning?: string | null;
    composition?: string | null;
    definitions: AdminWordDefinition[];
    examples: AdminWordExample[];
    collocations: AdminWordCollocation[];
}

export interface AdminDictionaryImportError {
    row: number;
    chinese?: string | null;
    error: string;
}

export interface AdminDictionaryImportResult {
    created: number;
    updated: number;
    failed: number;
    imported_words: AdminDictionaryWord[];
    errors: AdminDictionaryImportError[];
}

export const adminService = {
    async getAdminAccess(): Promise<AdminAccess> {
        const response = await api.get<AdminAccess>("/admin/me");
        return response.data;
    },

    async getOverview(): Promise<AdminOverview> {
        const response = await api.get<AdminOverview>("/admin/overview");
        return response.data;
    },

    async listUsers(q = ""): Promise<AdminUserSummary[]> {
        const response = await api.get<AdminUserSummary[]>("/admin/users", {
            params: { q: q || undefined, limit: 80 },
        });
        return Array.isArray(response.data) ? response.data : [];
    },

    async listDictionary(q = ""): Promise<AdminDictionaryWord[]> {
        const response = await api.get<AdminDictionaryWord[]>("/admin/dictionary", {
            params: { q: q || undefined, limit: 80 },
        });
        return Array.isArray(response.data) ? response.data : [];
    },

    async createDictionaryWord(payload: AdminDictionaryWordPayload): Promise<AdminDictionaryWord> {
        const response = await api.post<AdminDictionaryWord>("/admin/dictionary", payload);
        return response.data;
    },

    async updateDictionaryWord(id: number, payload: AdminDictionaryWordPayload): Promise<AdminDictionaryWord> {
        const response = await api.put<AdminDictionaryWord>(`/admin/dictionary/${id}`, payload);
        return response.data;
    },

    async deleteDictionaryWord(id: number): Promise<void> {
        await api.delete(`/admin/dictionary/${id}`);
    },

    async importDictionaryFile(file: File): Promise<AdminDictionaryImportResult> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<AdminDictionaryImportResult>("/admin/dictionary/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};
