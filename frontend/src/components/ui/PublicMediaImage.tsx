"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";
import { isPublicOptimizableMediaUrl } from "@/lib/media";

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

    return <NextImage src={source} unoptimized={bypassOptimizer} {...props} onError={(event) => {
        setFailedSource(src);
        onError?.(event);
    }} />;
}
