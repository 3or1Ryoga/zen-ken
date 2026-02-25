-- Migration 002: Create tricks table

DO $$ BEGIN
  CREATE TYPE category_enum AS ENUM (
  '大皿系', '小皿系', '中皿系', '灯台系',
  '飛行機系', 'とめけん系', '回転系', '糸技系'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_ja VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  category category_enum NOT NULL,
  subcategory VARCHAR(100),
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  difficulty_label VARCHAR(50),
  attribute VARCHAR(100),
  thumbnail_url TEXT,
  icon_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tricks_category ON tricks(category);
CREATE INDEX IF NOT EXISTS idx_tricks_difficulty ON tricks(difficulty);
CREATE INDEX IF NOT EXISTS idx_tricks_slug ON tricks(slug);
