export const MOBILE_NAVIGATION_STACK_KEY = "chinverse.mobileNavigation.v2";

const MOBILE_NAVIGATION_SESSION_KEY = "chinverse.mobileNavigation.session.v1";
const MOBILE_NAVIGATION_STATE_KEY = "__chinverseMobileNavigation";
const MAX_TRACKED_NAVIGATION_ENTRIES = 128;

export type InAppNavigationMarker = {
    version: 1;
    sessionId: string;
    depth: number;
};

export type SafeBackAction =
    | { kind: "back" }
    | { kind: "replace"; href: string };

let inMemoryNavigationSessionId: string | null = null;
let activeNavigationSynchronizer: ((route: string) => void) | null = null;

export const calculateKeyboardInset = (
    layoutHeight: number,
    visualHeight: number,
    visualOffsetTop: number,
) => Math.max(0, Math.round(layoutHeight - visualHeight - visualOffsetTop));

export const isDefaultViewportScale = (scale: number) =>
    Number.isFinite(scale) && Math.abs(scale - 1) <= 0.05;

export const isSoftwareKeyboardOpen = (
    inset: number,
    hasEditableFocus: boolean,
    viewportScale: number,
) => hasEditableFocus && inset >= 120 && isDefaultViewportScale(viewportScale);

export const isEditableElement = (element: Element | null) => {
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) return false;
    const editable = element.closest("input, textarea, [contenteditable]");
    if (!(editable instanceof HTMLElement)) return false;
    if (editable instanceof HTMLTextAreaElement) return !editable.disabled && !editable.readOnly;
    if (editable instanceof HTMLInputElement) {
        const nonTextTypes = new Set([
            "button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit",
        ]);
        return !editable.disabled && !editable.readOnly && !nonTextTypes.has(editable.type);
    }
    const contentEditable = editable.getAttribute("contenteditable")?.toLowerCase();
    return contentEditable === "" || contentEditable === "true" || contentEditable === "plaintext-only";
};

export const normalizeInternalAppRoute = (route: string, origin: string): string | null => {
    try {
        const base = new URL(origin);
        const resolved = new URL(route || "/", base);
        if (resolved.origin !== base.origin) return null;
        return `${resolved.pathname}${resolved.search}${resolved.hash}` || "/";
    } catch {
        return null;
    }
};

export const updateNavigationStack = (stack: string[], route: string): string[] => {
    const normalized = route || "/";
    if (stack.at(-1) === normalized) return stack;
    if (stack.length > 1 && stack.at(-2) === normalized) return stack.slice(0, -1);
    return [...stack, normalized].slice(-32);
};

const isNavigationMarker = (value: unknown): value is InAppNavigationMarker => {
    if (!value || typeof value !== "object") return false;
    const marker = value as Partial<InAppNavigationMarker>;
    return marker.version === 1
        && typeof marker.sessionId === "string"
        && marker.sessionId.length > 0
        && Number.isInteger(marker.depth)
        && Number(marker.depth) >= 0;
};

const readNavigationMarker = (state: unknown): InAppNavigationMarker | null => {
    if (!state || typeof state !== "object") return null;
    const marker = (state as Record<string, unknown>)[MOBILE_NAVIGATION_STATE_KEY];
    return isNavigationMarker(marker) ? marker : null;
};

const withNavigationMarker = (state: unknown, marker: InAppNavigationMarker) => ({
    ...(state && typeof state === "object" ? state as Record<string, unknown> : {}),
    [MOBILE_NAVIGATION_STATE_KEY]: marker,
});

const createNavigationId = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const getNavigationSessionId = () => {
    if (inMemoryNavigationSessionId) return inMemoryNavigationSessionId;
    try {
        const stored = window.sessionStorage.getItem(MOBILE_NAVIGATION_SESSION_KEY);
        if (stored) {
            inMemoryNavigationSessionId = stored;
            return stored;
        }
        const created = createNavigationId();
        window.sessionStorage.setItem(MOBILE_NAVIGATION_SESSION_KEY, created);
        inMemoryNavigationSessionId = created;
        return created;
    } catch {
        inMemoryNavigationSessionId = createNavigationId();
        return inMemoryNavigationSessionId;
    }
};

const readNavigationStack = (origin: string): string[] => {
    try {
        const parsed: unknown = JSON.parse(window.sessionStorage.getItem(MOBILE_NAVIGATION_STACK_KEY) || "[]");
        if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) return [];
        const normalized = parsed.map((item) => normalizeInternalAppRoute(item, origin));
        if (normalized.some((item) => item === null)) return [];
        return normalized as string[];
    } catch {
        return [];
    }
};

const writeNavigationStack = (stack: string[]) => {
    try {
        window.sessionStorage.setItem(MOBILE_NAVIGATION_STACK_KEY, JSON.stringify(stack));
    } catch {
        // Private browsing can disable storage. Safe-back then fails closed.
    }
};

export const canNavigateBackWithinApp = (
    stack: string[],
    marker: InAppNavigationMarker | null,
    sessionId: string,
    currentRoute: string,
) => Boolean(
    marker
    && marker.sessionId === sessionId
    && marker.depth > 0
    && marker.depth < stack.length
    && stack[marker.depth] === currentRoute
    && typeof stack[marker.depth - 1] === "string",
);

