import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Removed /api/:path* rewrite - now handled by API routes in /app/api/
      {
        source: "/admin/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/admin/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
