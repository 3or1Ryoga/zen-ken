"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CategoryTabs from "@/components/tricks/CategoryTabs";
import TrickGrid from "@/components/tricks/TrickGrid";
import { getAllTricks } from "@/lib/tricks";
import { Trick, Category } from "@/types";

export default function HomePage() {
  const [allTricks, setAllTricks] = useState<Trick[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  useEffect(() => {
    getAllTricks().then((data) => {
      setAllTricks(data);
      setLoading(false);
    });
  }, []);

  const tricks = useMemo(() => {
    if (activeCategory === "all") return allTricks;
    return allTricks.filter((t) => t.category === activeCategory);
  }, [allTricks, activeCategory]);

  return (
    <main className="min-h-screen bg-zen-bg">
      <Header />

      <div className="pt-14">
        {/* Hero Section */}
        <div className="px-4 py-3 text-center">
          <h1 className="heading-large text-zen-text-primary">
            けん玉技辞典
          </h1>
          <p className="text-sm text-zen-text-secondary mt-4">
            {loading ? "読み込み中..." : `${allTricks.length}種類の技を収録`}{" "}
            <br />
            みんなで作るけん玉技辞典
          </p>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Trick Grid */}
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-zen-text-muted text-sm">読み込み中...</div>
            </div>
          ) : (
            <TrickGrid tricks={tricks} />
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
