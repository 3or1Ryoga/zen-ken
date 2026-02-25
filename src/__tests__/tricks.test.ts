import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllTricks,
  getTrickBySlug,
  getTricksByCategory,
  searchTricks,
  getRelatedTricks,
} from "@/lib/tricks";
import type { Trick, Category } from "@/types";

// --- Mock fetch ---

const makeTrick = (overrides: Partial<Trick> = {}): Trick => ({
  id: "uuid-1",
  slug: "big-cup",
  nameJa: "大皿",
  nameEn: "Big Cup",
  category: "大皿系",
  subcategory: "Basic Catch",
  difficulty: 1,
  difficultyLabel: "初級",
  attribute: "静止",
  thumbnailUrl: "",
  iconUrl: "",
  tags: ["初心者向け", "基本技"],
  videos: [],
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const MOCK_TRICKS: Trick[] = [
  makeTrick({ id: "uuid-1", slug: "big-cup", nameJa: "大皿", nameEn: "Big Cup", category: "大皿系", difficulty: 1, tags: ["初心者向け", "基本技"] }),
  makeTrick({ id: "uuid-2", slug: "small-cup", nameJa: "小皿", nameEn: "Small Cup", category: "小皿系", difficulty: 2, tags: ["基本技"] }),
  makeTrick({ id: "uuid-3", slug: "spike", nameJa: "とめけん", nameEn: "Spike", category: "とめけん系", difficulty: 3, tags: ["中級者向け"] }),
  makeTrick({ id: "uuid-4", slug: "lighthouse", nameJa: "灯台", nameEn: "Lighthouse", category: "灯台系", difficulty: 3, tags: ["静止技"] }),
];

function mockFetch(url: string) {
  const u = new URL(url);
  const category = u.searchParams.get("category");
  const q = u.searchParams.get("q");
  const slug = u.pathname.split("/").pop();

  // GET /api/tricks/:slug
  if (u.pathname.match(/\/api\/tricks\/[^/]+$/) && !u.pathname.endsWith("/tricks")) {
    const trick = MOCK_TRICKS.find((t) => t.slug === slug);
    if (!trick) return { ok: false, json: async () => ({}) };
    return { ok: true, json: async () => ({ success: true, data: { trick } }) };
  }

  // GET /api/tricks (list)
  let tricks = [...MOCK_TRICKS];
  if (category) tricks = tricks.filter((t) => t.category === category);
  if (q) {
    const lq = q.toLowerCase();
    tricks = tricks.filter(
      (t) =>
        t.nameJa.toLowerCase().includes(lq) ||
        t.nameEn.toLowerCase().includes(lq)
    );
  }
  return {
    ok: true,
    json: async () => ({
      success: true,
      data: { tricks, pagination: { page: 1, limit: 100, total: tricks.length, totalPages: 1 } },
    }),
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(mockFetch(url))));
});

// --- Tests ---

describe("getAllTricks", () => {
  it("returns an array of tricks", async () => {
    const tricks = await getAllTricks();
    expect(Array.isArray(tricks)).toBe(true);
    expect(tricks.length).toBeGreaterThan(0);
  });

  it("each trick has required fields", async () => {
    const tricks = await getAllTricks();
    for (const trick of tricks) {
      expect(trick.id).toBeDefined();
      expect(trick.slug).toBeDefined();
      expect(trick.nameJa).toBeDefined();
      expect(trick.nameEn).toBeDefined();
      expect(trick.category).toBeDefined();
      expect(trick.difficulty).toBeDefined();
      expect(trick.tags).toBeDefined();
      expect(Array.isArray(trick.tags)).toBe(true);
      expect(Array.isArray(trick.videos)).toBe(true);
    }
  });

  it("difficulty is between 1 and 5 for all tricks", async () => {
    const tricks = await getAllTricks();
    for (const trick of tricks) {
      expect(trick.difficulty).toBeGreaterThanOrEqual(1);
      expect(trick.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it("all slugs are unique", async () => {
    const tricks = await getAllTricks();
    const slugs = tricks.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all ids are unique", async () => {
    const tricks = await getAllTricks();
    const ids = tricks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getTrickBySlug", () => {
  it("returns a trick for a valid slug", async () => {
    const trick = await getTrickBySlug("big-cup");
    expect(trick).toBeDefined();
    expect(trick!.slug).toBe("big-cup");
    expect(trick!.nameJa).toBe("大皿");
  });

  it("returns undefined for an invalid slug", async () => {
    const trick = await getTrickBySlug("nonexistent-trick");
    expect(trick).toBeUndefined();
  });

  it("returns the correct trick data", async () => {
    const trick = await getTrickBySlug("spike");
    expect(trick).toBeDefined();
    expect(trick!.nameJa).toBe("とめけん");
    expect(trick!.nameEn).toBe("Spike");
    expect(trick!.category).toBe("とめけん系");
  });
});

describe("getTricksByCategory", () => {
  it('returns all tricks when category is "all"', async () => {
    const all = await getAllTricks();
    const filtered = await getTricksByCategory("all");
    expect(filtered.length).toBe(all.length);
  });

  it("filters tricks by category", async () => {
    const category: Category = "大皿系";
    const filtered = await getTricksByCategory(category);
    expect(filtered.length).toBeGreaterThan(0);
    for (const trick of filtered) {
      expect(trick.category).toBe(category);
    }
  });

  it("returns 0 or more tricks per category", async () => {
    const categories: Category[] = [
      "大皿系", "小皿系", "中皿系", "灯台系",
      "飛行機系", "とめけん系", "回転系", "糸技系",
    ];
    for (const cat of categories) {
      const filtered = await getTricksByCategory(cat);
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      for (const trick of filtered) {
        expect(trick.category).toBe(cat);
      }
    }
  });
});

describe("searchTricks", () => {
  it("finds tricks by Japanese name", async () => {
    const results = await searchTricks("大皿");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((t) => t.nameJa === "大皿")).toBe(true);
  });

  it("finds tricks by English name", async () => {
    const results = await searchTricks("big cup");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((t) => t.nameEn === "Big Cup")).toBe(true);
  });

  it("returns empty array for no match", async () => {
    const results = await searchTricks("xyznonexistent");
    expect(results.length).toBe(0);
  });
});

describe("getRelatedTricks", () => {
  it("returns related tricks excluding the given trick", async () => {
    const trick = await getTrickBySlug("big-cup");
    const related = await getRelatedTricks(trick!);
    expect(related.every((t) => t.id !== trick!.id)).toBe(true);
  });

  it("respects the limit parameter", async () => {
    const trick = await getTrickBySlug("big-cup");
    const related = await getRelatedTricks(trick!, 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it("defaults to 4 results", async () => {
    const trick = await getTrickBySlug("big-cup");
    const related = await getRelatedTricks(trick!);
    expect(related.length).toBeLessThanOrEqual(4);
  });
});
