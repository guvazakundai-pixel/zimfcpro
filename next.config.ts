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
};

export default nextConfig;
