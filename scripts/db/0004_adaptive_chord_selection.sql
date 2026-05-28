ALTER TABLE "training_sessions"
  ADD COLUMN IF NOT EXISTS "selection_algorithm" text DEFAULT 'random' NOT NULL;

CREATE TABLE IF NOT EXISTS "child_chord_review_state" (
  "id" text PRIMARY KEY NOT NULL,
  "child_profile_id" text NOT NULL REFERENCES "child_profiles"("id") ON DELETE cascade,
  "chord_slug" text NOT NULL,
  "stability" real DEFAULT 1 NOT NULL,
  "difficulty" real DEFAULT 5 NOT NULL,
  "retrievability" real DEFAULT 1 NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "lapses" integer DEFAULT 0 NOT NULL,
  "last_response_ms" integer,
  "last_reviewed_at" timestamptz,
  "due_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "child_chord_review_state_child_chord_unique"
  ON "child_chord_review_state" ("child_profile_id", "chord_slug");

CREATE INDEX IF NOT EXISTS "child_chord_review_state_child_due_idx"
  ON "child_chord_review_state" ("child_profile_id", "due_at");