export const resolveSafeBackAction = (
    canUseHistoryBack: boolean,
    fallback: string,
    origin: string,
): SafeBackAction => canUseHistoryBack
    ? { kind: "back" }
    : { kind: "replace", href: normalizeInternalAppRoute(fallback, origin) ?? "/" };

const synchronizeNavigationEntry = (route: string, replaceState: History["replaceState"]) => {
    const origin = window.location.origin;
    const normalizedRoute = normalizeInternalAppRoute(route, origin);
    if (!normalizedRoute) return;
    const sessionId = getNavigationSessionId();
    const stack = readNavigationStack(origin);
    const marker = readNavigationMarker(window.history.state);
    if (
        marker
        && marker.sessionId === sessionId
        && marker.depth < stack.length
        && stack[marker.depth] === normalizedRoute
    ) return;

    const resetMarker: InAppNavigationMarker = { version: 1, sessionId, depth: 0 };
    replaceState(withNavigationMarker(window.history.state, resetMarker), "");
    writeNavigationStack([normalizedRoute]);
};

export const installInAppNavigationTracking = () => {
    if (typeof window === "undefined") return () => undefined;
    const history = window.history;
    const origin = window.location.origin;
    const sessionId = getNavigationSessionId();
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    const synchronize = (route: string) => synchronizeNavigationEntry(route, originalReplaceState);
    const currentRoute = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

    synchronize(currentRoute());

    const trackedPushState: History["pushState"] = (data, unused, url) => {
        const targetRoute = normalizeInternalAppRoute(
            url === undefined || url === null ? window.location.href : String(url),
            origin,
        );
        if (!targetRoute) {
            originalPushState(data, unused, url);
            return;
        }
        const stack = readNavigationStack(origin);
        const marker = readNavigationMarker(history.state);
        const tracked = Boolean(
            marker
            && marker.sessionId === sessionId
            && marker.depth < stack.length
            && stack[marker.depth] === currentRoute(),
        );
        let baseStack = tracked && marker ? stack.slice(0, marker.depth + 1) : [currentRoute()];
        if (baseStack.length >= MAX_TRACKED_NAVIGATION_ENTRIES) baseStack = [currentRoute()];
        const nextMarker: InAppNavigationMarker = { version: 1, sessionId, depth: baseStack.length };
        originalPushState(withNavigationMarker(data, nextMarker), unused, url);
        writeNavigationStack([...baseStack, targetRoute]);
    };

    const trackedReplaceState: History["replaceState"] = (data, unused, url) => {
        const targetRoute = normalizeInternalAppRoute(
            url === undefined || url === null ? window.location.href : String(url),
            origin,
        );
        if (!targetRoute) {
            originalReplaceState(data, unused, url);
            return;
        }
        const stack = readNavigationStack(origin);
        const marker = readNavigationMarker(history.state);
        const tracked = Boolean(
            marker
            && marker.sessionId === sessionId
            && marker.depth < stack.length
            && stack[marker.depth] === currentRoute(),
        );
        const nextStack = tracked && marker
            ? stack.map((entry, index) => index === marker.depth ? targetRoute : entry)
            : [targetRoute];
        const nextMarker = tracked && marker
            ? marker
            : { version: 1 as const, sessionId, depth: 0 };
        originalReplaceState(withNavigationMarker(data, nextMarker), unused, url);
        writeNavigationStack(nextStack);
    };

    history.pushState = trackedPushState;
    history.replaceState = trackedReplaceState;
    activeNavigationSynchronizer = synchronize;

    const handlePopState = () => queueMicrotask(() => synchronize(currentRoute()));
    window.addEventListener("popstate", handlePopState);

    return () => {
        window.removeEventListener("popstate", handlePopState);
        if (history.pushState === trackedPushState) history.pushState = originalPushState;
        if (history.replaceState === trackedReplaceState) history.replaceState = originalReplaceState;
        if (activeNavigationSynchronizer === synchronize) activeNavigationSynchronizer = null;
    };
};

export const recordInAppNavigation = (route: string) => {
    if (typeof window === "undefined") return;
    if (activeNavigationSynchronizer) activeNavigationSynchronizer(route);
    else synchronizeNavigationEntry(route, window.history.replaceState.bind(window.history));
};

export const hasInAppBackEntry = () => {
    if (typeof window === "undefined") return false;
    const origin = window.location.origin;
    const currentRoute = normalizeInternalAppRoute(window.location.href, origin);
    if (!currentRoute) return false;
    return canNavigateBackWithinApp(
        readNavigationStack(origin),
        readNavigationMarker(window.history.state),
        getNavigationSessionId(),
        currentRoute,
    );
};

export const isIosDevice = (userAgent: string, maxTouchPoints = 0) =>
    /iPad|iPhone|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);

export const isStandaloneMode = (
    displayModeStandalone: boolean,
    navigatorStandalone = false,
) => displayModeStandalone || navigatorStandalone;
