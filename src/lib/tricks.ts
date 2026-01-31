import { Trick, Category } from "@/types";
import tricksData from "../../data/tricks.json";

export function getAllTricks(): Trick[] {
  return tricksData as Trick[];
}

export function getTrickBySlug(slug: string): Trick | undefined {
  return (tricksData as Trick[]).find((trick) => trick.slug === slug);
}

export function getTricksByCategory(category: Category | "all"): Trick[] {
  if (category === "all") {
    return tricksData as Trick[];
  }
  return (tricksData as Trick[]).filter((trick) => trick.category === category);
}

export function searchTricks(query: string): Trick[] {
  const lowercaseQuery = query.toLowerCase();
  return (tricksData as Trick[]).filter(
    (trick) =>
      trick.nameJa.toLowerCase().includes(lowercaseQuery) ||
      trick.nameEn.toLowerCase().includes(lowercaseQuery) ||
      trick.category.toLowerCase().includes(lowercaseQuery) ||
      trick.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getRelatedTricks(trick: Trick, limit: number = 4): Trick[] {
  return (tricksData as Trick[])
    .filter(
      (t) =>
        t.id !== trick.id &&
        (t.category === trick.category || t.difficulty === trick.difficulty)
    )
    .slice(0, limit);
}
