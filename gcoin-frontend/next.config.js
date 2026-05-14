/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['@farcaster/mini-app-solana'] = false;
    return config;
  },
});