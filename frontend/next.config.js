/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

const localTempDir = path.join(__dirname, '.tmp');
fs.mkdirSync(localTempDir, { recursive: true });
process.env.TMP = localTempDir;
process.env.TEMP = localTempDir;

const deploymentTier = (process.env.NEXT_PUBLIC_DEPLOYMENT_TIER || 'staging').trim().toLowerCase();
const isPublicRelease = deploymentTier === 'production';
if (isPublicRelease) {
    const publicApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    if (!publicApiUrl.startsWith('https://')) {
        throw new Error('NEXT_PUBLIC_API_URL must use HTTPS for a production release');
    }
    if (!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()) {
        throw new Error('NEXT_PUBLIC_TURNSTILE_SITE_KEY is required for a production release');
    }
}
const enabled = (value) => value?.trim().toLowerCase() === 'true';
const incompleteFeatures = {
    subscriptions: enabled(process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS),
    referrals: enabled(process.env.NEXT_PUBLIC_FEATURE_REFERRALS),
    points: enabled(process.env.NEXT_PUBLIC_FEATURE_POINTS),
};

const imageRemotePatterns = [];
const apiImagePathnames = [
    '/assets/**',
    '/uploads/**',
    '/static/uploads/**',
    '/api/v1/media/public-images/**',
];
let apiImageOrigin = null;

const addImageOrigin = (rawOrigin, pathnames) => {
    if (!rawOrigin?.trim()) return null;
    try {
        const remote = new URL(rawOrigin.trim());
        if (!['http:', 'https:'].includes(remote.protocol)) return null;
        if (isPublicRelease && remote.protocol !== 'https:') return null;
        for (const pathname of pathnames) {
            imageRemotePatterns.push({
                protocol: remote.protocol.slice(0, -1),
                hostname: remote.hostname,
                port: remote.port,
                pathname,
            });
        }
        return remote.origin;
    } catch {
        // Invalid optional origins stay disabled instead of widening the allowlist.
        return null;
    }
};

apiImageOrigin = addImageOrigin(process.env.NEXT_PUBLIC_API_URL, apiImagePathnames);
const publicCdnOrigins = new Set([
    process.env.NEXT_PUBLIC_IMAGE_CDN_URL,
    ...(process.env.NEXT_PUBLIC_IMAGE_REMOTE_ORIGINS || '').split(','),
]);
for (const rawOrigin of publicCdnOrigins) {
    if (!rawOrigin?.trim()) continue;
    try {
        // A backend origin must never be widened to /** even if it is
        // accidentally repeated in the optional CDN setting.
        if (apiImageOrigin && new URL(rawOrigin.trim()).origin === apiImageOrigin) continue;
    } catch {
        continue;
    }
    addImageOrigin(rawOrigin, ['/**']);
}
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // The same-origin BFF must retain collection-route slashes because FastAPI
    // uses them as part of its route contract. Public page routes still resolve
    // normally, while /api/backend/... reaches the catch-all handler unchanged.
    skipTrailingSlashRedirect: true,
    experimental: {
        cpus: 1,
        webpackBuildWorker: false,
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86_400,
        deviceSizes: [320, 375, 390, 430, 640, 750, 828],
        imageSizes: [32, 36, 44, 48, 52, 56, 64, 96, 128, 180, 256],
        // Keep the optimizer away from entitlement-protected BFF media. Even a
        // manually crafted /_next/image URL may only target these public paths.
        localPatterns: [
            { pathname: '/assets/**' },
            { pathname: '/api/backend/media/public-images/**' },
        ],
        remotePatterns: imageRemotePatterns,
        dangerouslyAllowSVG: false,
        contentDispositionType: 'attachment',
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
                    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
                    { key: "X-Chinverse-Deployment-Tier", value: deploymentTier },
                    ...(!isPublicRelease
                        ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
                        : []),
                ],
            },
        ];
    },
    async redirects() {
        return [
            ["subscriptions", "/settings/subscription"],
            ["referrals", "/settings/referrals"],
            ["points", "/settings/points"],
        ]
            .filter(([feature]) => !incompleteFeatures[feature])
            .map(([, source]) => ({
                source,
                destination: "/settings",
                permanent: false,
            }));
    },
};

if (!process.env.VERCEL) {
    nextConfig.outputFileTracingRoot = path.join(__dirname, '..');
}

const sentrySourceMapsEnabled = enabled(process.env.SENTRY_SOURCE_MAPS_ENABLED)
    && Boolean(process.env.SENTRY_AUTH_TOKEN)
    && Boolean(process.env.SENTRY_ORG)
    && Boolean(process.env.SENTRY_PROJECT);

module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: sentrySourceMapsEnabled ? process.env.SENTRY_AUTH_TOKEN : undefined,
    telemetry: false,
    silent: true,
    sourcemaps: {
        disable: !sentrySourceMapsEnabled,
        deleteSourcemapsAfterUpload: true,
    },
    webpack: {
        treeshake: {
            removeDebugLogging: true,
            excludeReplayIframe: true,
            excludeReplayShadowDOM: true,
            excludeReplayCompressionWorker: true,
        },
    },
});


