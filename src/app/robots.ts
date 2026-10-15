import type { MetadataRoute } from "next";
import { SITE } from "@/lib/categories";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or one-person pages that should never show in search results
      disallow: [
        "/admin",
        "/account",
        "/checkout",
        "/api/",
        "/search",
        "/wishlist",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
