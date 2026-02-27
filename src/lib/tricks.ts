import { Trick, Category } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function normalizeVideo(raw: Record<string, unknown>): Trick["videos"][number] {
  const user = raw.user as Record<string, unknown> | undefined;
  return {
    ...(raw as unknown as Trick["videos"][number]),
    username: (raw.username as string) ?? user?.username as string ?? "anonymous",
    userAvatar: (raw.userAvatar as string) ?? user?.avatarUrl as string ?? "",
    thumbnailUrl: (raw.thumbnailUrl as string) ?? "",
    comment: raw.comment as string | undefined,
  };
}

function normalizeTrick(raw: Record<string, unknown>): Trick {
  const rawVideos = (raw.videos as Record<string, unknown>[]) ?? [];
  return {
    ...(raw as unknown as Trick),
    subcategory: (raw.subcategory as string) ?? "",
    difficultyLabel: (raw.difficultyLabel as string) ?? "",
    attribute: (raw.attribute as string) ?? "",
    thumbnailUrl: (raw.thumbnailUrl as string) ?? "",
    iconUrl: (raw.iconUrl as string) ?? "",
    tags: (raw.tags as string[]) ?? [],
    videos: rawVideos.map(normalizeVideo),
  };
}

export async function getAllTricks(): Promise<Trick[]> {
  const res = await fetch(`${API_URL}/api/tricks?limit=100`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data.tricks as Record<string, unknown>[]).map(normalizeTrick);
}

export async function getTrickBySlug(slug: string): Promise<Trick | undefined> {
  const res = await fetch(`${API_URL}/api/tricks/${slug}`);
  if (!res.ok) return undefined;
  const json = await res.json();
  return normalizeTrick(json.data.trick as Record<string, unknown>);
}

export async function getTricksByCategory(category: Category | "all"): Promise<Trick[]> {
  const url =
    category === "all"
      ? `${API_URL}/api/tricks?limit=100`
      : `${API_URL}/api/tricks?category=${encodeURIComponent(category)}&limit=100`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data.tricks as Record<string, unknown>[]).map(normalizeTrick);
}

export async function searchTricks(query: string): Promise<Trick[]> {
  const res = await fetch(
    `${API_URL}/api/tricks?q=${encodeURIComponent(query)}&limit=100`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data.tricks as Record<string, unknown>[]).map(normalizeTrick);
}

export async function getRelatedTricks(
  trick: Trick,
  limit: number = 4
): Promise<Trick[]> {
  const res = await fetch(
    `${API_URL}/api/tricks?category=${encodeURIComponent(trick.category)}&limit=${limit + 1}`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data.tricks as Record<string, unknown>[])
    .map(normalizeTrick)
    .filter((t) => t.id !== trick.id)
    .slice(0, limit);
}
