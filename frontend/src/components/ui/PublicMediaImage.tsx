import NextImage, { type ImageProps } from "next/image";
import { isPublicOptimizableMediaUrl } from "@/lib/media";

/**
 * Optimizes allowlisted public media while preserving a direct request for
 * private, data/blob, and unknown third-party URLs.
 */
export default function PublicMediaImage({ src, unoptimized, ...props }: ImageProps) {
    const bypassOptimizer = typeof src === "string"
        ? !isPublicOptimizableMediaUrl(src)
        : unoptimized;

    return <NextImage src={src} unoptimized={bypassOptimizer} {...props} />;
}
