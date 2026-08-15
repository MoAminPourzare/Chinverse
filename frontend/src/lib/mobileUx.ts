export const MOBILE_NAVIGATION_STACK_KEY = "chinverse.mobileNavigation.v1";

export const calculateKeyboardInset = (
    layoutHeight: number,
    visualHeight: number,
    visualOffsetTop: number,
) => Math.max(0, Math.round(layoutHeight - visualHeight - visualOffsetTop));

export const updateNavigationStack = (stack: string[], route: string): string[] => {
    const normalized = route || "/";
    if (stack.at(-1) === normalized) return stack;
    if (stack.length > 1 && stack.at(-2) === normalized) return stack.slice(0, -1);
    return [...stack, normalized].slice(-32);
};

const readNavigationStack = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
        const value = JSON.parse(window.sessionStorage.getItem(MOBILE_NAVIGATION_STACK_KEY) || "[]");
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
};

export const recordInAppNavigation = (route: string) => {
    if (typeof window === "undefined") return;
    const nextStack = updateNavigationStack(readNavigationStack(), route);
    window.sessionStorage.setItem(MOBILE_NAVIGATION_STACK_KEY, JSON.stringify(nextStack));
};

export const hasInAppBackEntry = () => readNavigationStack().length > 1;

export const isIosDevice = (userAgent: string, maxTouchPoints = 0) =>
    /iPad|iPhone|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);

export const isStandaloneMode = (
    displayModeStandalone: boolean,
    navigatorStandalone = false,
) => displayModeStandalone || navigatorStandalone;

