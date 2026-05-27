import type { NextConfig } from "next";

// Prisma adapter-libsql overrides the connection, but Prisma still validates
// DATABASE_URL from the datasource block. Set a fallback before PrismaClient loads.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel.app" },
      { protocol: "https", hostname: "**.turso.io" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
