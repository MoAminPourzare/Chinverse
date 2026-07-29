/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const localTempDir = path.join(__dirname, '.tmp');
fs.mkdirSync(localTempDir, { recursive: true });
process.env.TMP = localTempDir;
process.env.TEMP = localTempDir;

const deploymentTier = (process.env.NEXT_PUBLIC_DEPLOYMENT_TIER || 'staging').trim().toLowerCase();
const isPublicRelease = deploymentTier === 'production';
const enabled = (value) => value?.trim().toLowerCase() === 'true';
const incompleteFeatures = {
    subscriptions: enabled(process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS),
    referrals: enabled(process.env.NEXT_PUBLIC_FEATURE_REFERRALS),
    points: enabled(process.env.NEXT_PUBLIC_FEATURE_POINTS),
};

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        cpus: 1,
        webpackBuildWorker: false,
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

module.exports = nextConfig;


