import api from '@/lib/api';

export type BetaFeedbackKind = 'bug' | 'feedback' | 'feature_request' | 'other';

export interface BetaFeedbackInput {
    kind: BetaFeedbackKind;
    rating?: number;
    message: string;
    steps_to_reproduce?: string;
    route?: string;
    client_metadata?: {
        platform: string;
        browser: string;
        browser_version?: string;
        os: string;
        os_version?: string;
        screen_width: number;
        screen_height: number;
        standalone: boolean;
        network: string;
        locale: string;
        timezone: string;
    };
}

export interface BetaFeedbackResponse {
    id: number;
    kind: BetaFeedbackKind;
    rating: number | null;
    message: string;
    steps_to_reproduce: string | null;
    route: string | null;
    release_sha: string;
    client_metadata: Record<string, unknown>;
    status: string;
    created_at: string;
}

export interface BetaStatus {
    enabled: boolean;
    eligible: boolean;
    reason: string;
    cohort: string;
    feedback_enabled: boolean;
    consent_required: boolean;
    consent_accepted: boolean;
    consent_version: string;
}

const browserName = () => {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'Edge';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';
    if (/Firefox\//.test(ua)) return 'Firefox';
    return 'other';
};

const browserVersion = () => {
    if (typeof navigator === 'undefined') return undefined;
    const match = navigator.userAgent.match(/(?:Chrome|CriOS|Firefox|Version|Edg|OPR)\/(\d+(?:\.\d+)?)/);
    return match?.[1];
};

export const collectBetaClientMetadata = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return undefined;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
        || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const metadata: NonNullable<BetaFeedbackInput['client_metadata']> = {
        platform: navigator.platform || 'unknown',
        browser: browserName(),
        os: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
            || navigator.platform
            || 'unknown',
        screen_width: window.screen?.width || 0,
        screen_height: window.screen?.height || 0,
        standalone,
        network: navigator.onLine ? 'online' : 'offline',
        locale: navigator.language || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    };
    const version = browserVersion();
    if (version) metadata.browser_version = version;
    return metadata;
};

export const betaService = {
    async getStatus(): Promise<BetaStatus> {
        const response = await api.get<BetaStatus>('/beta/status', { chinverseCacheTtlMs: 0 });
        return response.data;
    },

    async submitFeedback(input: BetaFeedbackInput): Promise<BetaFeedbackResponse> {
        const response = await api.post<BetaFeedbackResponse>('/beta/feedback', input, {
            chinverseRetry: false,
        });
        return response.data;
    },

    async redeemInvite(code: string): Promise<BetaStatus> {
        const response = await api.post<BetaStatus>('/beta/invites/redeem', { code }, {
            chinverseRetry: false,
        });
        return response.data;
    },

    async acceptConsent(version: string): Promise<BetaStatus> {
        const response = await api.post<BetaStatus>('/beta/consent', { version }, {
            chinverseRetry: false,
        });
        return response.data;
    },
};
