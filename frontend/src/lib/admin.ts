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
    status: "active" | "suspended" | "deleted";
    is_verified: boolean;
    role: "user" | "moderator" | "admin";
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
    mfa_enabled: boolean;
    mfa_verified: boolean;
}

export interface AdminSupportTicket {
    id: number;
    user_id: number;
    message: string;
    status: "open" | "in_progress" | "closed";
    admin_reply: string | null;
    responded_at: string | null;
    created_at: string;
    user: {
        id: number;
        email: string;
        phone: string;
        display_name?: string | null;
    };
}

export type AdminBetaFeedbackStatus = "open" | "triaged" | "resolved" | "dismissed";
export type AdminBetaSeverity = "unclassified" | "P0" | "P1" | "P2" | "P3";

export interface AdminBetaSummary {
    enabled: boolean;
    invite_required: boolean;
    rollout_percent: number;
    consent_version: string;
    release_sha: string;
    invite_counts: Record<string, number>;
    feedback_counts: Record<string, number>;
    unresolved_severity_counts: Record<string, number>;
    consent_count: number;
    invite_total: number;
    feedback_total: number;
    open_feedback_count: number;
    open_p0_p1_count: number;
    generated_at: string;
}

export interface AdminBetaInvite {
    invite_id: number;
    status: "issued" | "redeemed" | "revoked" | "expired";
    has_email_binding: boolean;
    expires_at: string;
    redeemed_at: string | null;
    created_at: string;
}

export interface AdminBetaInviteIssueResult {
    invite_id: number;
    code: string;
    expires_at: string;
    raw_code_disclosure: "once";
}

export interface AdminBetaFeedback {
    id: number;
    user_id: number;
    kind: "bug" | "feedback" | "feature_request" | "other";
    rating: number | null;
    message: string;
    steps_to_reproduce: string | null;
    route: string | null;
    release_sha: string;
    client_metadata: Record<string, unknown>;
    status: AdminBetaFeedbackStatus;
    severity: AdminBetaSeverity;
    triage_note: string | null;
    reviewed_at: string | null;
    reviewed_by_user_id: number | null;
    created_at: string;
}

export interface AdminWordDefinition {
    id?: number;
    lang_code: string;
    definition_text: string;
    part_of_speech: string;
    sense_order?: number;
    notes?: string | null;
}

export interface AdminWordExample {
    id?: number;
    zh_text: string;
    pinyin: string;
    target_text: string;
    sense_order?: number;
}

export interface AdminWordCollocation {
    id?: number;
    phrase_zh: string;
    phrase_pinyin: string;
    translation_target: string;
    sense_order?: number;
}

export interface AdminDictionaryWord {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string | null;
    level: string;
    hsk_level?: number | null;
    source?: string;
    source_word_id?: string | null;
    status?: string;
    persian_meaning?: string | null;
    chinese_meaning?: string | null;
    composition?: string | null;
    notes?: string | null;
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
    hsk_level?: number | null;
    source?: string;
    source_word_id?: string | null;
    status?: string;
    persian_meaning?: string | null;
    chinese_meaning?: string | null;
    composition?: string | null;
    notes?: string | null;
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

    async listSupportTickets(status?: AdminSupportTicket["status"]): Promise<AdminSupportTicket[]> {
        const response = await api.get<AdminSupportTicket[]>("/admin/support-tickets", {
            params: { status, limit: 100 },
        });
        return Array.isArray(response.data) ? response.data : [];
    },

    async updateSupportTicket(
        ticketId: number,
        payload: { status: AdminSupportTicket["status"]; reply?: string },
    ): Promise<AdminSupportTicket> {
        const response = await api.patch<AdminSupportTicket>(`/admin/support-tickets/${ticketId}`, payload);
        return response.data;
    },

    async getBetaSummary(): Promise<AdminBetaSummary> {
        const response = await api.get<AdminBetaSummary>("/admin/beta/summary");
        return response.data;
    },

    async listBetaInvites(): Promise<AdminBetaInvite[]> {
        const response = await api.get<AdminBetaInvite[]>("/admin/beta/invites", {
            params: { limit: 100 },
        });
        return Array.isArray(response.data) ? response.data : [];
    },

    async issueBetaInvite(payload: { email?: string; ttl_days?: number }): Promise<AdminBetaInviteIssueResult> {
        const response = await api.post<AdminBetaInviteIssueResult>("/admin/beta/invites", payload);
        return response.data;
    },

    async revokeBetaInvite(inviteId: number): Promise<{ invite_id: number; status: AdminBetaInvite["status"] }> {
        const response = await api.post<{ invite_id: number; status: AdminBetaInvite["status"] }>(`/admin/beta/invites/${inviteId}/revoke`);
        return response.data;
    },

    async listBetaFeedback(status?: AdminBetaFeedbackStatus): Promise<AdminBetaFeedback[]> {
        const response = await api.get<AdminBetaFeedback[]>("/admin/beta/feedback", {
            params: { status, limit: 100 },
        });
        return Array.isArray(response.data) ? response.data : [];
    },

    async updateBetaFeedback(
        feedbackId: number,
        payload: { status: AdminBetaFeedbackStatus; severity?: AdminBetaSeverity; triage_note?: string },
    ): Promise<AdminBetaFeedback> {
        const response = await api.patch<AdminBetaFeedback>(`/admin/beta/feedback/${feedbackId}`, payload);
        return response.data;
    },

    async listUsers(q = ""): Promise<AdminUserSummary[]> {
        const response = await api.get<AdminUserSummary[]>("/admin/users", {
            params: { q: q || undefined, limit: 80 },
        });
        return Array.isArray(response.data) ? response.data : [];
    },

    async updateUserRole(userId: number, role: AdminUserSummary["role"]): Promise<AdminUserSummary> {
        const response = await api.patch<AdminUserSummary>(`/admin/users/${userId}/role`, { role });
        return response.data;
    },

    async updateUserStatus(userId: number, status: "active" | "suspended"): Promise<AdminUserSummary> {
        const response = await api.patch<AdminUserSummary>(`/admin/users/${userId}/status`, { status });
        return response.data;
    },

    async listDictionary(q = "", filters: {
        status?: string;
        source?: string;
        hsk_level?: number | null;
        missing?: string;
        limit?: number;
    } = {}): Promise<AdminDictionaryWord[]> {
        const response = await api.get<AdminDictionaryWord[]>("/admin/dictionary", {
            params: {
                q: q || undefined,
                status: filters.status || undefined,
                source: filters.source || undefined,
                hsk_level: filters.hsk_level || undefined,
                missing: filters.missing || undefined,
                limit: filters.limit || 1000,
            },
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
