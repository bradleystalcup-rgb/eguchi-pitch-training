ALTER TABLE "training_sessions"
  ADD COLUMN IF NOT EXISTS "trial_plan" jsonb DEFAULT '[]'::jsonb NOT NULL;
