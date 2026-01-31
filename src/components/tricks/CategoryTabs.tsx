"use client";

import { Category, CATEGORIES } from "@/types";

interface CategoryTabsProps {
  activeCategory: Category | "all";
  onCategoryChange: (category: Category | "all") => void;
}

export default function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-4 py-3 min-w-max">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.value
                ? "bg-zen-accent-wood text-white shadow-sm"
                : "bg-zen-card text-zen-text-secondary hover:bg-zen-divider"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
