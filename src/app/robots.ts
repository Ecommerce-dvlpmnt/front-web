import type { MetadataRoute } from "next"
import { getSiteOrigin } from "@/lib/config/site"

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()

  return {
    rules: [{
      userAgent: ["*", "Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Google-Extended", "Applebot-Extended"],
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/cart", "/payment-result", "/order/success"],
    }],
    sitemap: `${origin}/sitemap.xml`,
  }
}
