ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "auto_next_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hotkey_mode" text NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS "accidental_mode" text NOT NULL DEFAULT 'sharps',
  ADD COLUMN IF NOT EXISTS "chord_selection_algorithm" text NOT NULL DEFAULT 'random',
  ADD COLUMN IF NOT EXISTS "sound_engine" text NOT NULL DEFAULT 'tone';
