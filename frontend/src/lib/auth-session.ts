let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const hasAccessToken = () => Boolean(accessToken);

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("chinverse-auth-change"));
    }
};
