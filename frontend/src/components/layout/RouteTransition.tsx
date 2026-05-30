"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type RouteMotion = "soft" | "tab" | "forward" | "back" | "cover" | "uncover" | "inline";

type RouteItem = {
    id: number;
    key: string;
    children: ReactNode;
    motion: RouteMotion;
};

const immersivePrefixes = ["/watch", "/chat", "/lessons", "/leitner/review"];
const detailRoots = new Set([
    "arts-cooking",
    "calligraphy",
    "cartoons",
    "characters",
    "classical",
    "classical-poetry",
    "cooking",
    "culture-texts",
    "energy-health",
    "festivals-customs",
    "grammar",
    "historical-stories",
    "hsk",
    "idioms",
    "martial-arts",
    "movies",
    "music",
    "podcasts",
    "posts",
    "practical",
    "pronunciation",
    "reality",
    "series",
    "services",
    "synonyms",
    "tea-culture",
    "topic-talks",
    "users",
    "vlogs",
]);

const mainTabs = new Set(["/", "/leitner", "/explore", "/showcase", "/profile"]);

const splitPath = (pathname: string) => pathname.split("/").filter(Boolean);

const firstSegment = (pathname: string) => splitPath(pathname)[0] || "";

const isImmersive = (pathname: string) =>
    immersivePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const isMainTabRoot = (pathname: string) => mainTabs.has(pathname);

const routeDepth = (pathname: string) => {
    const segments = splitPath(pathname);
    if (segments.length === 0) return 0;
    if (isImmersive(pathname)) return 5;
    if (detailRoots.has(segments[0]) && segments.length > 1) return 4;
    if (segments[0] === "explore" && segments.length > 1) return 3;
    if (segments[0] === "settings" && segments.length > 1) return 3;
    return segments.length;
};

const getRouteMotion = (previousPathname: string, nextPathname: string, searchOnlyChange: boolean): RouteMotion => {
    if (searchOnlyChange) return "inline";

    const previousImmersive = isImmersive(previousPathname);
    const nextImmersive = isImmersive(nextPathname);
    if (!previousImmersive && nextImmersive) return "cover";
    if (previousImmersive && !nextImmersive) return "uncover";

    if (isMainTabRoot(previousPathname) && isMainTabRoot(nextPathname)) {
        return "tab";
    }

    const previousDepth = routeDepth(previousPathname);
    const nextDepth = routeDepth(nextPathname);

    if (nextDepth > previousDepth) return "forward";
    if (nextDepth < previousDepth) return "back";
    if (firstSegment(previousPathname) !== firstSegment(nextPathname)) return "forward";

    return "soft";
};

export default function RouteTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();
    const routeKey = useMemo(() => (search ? `${pathname}?${search}` : pathname), [pathname, search]);

    const childrenRef = useRef(children);
    const previousPathnameRef = useRef(pathname);
    const previousRouteKeyRef = useRef(routeKey);
    const itemIdRef = useRef(0);
    const [items, setItems] = useState<RouteItem[]>([
        {
            id: 0,
            key: routeKey,
            children,
            motion: "soft",
        },
    ]);

    useLayoutEffect(() => {
        childrenRef.current = children;
    });

    useLayoutEffect(() => {
        if (previousRouteKeyRef.current === routeKey) return;

        const previousPathname = previousPathnameRef.current;
        const searchOnlyChange = previousPathname === pathname;
        const motion = getRouteMotion(previousPathname, pathname, searchOnlyChange);
        const nextId = itemIdRef.current + 1;

        itemIdRef.current = nextId;
        previousPathnameRef.current = pathname;
        previousRouteKeyRef.current = routeKey;

        setItems([
            {
                id: nextId,
                key: routeKey,
                children: childrenRef.current,
                motion,
            },
        ]);
    }, [pathname, routeKey]);

    return (
        <div className="route-stage">
            {items.map((item) => (
                <div
                    key={`${item.key}-${item.id}`}
                    className="route-panel"
                    data-phase="enter"
                    data-motion={item.motion}
                >
                    {item.children}
                </div>
            ))}
        </div>
    );
}
