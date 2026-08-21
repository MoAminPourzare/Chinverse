"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from "react";
import { Download, RefreshCw, TriangleAlert, Wifi, WifiOff, X } from "lucide-react";
import { isIosDevice, isStandaloneMode } from "@/lib/mobileUx";
import {
    CONNECTIVITY_EVENT,
    emitConnectivityState,
    readConnectivityEvent,
    type ConnectivityState,
} from "@/lib/connectivity";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type PwaContextValue = {
    supported: boolean;
    installed: boolean;
    installAvailable: boolean;
    iosInstallHint: boolean;
    online: boolean;
    connectionState: ConnectivityState;
    updateReady: boolean;
    install: () => Promise<boolean>;
    applyUpdate: () => void;
    checkForUpdate: () => Promise<void>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const PWA_ENABLED = process.env.NODE_ENV === "production";
const RELEASE_SHA_PATTERN = /^[0-9a-f]{7,64}$/;

export const normalizePwaRelease = (value: string | null | undefined) => {
    const normalized = value?.trim().toLowerCase() || "";
    return RELEASE_SHA_PATTERN.test(normalized) ? normalized : "local";
};

export const getServiceWorkerUrl = (releaseSha: string | null | undefined) =>
    `/sw.js?release=${encodeURIComponent(normalizePwaRelease(releaseSha))}`;

const subscribeToBrowserSupport = () => () => undefined;
const readBrowserSupport = () => PWA_ENABLED && "serviceWorker" in navigator;
const readServerBrowserSupport = () => false;

export function PwaProvider({ children, releaseSha }: { children: ReactNode; releaseSha: string }) {
    const [connectionState, setConnectionState] = useState<ConnectivityState>("online");
    const [showRestored, setShowRestored] = useState(false);
    const [installed, setInstalled] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [updateReady, setUpdateReady] = useState(false);
    const [iosInstallHint, setIosInstallHint] = useState(false);
    const [updateNoticeDismissed, setUpdateNoticeDismissed] = useState(false);
    const supported = useSyncExternalStore(
        subscribeToBrowserSupport,
        readBrowserSupport,
        readServerBrowserSupport,
    );
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const registeredReleaseRef = useRef("");
    const observedRegistrationsRef = useRef(new WeakSet<ServiceWorkerRegistration>());
    const observedWorkersRef = useRef(new WeakSet<ServiceWorker>());
    const reloadRequestedRef = useRef(false);
    const connectionStateRef = useRef<ConnectivityState>("online");
    const restoredTimerRef = useRef<number | null>(null);

    const applyConnectionState = useCallback((nextState: ConnectivityState) => {
        const previousState = connectionStateRef.current;
        connectionStateRef.current = nextState;
        setConnectionState(nextState);

        if (nextState === "online" && previousState !== "online") {
            setShowRestored(true);
            if (restoredTimerRef.current) window.clearTimeout(restoredTimerRef.current);
            restoredTimerRef.current = window.setTimeout(() => setShowRestored(false), 3_000);
        } else if (nextState !== "online") {
            setShowRestored(false);
        }
    }, []);

    const observeRegistration = useCallback((registration: ServiceWorkerRegistration) => {
        registrationRef.current = registration;
        const markWaitingUpdate = () => {
            if (!registration.waiting) return;
            setUpdateReady(true);
            setUpdateNoticeDismissed(false);
        };
        markWaitingUpdate();

        if (observedRegistrationsRef.current.has(registration)) return;
        observedRegistrationsRef.current.add(registration);
        const observeInstallingWorker = () => {
            const worker = registration.installing;
            if (!worker || observedWorkersRef.current.has(worker)) return;
            observedWorkersRef.current.add(worker);
            const syncWorkerState = () => {
                if (worker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        setUpdateReady(true);
                        setUpdateNoticeDismissed(false);
                    }
                    worker.removeEventListener("statechange", syncWorkerState);
                } else if (worker.state === "redundant") {
                    worker.removeEventListener("statechange", syncWorkerState);
                }
            };
            worker.addEventListener("statechange", syncWorkerState);
            syncWorkerState();
        };
        registration.addEventListener("updatefound", observeInstallingWorker);
        observeInstallingWorker();
    }, []);

    const registerRelease = useCallback(async (nextRelease: string) => {
        const normalizedRelease = normalizePwaRelease(nextRelease);
        const registration = await navigator.serviceWorker.register(
            getServiceWorkerUrl(normalizedRelease),
            { scope: "/", updateViaCache: "none" },
        );
        registeredReleaseRef.current = normalizedRelease;
        observeRegistration(registration);
        return registration;
    }, [observeRegistration]);

    const checkForUpdate = useCallback(async () => {
        if (!PWA_ENABLED || !("serviceWorker" in navigator)) return;
        try {
            let latestRelease = normalizePwaRelease(releaseSha);
            try {
                const controller = new AbortController();
                const timeout = window.setTimeout(() => controller.abort(), 5_000);
                try {
                    const response = await fetch("/api/health", {
                        cache: "no-store",
                        credentials: "same-origin",
                        headers: { "Cache-Control": "no-cache" },
                        signal: controller.signal,
                    });
                    if (response.ok) {
                        const payload = await response.json() as { release?: unknown };
                        if (typeof payload.release === "string") latestRelease = normalizePwaRelease(payload.release);
                        emitConnectivityState("online");
                    } else if (response.status >= 500) {
                        emitConnectivityState("degraded");
                    }
                } finally {
                    window.clearTimeout(timeout);
                }
            } catch {
                emitConnectivityState(navigator.onLine === false ? "offline" : "degraded");
                // The registered release can still be checked while offline.
            }

            if (!registrationRef.current || registeredReleaseRef.current !== latestRelease) {
                await registerRelease(latestRelease);
                return;
            }
            await registrationRef.current.update();
            observeRegistration(registrationRef.current);
        } catch {
            // Registration state stays usable; the next visibility/online event retries.
        }
    }, [observeRegistration, registerRelease, releaseSha]);

    useEffect(() => {
        const serviceWorkerSupported = PWA_ENABLED && "serviceWorker" in navigator;
        const standaloneQuery = window.matchMedia("(display-mode: standalone)");
        const syncConnection = () => {
            const nextState: ConnectivityState = navigator.onLine === false ? "offline" : "online";
            emitConnectivityState(nextState);
            applyConnectionState(nextState);
        };
        const syncReportedConnection = (event: Event) => {
            const nextState = readConnectivityEvent(event);
            if (nextState) applyConnectionState(nextState);
        };
        const syncInstalled = () => {
            const nextInstalled = isStandaloneMode(
                standaloneQuery.matches,
                Boolean((navigator as NavigatorWithStandalone).standalone),
            );
            setInstalled(nextInstalled);
            let hintDismissed = false;
            try {
                hintDismissed = window.localStorage.getItem("chinverse.pwa.ios-hint-dismissed") === "true";
            } catch {
                // Storage may be unavailable in hardened/private browsing modes.
            }
            setIosInstallHint(
                !nextInstalled
                && isIosDevice(navigator.userAgent, navigator.maxTouchPoints)
                && !hintDismissed,
            );
        };
        const captureInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event as BeforeInstallPromptEvent);
        };
        const markInstalled = () => {
            setInstalled(true);
            setInstallPrompt(null);
            setIosInstallHint(false);
        };
        const reloadAfterUpdate = () => {
            if (reloadRequestedRef.current) window.location.reload();
        };

        syncConnection();
        syncInstalled();
        window.addEventListener("online", syncConnection);
        window.addEventListener("offline", syncConnection);
        window.addEventListener(CONNECTIVITY_EVENT, syncReportedConnection);
        window.addEventListener("beforeinstallprompt", captureInstallPrompt);
        window.addEventListener("appinstalled", markInstalled);
        standaloneQuery.addEventListener("change", syncInstalled);

        if (serviceWorkerSupported) {
            void registerRelease(normalizePwaRelease(releaseSha)).catch(() => undefined);
            navigator.serviceWorker.addEventListener("controllerchange", reloadAfterUpdate);
        }

        return () => {
            window.removeEventListener("online", syncConnection);
            window.removeEventListener("offline", syncConnection);
            window.removeEventListener(CONNECTIVITY_EVENT, syncReportedConnection);
            window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
            window.removeEventListener("appinstalled", markInstalled);
            standaloneQuery.removeEventListener("change", syncInstalled);
            if (serviceWorkerSupported) navigator.serviceWorker.removeEventListener("controllerchange", reloadAfterUpdate);
            if (restoredTimerRef.current) window.clearTimeout(restoredTimerRef.current);
        };
    }, [applyConnectionState, registerRelease, releaseSha]);

    useEffect(() => {
        if (!PWA_ENABLED || !("serviceWorker" in navigator)) return;
        const checkWhenVisible = () => {
            if (document.visibilityState === "visible") void checkForUpdate();
        };
        document.addEventListener("visibilitychange", checkWhenVisible);
        window.addEventListener("online", checkWhenVisible);
        return () => {
            document.removeEventListener("visibilitychange", checkWhenVisible);
            window.removeEventListener("online", checkWhenVisible);
        };
    }, [checkForUpdate]);

    const install = useCallback(async () => {
        if (!installPrompt) return false;
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        setInstallPrompt(null);
        return choice.outcome === "accepted";
    }, [installPrompt]);

    const applyUpdate = useCallback(() => {
        const waiting = registrationRef.current?.waiting;
        if (!waiting) return;
        reloadRequestedRef.current = true;
        waiting.postMessage({ type: "SKIP_WAITING" });
    }, []);

    const dismissIosHint = () => {
        try {
            window.localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true");
        } catch {
            // Dismissing for this render is still useful without persistence.
        }
        setIosInstallHint(false);
    };

    const value = useMemo<PwaContextValue>(() => ({
        supported,
        installed,
        installAvailable: Boolean(installPrompt),
        iosInstallHint,
        online: connectionState !== "offline",
        connectionState,
        updateReady,
        install,
        applyUpdate,
        checkForUpdate,
    }), [applyUpdate, checkForUpdate, connectionState, install, installPrompt, installed, iosInstallHint, supported, updateReady]);

    return (
        <PwaContext.Provider value={value}>
            {children}
            {connectionState === "offline" && (
                <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+12px)] z-[1200] mx-auto flex max-w-[400px] items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl" role="status" aria-live="polite">
                    <WifiOff className="h-5 w-5 shrink-0" />
                    <span>آفلاین هستی؛ اطلاعات حساب و رسانه‌های خصوصی ذخیره نمی‌شوند.</span>
                </div>
            )}
            {connectionState === "degraded" && (
                <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+12px)] z-[1200] mx-auto flex max-w-[400px] items-center gap-3 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 shadow-xl" role="status" aria-live="polite">
                    <TriangleAlert className="h-5 w-5 shrink-0" />
                    <span>ارتباط با سرور ناپایدار است؛ تلاش مجدد خودکار انجام می‌شود.</span>
                </div>
            )}
            {showRestored && (
                <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+12px)] z-[1200] mx-auto flex max-w-[400px] items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-xl" role="status" aria-live="polite">
                    <Wifi className="h-5 w-5 shrink-0" />
                    <span>ارتباط دوباره برقرار شد.</span>
                </div>
            )}
            {updateReady && !updateNoticeDismissed && (
                <div className="pwa-action-card fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-3 right-3 z-[1200] mx-auto flex max-w-[400px] items-center gap-2 rounded-[22px] border border-[#d5e1ef] bg-white p-3 text-right shadow-2xl dark:border-[#344050] dark:bg-[#171d26]" role="status" aria-live="polite" dir="rtl">
                    <RefreshCw className="h-5 w-5 shrink-0 text-[#155aa6]" />
                    <span className="min-w-0 flex-1 text-xs font-black text-slate-700 dark:text-[#e6ebf2]">نسخهٔ تازه آماده است.</span>
                    <button type="button" onClick={applyUpdate} className="rounded-xl bg-[#155aa6] px-3 text-xs font-black text-white">به‌روزرسانی</button>
                    <button type="button" onClick={() => setUpdateNoticeDismissed(true)} className="rounded-xl text-slate-500" aria-label="بعداً"><X className="h-5 w-5" /></button>
                </div>
            )}
            {iosInstallHint && (
                <div className="pwa-action-card fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-3 right-3 z-[1190] mx-auto flex max-w-[400px] items-center gap-2 rounded-[22px] border border-[#d5e1ef] bg-white p-3 text-right shadow-2xl dark:border-[#344050] dark:bg-[#171d26]" role="status" dir="rtl">
                    <Download className="h-5 w-5 shrink-0 text-[#155aa6]" />
                    <span className="min-w-0 flex-1 text-xs font-bold leading-5 text-slate-700 dark:text-[#e6ebf2]">برای نصب در Safari، Share و سپس Add to Home Screen را بزن.</span>
                    <button type="button" onClick={dismissIosHint} className="rounded-xl text-slate-500" aria-label="بستن راهنمای نصب"><X className="h-5 w-5" /></button>
                </div>
            )}
        </PwaContext.Provider>
    );
}

export const usePwa = () => {
    const value = useContext(PwaContext);
    if (!value) throw new Error("usePwa must be used inside PwaProvider");
    return value;
};
