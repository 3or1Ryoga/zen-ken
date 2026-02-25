import { describe, it, expect } from "vitest";
import { CATEGORIES, DIFFICULTY_COLORS } from "@/types";
import type { Category } from "@/types";

describe("CATEGORIES constant", () => {
  it("includes 'all' option as first entry", () => {
    expect(CATEGORIES[0].value).toBe("all");
    expect(CATEGORIES[0].label).toBe("すべて");
  });

  it("contains all 8 categories plus 'all'", () => {
    expect(CATEGORIES.length).toBe(9);
  });

  it("all category values are valid", () => {
    const validCategories: (Category | "all")[] = [
      "all",
      "大皿系",
      "小皿系",
      "中皿系",
      "灯台系",
      "飛行機系",
      "とめけん系",
      "回転系",
      "糸技系",
    ];
    for (const cat of CATEGORIES) {
      expect(validCategories).toContain(cat.value);
    }
  });

  it("all categories have non-empty labels", () => {
    for (const cat of CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });
});

describe("DIFFICULTY_COLORS constant", () => {
  it("has colors for all difficulty labels", () => {
    const expectedLabels = ["初級", "中級", "上級", "達人"];
    for (const label of expectedLabels) {
      expect(DIFFICULTY_COLORS[label]).toBeDefined();
      expect(DIFFICULTY_COLORS[label].length).toBeGreaterThan(0);
    }
  });

  it("each color string contains Tailwind classes", () => {
    for (const [, classes] of Object.entries(DIFFICULTY_COLORS)) {
      expect(classes).toMatch(/bg-/);
      expect(classes).toMatch(/text-/);
    }
  });
});
