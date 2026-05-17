/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.BUILD_TARGET === "mobile", // ← disable PWA for mobile builds
});

const isMobileBuild = process.env.BUILD_TARGET === "mobile";

module.exports = withPWA({
  reactStrictMode: true,

  // ← only enable static export for mobile builds
  ...(isMobileBuild && {
    output: "export",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),

  webpack: (config) => {
    config.resolve.alias['@farcaster/mini-app-solana'] = false;
    return config;
  },
});