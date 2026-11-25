import type { NextConfig } from "next";

const backendUrl = new URL(process.env.API_URL ?? "http://localhost:5000/api");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: backendUrl.protocol.slice(0, -1) as "http" | "https",
        hostname: backendUrl.hostname,
        port: backendUrl.port,
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "yalynka-roku.com.ua",
      },
      {
        protocol: "https",
        hostname: "**.yalynka-roku.com.ua",
      },
      {
        protocol: "http",
        hostname: "yalynka-roku.com.ua",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
