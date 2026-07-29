/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const localTempDir = path.join(__dirname, '.tmp');
fs.mkdirSync(localTempDir, { recursive: true });
process.env.TMP = localTempDir;
process.env.TEMP = localTempDir;

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
                ],
            },
        ];
    },
};

if (!process.env.VERCEL) {
    nextConfig.outputFileTracingRoot = path.join(__dirname, '..');
}

module.exports = nextConfig;


