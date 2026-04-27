const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.cartocdn\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'map-tiles',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
});

// Derive allowed origins from the app URL env var so the same config works
// in both local dev and production (Vercel sets NEXT_PUBLIC_APP_URL).
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const allowedOrigins = ['localhost:3000'];
try {
  const { hostname } = new URL(appUrl);
  if (hostname !== 'localhost' && !allowedOrigins.includes(hostname)) {
    allowedOrigins.push(hostname);
  }
} catch {
  // invalid URL — keep defaults
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  images: {
    domains: ['api.dicebear.com'],
  },
  eslint: {
    ignoreDuringBuilds: true, // ESLint runs separately in CI
  },
  // TypeScript errors are now 0 — keep ignoreBuildErrors off so the build
  // catches regressions.
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withPWA(nextConfig);
