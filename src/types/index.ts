export type Category =
  | "大皿系"
  | "小皿系"
  | "中皿系"
  | "灯台系"
  | "飛行機系"
  | "とめけん系"
  | "回転系"
  | "糸技系";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type VideoType = "youtube" | "instagram" | "tiktok" | "upload";

export interface Video {
  id: string;
  trickId: string;
  userId: string;
  username: string;
  userAvatar: string;
  videoUrl: string;
  videoType: VideoType;
  thumbnailUrl: string;
  comment?: string;
  views: number;
  likes: number;
  createdAt: string;
}

export interface Trick {
  id: string;
  slug: string;
  nameJa: string;
  nameEn: string;
  category: Category;
  subcategory: string;
  difficulty: DifficultyLevel;
  difficultyLabel: string;
  attribute: string;
  thumbnailUrl: string;
  iconUrl: string;
  tags: string[];
  videos: Video[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  provider: "google" | "email";
  createdAt: string;
}

export const CATEGORIES: { label: string; value: Category | "all" }[] = [
  { label: "すべて", value: "all" },
  { label: "大皿", value: "大皿系" },
  { label: "小皿", value: "小皿系" },
  { label: "中皿", value: "中皿系" },
  { label: "飛行機", value: "飛行機系" },
  { label: "灯台", value: "灯台系" },
  { label: "とめけん", value: "とめけん系" },
  { label: "回転", value: "回転系" },
  { label: "糸技", value: "糸技系" },
];

export const DIFFICULTY_COLORS: Record<string, string> = {
  "初級": "bg-green-100 text-green-800",
  "中級": "bg-yellow-100 text-yellow-800",
  "上級": "bg-orange-100 text-orange-800",
  "達人": "bg-red-100 text-red-800",
};
