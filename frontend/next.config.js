/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const localTempDir = path.join(__dirname, '.tmp');
fs.mkdirSync(localTempDir, { recursive: true });
process.env.TMP = localTempDir;
process.env.TEMP = localTempDir;

const enablePWA = process.env.NEXT_ENABLE_PWA === '1';

/** @type {import('next').NextConfig} */
const withPWA = enablePWA
    ? require('next-pwa')({
        dest: 'public',
        register: true,
        skipWaiting: true,
        disable: process.env.NODE_ENV === 'development',
    })
    : (config) => config;

const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: __dirname,
    experimental: {
        cpus: 1,
        webpackBuildWorker: false,
    },
};

module.exports = withPWA(nextConfig);


