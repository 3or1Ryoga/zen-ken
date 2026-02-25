import { MetadataRoute } from "next";

const BASE_URL = "https://zen-ken.vercel.app";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 技ページ（動的）
  try {
    const res = await fetch(`${API_URL}/api/tricks?limit=100`);
    if (!res.ok) return staticPages;

    const json = await res.json();
    const tricks = json.data.tricks as { slug: string; updatedAt: string }[];

    const trickPages: MetadataRoute.Sitemap = tricks.map((trick) => ({
      url: `${BASE_URL}/tricks/${trick.slug}`,
      lastModified: new Date(trick.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    return [...staticPages, ...trickPages];
  } catch {
    return staticPages;
  }
}
