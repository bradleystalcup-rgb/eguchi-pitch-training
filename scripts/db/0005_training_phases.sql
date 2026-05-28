ALTER TABLE "child_training_progress"
  ADD COLUMN IF NOT EXISTS "training_phase" text DEFAULT 'chord_identification' NOT NULL;

ALTER TABLE "training_sessions"
  ADD COLUMN IF NOT EXISTS "training_phase" text DEFAULT 'chord_identification' NOT NULL;
