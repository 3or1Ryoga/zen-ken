import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TricksSection from "@/components/tricks/TricksSection";
import { getAllTricks } from "@/lib/tricks";

export default async function HomePage() {
  const allTricks = await getAllTricks();

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
            {allTricks.length}種類の技を収録 <br />
            みんなで作るけん玉技辞典
          </p>
        </div>

        <TricksSection allTricks={allTricks} />
      </div>

      <BottomNav />
    </main>
  );
}
