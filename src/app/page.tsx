"use client";

import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CategoryTabs from "@/components/tricks/CategoryTabs";
import TrickGrid from "@/components/tricks/TrickGrid";
import { getAllTricks, getTricksByCategory } from "@/lib/tricks";
import { Category } from "@/types";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  const tricks = useMemo(() => {
    return getTricksByCategory(activeCategory);
  }, [activeCategory]);

  const allTricks = getAllTricks();

  return (
    <main className="min-h-screen bg-zen-bg">
      <Header />

      {/* Main Content */}
      <div className="pt-14">
        {/* Hero Section */}
        <div className="px-4 py-6 text-center">
          <h1 className="heading-large text-zen-text-primary">
            けん玉技辞典
          </h1>
          <p className="text-sm text-zen-text-secondary mt-2">
            {allTricks.length}種類の技を収録
          </p>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Trick Grid */}
        <div className="mt-4">
          <TrickGrid tricks={tricks} />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
