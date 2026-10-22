import api from "@/lib/api";

export type ReportTargetType =
    | "user"
    | "post"
    | "comment"
    | "question"
    | "answer"
    | "article"
    | "article_comment"
    | "gallery"
    | "service"
    | "message";

export type ReportReason =
    | "spam"
    | "harassment"
    | "hate"
    | "impersonation"
    | "fraud"
    | "privacy"
    | "illegal"
    | "other";

export interface ReportInfo {
    id: number;
    reporter_id: number | null;
    target_type: ReportTargetType;
    target_id: number;
    reason: ReportReason;
    details: string | null;
    status: "open" | "reviewing" | "resolved" | "dismissed";
    resolution: string | null;
    assigned_to: number | null;
    created_at: string;
    resolved_at: string | null;
}

export interface ModerationAccess {
    can_moderate: boolean;
    is_admin: boolean;
    mfa_ready: boolean;
}

export const trustService = {
    async moderationQueue(status = "open"): Promise<ReportInfo[]> {
        const response = await api.get<ReportInfo[]>("/trust/moderation/reports", {
            params: { report_status: status },
        });
        return response.data;
    },

    async moderationAccess(): Promise<ModerationAccess> {
        const response = await api.get<ModerationAccess>("/trust/moderation/access");
        return response.data;
    },

    async claimReport(reportId: number): Promise<ReportInfo> {
        const response = await api.post<ReportInfo>(`/trust/moderation/reports/${reportId}/claim`);
        return response.data;
    },

    async resolveReport(
        reportId: number,
        action: "dismiss" | "resolve" | "warn" | "remove" | "suspend_user",
        notes?: string,
    ): Promise<ReportInfo> {
        const response = await api.post<ReportInfo>(
            `/trust/moderation/reports/${reportId}/resolve`,
            { action, notes: notes?.trim() || null },
        );
        return response.data;
    },
};
