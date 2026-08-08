import api, {
    clearAuthSession,
    establishAccessToken,
    isAuthenticated,
    refreshAccessToken,
} from "@/lib/api";

export interface LoginRequest {
    username: string;
    password: string;
    mfa_code?: string;
    turnstile_token?: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    referral_code?: string;
    phone: string;
    display_name?: string;
    turnstile_token?: string;
    accept_terms: true;
    accept_privacy: true;
    accept_community_guidelines: true;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    mfa_verified: boolean;
    requires_verification: boolean;
}

export interface VerificationStatus {
    email_verified: boolean;
    phone_verified: boolean;
    account_verified: boolean;
}

export interface SessionInfo {
    id: string;
    created_at: string;
    last_used_at: string;
    expires_at: string;
    current: boolean;
    mfa_verified: boolean;
}

export interface MfaSetupInfo {
    secret: string;
    provisioning_uri: string;
}

export const authService = {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const params = new URLSearchParams();
        params.append("username", credentials.username);
        params.append("password", credentials.password);

        const response = await api.post<AuthResponse>("/login/access-token", params, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                ...(credentials.mfa_code ? { "X-MFA-Code": credentials.mfa_code } : {}),
                ...(credentials.turnstile_token ? { "X-Turnstile-Token": credentials.turnstile_token } : {}),
            },
        });
        establishAccessToken(response.data.access_token);
        return response.data;
    },

    async signup(data: SignupRequest): Promise<unknown> {
        const { turnstile_token, ...payload } = data;
        const response = await api.post("/signup", payload, {
            headers: turnstile_token ? { "X-Turnstile-Token": turnstile_token } : {},
        });
        return response.data;
    },

    async getVerificationStatus(): Promise<VerificationStatus> {
        const response = await api.get<VerificationStatus>("/auth/verification/status");
        return response.data;
    },

    async requestEmailVerification(): Promise<void> {
        await api.post("/auth/verification/email/request");
    },

    async confirmEmailVerification(token: string): Promise<void> {
        await api.post("/auth/verification/email/confirm", { token });
    },

    async requestPhoneVerification(): Promise<void> {
        await api.post("/auth/verification/phone/request");
    },

    async confirmPhoneVerification(token: string): Promise<void> {
        await api.post("/auth/verification/phone/confirm", { token });
    },

    async requestPasswordReset(email: string, turnstileToken?: string): Promise<void> {
        await api.post("/auth/password/reset/request", {
            email,
            turnstile_token: turnstileToken || null,
        });
    },

    async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
        await api.post("/auth/password/reset/confirm", {
            token,
            new_password: newPassword,
        });
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post("/auth/password/change", {
            current_password: currentPassword,
            new_password: newPassword,
        });
        clearAuthSession();
    },

    async listSessions(): Promise<SessionInfo[]> {
        const response = await api.get<SessionInfo[]>("/auth/sessions");
        return response.data;
    },

    async revokeSession(sessionId: string): Promise<void> {
        await api.delete(`/auth/sessions/${encodeURIComponent(sessionId)}`);
    },

    async setupAdminMfa(currentPassword: string): Promise<MfaSetupInfo> {
        const response = await api.post<MfaSetupInfo>("/auth/mfa/setup", {
            current_password: currentPassword,
        });
        return response.data;
    },

    async confirmAdminMfa(code: string): Promise<string[]> {
        const response = await api.post<{ backup_codes: string[] }>("/auth/mfa/confirm", { code });
        clearAuthSession();
        return response.data.backup_codes;
    },

    async regenerateAdminBackupCodes(): Promise<string[]> {
        const response = await api.post<{ backup_codes: string[] }>("/auth/mfa/backup-codes");
        return response.data.backup_codes;
    },

    async logoutAll(): Promise<void> {
        try {
            await api.post("/auth/logout-all");
        } finally {
            clearAuthSession();
        }
    },

    async restoreSession(): Promise<boolean> {
        if (isAuthenticated()) return true;
        return Boolean(await refreshAccessToken());
    },

    async logout(): Promise<void> {
        try {
            await api.post("/auth/logout");
        } finally {
            clearAuthSession();
        }
    },
};
