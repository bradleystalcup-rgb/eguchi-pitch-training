ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "show_color_accessibility_keys" boolean DEFAULT false NOT NULL;
