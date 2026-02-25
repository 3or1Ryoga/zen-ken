#!/usr/bin/env python3
"""Seed tricks data from JSON into PostgreSQL."""

import json
import os
import sys
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://ryogasakai@localhost:5432/zen-ken"
)

DATA_FILE = os.path.join(
    os.path.dirname(__file__), "../../data/tricks.json"
)


def main():
    with open(DATA_FILE, encoding="utf-8") as f:
        tricks = json.load(f)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Seed a system user for mock video data
    cur.execute("""
        INSERT INTO users (id, email, username, provider)
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'zen_master@example.com',
            'zen_master',
            'email'
        )
        ON CONFLICT (email) DO NOTHING
    """)

    tricks_data = []
    for t in tricks:
        tricks_data.append((
            t["slug"],
            t["nameJa"],
            t["nameEn"],
            t["category"],
            t.get("subcategory"),
            t["difficulty"],
            t.get("difficultyLabel"),
            t.get("attribute"),
            t.get("thumbnailUrl"),
            t.get("iconUrl"),
            t.get("tags", []),
        ))

    execute_values(cur, """
        INSERT INTO tricks
          (slug, name_ja, name_en, category, subcategory, difficulty,
           difficulty_label, attribute, thumbnail_url, icon_url, tags)
        VALUES %s
        ON CONFLICT (slug) DO NOTHING
        RETURNING id, slug
    """, tricks_data)

    inserted_tricks = cur.fetchall()
    trick_slug_to_id = {slug: tid for tid, slug in inserted_tricks}

    # Also fetch existing tricks (if already seeded)
    cur.execute("SELECT id, slug FROM tricks")
    for tid, slug in cur.fetchall():
        trick_slug_to_id[slug] = tid

    # Seed videos
    videos_data = []
    for t in tricks:
        trick_id = trick_slug_to_id.get(t["slug"])
        if not trick_id:
            continue
        for v in t.get("videos", []):
            videos_data.append((
                trick_id,
                '00000000-0000-0000-0000-000000000001',  # system user
                v["videoUrl"],
                v["videoType"],
                v.get("thumbnailUrl"),
                v.get("comment"),
                v.get("views", 0),
                v.get("likes", 0),
            ))

    if videos_data:
        execute_values(cur, """
            INSERT INTO videos
              (trick_id, user_id, video_url, video_type,
               thumbnail_url, comment, views, likes)
            VALUES %s
            ON CONFLICT DO NOTHING
        """, videos_data)

    conn.commit()
    cur.close()
    conn.close()

    print(f"Seeded {len(tricks)} tricks and {len(videos_data)} videos.")


if __name__ == "__main__":
    main()
