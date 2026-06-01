CREATE TABLE IF NOT EXISTS "child_level_mastery_state" (
  "id" text PRIMARY KEY,
  "child_profile_id" text NOT NULL REFERENCES "child_profiles"("id") ON DELETE CASCADE,
  "level" integer NOT NULL,
  "perfect_session_streak" integer NOT NULL DEFAULT 0,
  "last_session_id" text,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "child_level_mastery_state_level_between_1_and_15" CHECK ("level" BETWEEN 1 AND 15),
  CONSTRAINT "child_level_mastery_state_perfect_session_streak_nonnegative" CHECK ("perfect_session_streak" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "child_level_mastery_state_child_level_unique"
  ON "child_level_mastery_state" ("child_profile_id", "level");
