import type { NextConfig } from "next";

const backendUrl = new URL(process.env.API_URL ?? "http://localhost:5000/api");

const nextConfig: NextConfig = {
  // Preserve Next 16.4.3's HTML-only bot list and include AI fetchers, so they
  // receive complete metadata in <head> without having to execute JavaScript.
  htmlLimitedBots: /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Googlebot|GPTBot|OAI-SearchBot|ChatGPT-User|Perplexity|Claude/i,
  async headers() {
    return ["/admin/:path*", "/api/:path*", "/cart", "/checkout", "/payment-result", "/order/success"].map((source) => ({
      source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host" as const, value: "jingledecor.com.ua" }], destination: "https://www.jingledecor.com.ua/:path*", permanent: true }];
  },
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
