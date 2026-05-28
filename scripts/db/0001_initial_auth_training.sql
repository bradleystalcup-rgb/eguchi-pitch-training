CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "child_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "parent_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "display_name" text NOT NULL,
  "birth_year" integer,
  "current_level" integer DEFAULT 1 NOT NULL,
  "show_color_accessibility_keys" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "child_profiles_parent_user_id_idx" ON "child_profiles" ("parent_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "child_profiles_parent_display_name_unique"
  ON "child_profiles" ("parent_user_id", "display_name");

CREATE TABLE IF NOT EXISTS "chord_definitions" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "root_note" text NOT NULL,
  "quality" text NOT NULL,
  "inversion" integer DEFAULT 0 NOT NULL,
  "midi_notes" jsonb NOT NULL,
  "display_notes" jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_default" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chord_definitions_slug_unique" ON "chord_definitions" ("slug");
CREATE INDEX IF NOT EXISTS "chord_definitions_default_sort_idx"
  ON "chord_definitions" ("is_default", "sort_order");

INSERT INTO "chord_definitions"
  ("id", "slug", "name", "root_note", "quality", "inversion", "midi_notes", "display_notes", "sort_order", "is_default")
VALUES
  ('white-red-ceg', 'white-red-ceg', 'Red chord', 'C', 'major', 0, '[60,64,67]'::jsonb, '["C","E","G"]'::jsonb, 1, true),
  ('white-yellow-cfa', 'white-yellow-cfa', 'Yellow chord', 'F', 'major', 1, '[60,65,69]'::jsonb, '["C","F","A"]'::jsonb, 2, true),
  ('white-blue-bdg', 'white-blue-bdg', 'Blue chord', 'G', 'major', 1, '[59,62,67]'::jsonb, '["B","D","G"]'::jsonb, 3, true),
  ('white-black-acf', 'white-black-acf', 'Black chord', 'F', 'major', 2, '[57,60,65]'::jsonb, '["A","C","F"]'::jsonb, 4, true),
  ('white-green-dgb', 'white-green-dgb', 'Green chord', 'G', 'major', 2, '[62,67,71]'::jsonb, '["D","G","B"]'::jsonb, 5, true),
  ('white-orange-egc', 'white-orange-egc', 'Orange chord', 'C', 'major', 1, '[64,67,72]'::jsonb, '["E","G","C"]'::jsonb, 6, true),
  ('white-purple-fac', 'white-purple-fac', 'Purple chord', 'F', 'major', 0, '[65,69,72]'::jsonb, '["F","A","C"]'::jsonb, 7, true),
  ('white-pink-gbd', 'white-pink-gbd', 'Pink chord', 'G', 'major', 0, '[67,71,74]'::jsonb, '["G","B","D"]'::jsonb, 8, true),
  ('white-brown-gce', 'white-brown-gce', 'Brown chord', 'C', 'major', 2, '[67,72,76]'::jsonb, '["G","C","E"]'::jsonb, 9, true),
  ('black-csharp-major', 'black-csharp-major', 'C sharp chord', 'C#', 'major', 0, '[61,65,68]'::jsonb, '["C#","F","G#"]'::jsonb, 10, true),
  ('black-dsharp-major', 'black-dsharp-major', 'D sharp chord', 'D#', 'major', 0, '[63,67,70]'::jsonb, '["D#","G","A#"]'::jsonb, 11, true),
  ('black-fsharp-major', 'black-fsharp-major', 'F sharp chord', 'F#', 'major', 0, '[66,70,73]'::jsonb, '["F#","A#","C#"]'::jsonb, 12, true),
  ('black-gsharp-major', 'black-gsharp-major', 'G sharp chord', 'G#', 'major', 0, '[68,72,75]'::jsonb, '["G#","C","D#"]'::jsonb, 13, true),
  ('black-asharp-major', 'black-asharp-major', 'A sharp chord', 'A#', 'major', 0, '[70,74,77]'::jsonb, '["A#","D","F"]'::jsonb, 14, true)
ON CONFLICT ("slug") DO NOTHING;

CREATE TABLE IF NOT EXISTS "child_training_progress" (
  "child_profile_id" text PRIMARY KEY NOT NULL REFERENCES "child_profiles"("id") ON DELETE cascade,
  "current_level" integer DEFAULT 1 NOT NULL,
  "training_phase" text DEFAULT 'chord_identification' NOT NULL,
  "sessions_completed" integer DEFAULT 0 NOT NULL,
  "trials_completed" integer DEFAULT 0 NOT NULL,
  "correct_trials" integer DEFAULT 0 NOT NULL,
  "recent_accuracy" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS "training_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "child_profile_id" text NOT NULL REFERENCES "child_profiles"("id") ON DELETE cascade,
  "parent_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "protocol_version" text NOT NULL,
  "level" integer NOT NULL,
  "training_phase" text DEFAULT 'chord_identification' NOT NULL,
  "chord_set" jsonb NOT NULL,
  "trial_plan" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "selection_algorithm" text DEFAULT 'random' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "started_at" timestamptz DEFAULT now() NOT NULL,
  "completed_at" timestamptz,
  "total_trials" integer DEFAULT 0 NOT NULL,
  "correct_trials" integer DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS "training_sessions_child_started_idx"
  ON "training_sessions" ("child_profile_id", "started_at");
CREATE INDEX IF NOT EXISTS "training_sessions_parent_started_idx"
  ON "training_sessions" ("parent_user_id", "started_at");

CREATE TABLE IF NOT EXISTS "training_trials" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL REFERENCES "training_sessions"("id") ON DELETE cascade,
  "chord_definition_id" text REFERENCES "chord_definitions"("id") ON DELETE set null,
  "trial_index" integer NOT NULL,
  "prompt_chord_slug" text NOT NULL,
  "selected_chord_slug" text,
  "selected_notes" jsonb,
  "selected_tone_note" text,
  "is_correct" boolean NOT NULL,
  "response_ms" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "training_trials_session_trial_unique"
  ON "training_trials" ("session_id", "trial_index");
CREATE INDEX IF NOT EXISTS "training_trials_session_id_idx" ON "training_trials" ("session_id");
CREATE INDEX IF NOT EXISTS "training_trials_prompt_chord_slug_idx"
  ON "training_trials" ("prompt_chord_slug");
