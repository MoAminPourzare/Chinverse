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

export interface BlockInfo {
    blocked_user_id: number;
    created_at: string;
}

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
    async listBlocks(): Promise<BlockInfo[]> {
        const response = await api.get<BlockInfo[]>("/trust/blocks");
        return response.data;
    },

    async blockUser(userId: number): Promise<BlockInfo> {
        const response = await api.post<BlockInfo>(`/trust/blocks/${userId}`);
        return response.data;
    },

    async unblockUser(userId: number): Promise<void> {
        await api.delete(`/trust/blocks/${userId}`);
    },

    async report(
        targetType: ReportTargetType,
        targetId: number,
        reason: ReportReason,
        details?: string,
    ): Promise<ReportInfo> {
        const response = await api.post<ReportInfo>("/trust/reports", {
            target_type: targetType,
            target_id: targetId,
            reason,
            details: details?.trim() || null,
        });
        return response.data;
    },

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
