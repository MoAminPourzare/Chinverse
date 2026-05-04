/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development' || process.env.NEXT_DISABLE_PWA === '1',
});

const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: __dirname,
};

module.exports = withPWA(nextConfig);


