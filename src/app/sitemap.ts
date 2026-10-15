import type { MetadataRoute } from "next";
import { SITE } from "@/lib/categories";
import { getCollectionSlugs } from "@/lib/collections";
import { getProductSlugs } from "@/lib/catalog";

const STATIC_PAGES = [
  "",
  "/collections",
  "/about",
  "/delivery",
  "/returns",
  "/contact",
  "/help",
  "/track-order",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productSlugs = await getProductSlugs();

  return [
    ...STATIC_PAGES.map((path) => ({
      url: `${SITE.url}${path}`,
      priority: path === "" ? 1 : 0.5,
    })),
    ...getCollectionSlugs().map((slug) => ({
      url: `${SITE.url}/collections/${slug}`,
      priority: 0.8,
    })),
    ...productSlugs.map((slug) => ({
      url: `${SITE.url}/products/${slug}`,
      priority: 0.7,
    })),
  ];
}
