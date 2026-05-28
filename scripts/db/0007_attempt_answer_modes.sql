ALTER TABLE "training_trials"
  ADD COLUMN IF NOT EXISTS "selected_notes" jsonb,
  ADD COLUMN IF NOT EXISTS "selected_tone_note" text;
