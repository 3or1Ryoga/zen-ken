"use client";

import { useState, useMemo } from "react";
import CategoryTabs from "@/components/tricks/CategoryTabs";
import TrickGrid from "@/components/tricks/TrickGrid";
import { Trick, Category } from "@/types";

export default function TricksSection({ allTricks }: { allTricks: Trick[] }) {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  const tricks = useMemo(() => {
    if (activeCategory === "all") return allTricks;
    return allTricks.filter((t) => t.category === activeCategory);
  }, [allTricks, activeCategory]);

  return (
    <>
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div className="mt-4">
        <TrickGrid tricks={tricks} />
      </div>
    </>
  );
}
