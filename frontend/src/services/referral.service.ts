import api from "@/lib/api";

export interface ReferralStats {
    total_invites: number;
    joined_count: number;
    ready_rewards: number;
    claimed_rewards: number;
}

export interface ReferralInvite {
    id: number;
    status: string;
    reward_status: string;
    created_at: string;
    display_name: string | null;
    avatar_url: string | null;
}

export interface AppliedReferral {
    id: number;
    status: string;
    reward_status: string;
    created_at: string;
    referral_code: string;
    referrer_name: string | null;
    referrer_avatar_url: string | null;
}

export interface ReferralDashboard {
    code: string;
    stats: ReferralStats;
    recent_invites: ReferralInvite[];
    applied_referral: AppliedReferral | null;
    benefits: string[];
}

export const referralService = {
    async getDashboard(): Promise<ReferralDashboard> {
        const response = await api.get<ReferralDashboard>("/referrals/me");
        return response.data;
    },

    async applyCode(code: string): Promise<void> {
        await api.post("/referrals/apply", { code });
    },

    async validateCode(code: string): Promise<{ valid: boolean; code: string | null }> {
        const response = await api.get<{ valid: boolean; code: string | null }>(`/referrals/validate/${encodeURIComponent(code)}`);
        return response.data;
    },
};
