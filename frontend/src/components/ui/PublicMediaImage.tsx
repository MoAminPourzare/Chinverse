"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";
import { isPublicOptimizableMediaUrl } from "@/lib/media";
import themedAssets from "@/lib/themedAssets.json";

/**
 * Optimizes allowlisted public media while preserving a direct request for
 * private, data/blob, and unknown third-party URLs.
 */
export default function PublicMediaImage({ src, unoptimized, onError, fallbackSrc = '/assets/chinverse/image-unavailable.svg', ...props }: ImageProps & { fallbackSrc?: string }) {
    const [failedSource, setFailedSource] = useState<ImageProps['src'] | null>(null);
    const source = failedSource === src ? fallbackSrc : src;
    const bypassOptimizer = typeof source === "string"
        ? !isPublicOptimizableMediaUrl(source)
        : unoptimized;

    const darkSource = typeof source === "string" ? (themedAssets as Record<string, string>)[source] : undefined;
    const isBrandLogo = typeof source === "string" && source.startsWith("/assets/chinverse/logos/");
    const lightImage = <NextImage src={source} unoptimized={bypassOptimizer} {...props} className={`${props.className || ""}${isBrandLogo ? " brand-logo" : ""}`} data-theme-asset={darkSource ? "light" : undefined} onError={(event) => {
        setFailedSource(src);
        onError?.(event);
    }} />;
    if (!darkSource) return lightImage;
    return <>{lightImage}<NextImage {...props} src={darkSource} unoptimized data-theme-asset="dark" onError={() => setFailedSource(src)} /></>;
}
