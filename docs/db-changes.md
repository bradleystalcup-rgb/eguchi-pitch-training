# Database Changes

## 0001_initial_auth_training.sql

Adds the initial PostgreSQL schema for Better Auth and the Eguchi pitch-training protocol.

- Better Auth tables: `user`, `session`, `account`, and `verification`.
- Parent-managed child profiles in `child_profiles`.
- Default chord catalog in `chord_definitions`, seeded with the 14 essential Eguchi/CIM chords: nine white-key color chords plus five black-key tone-name chords.
- Child-level rollups in `child_training_progress`.
- Session and trial persistence in `training_sessions` and `training_trials`.

No data backfill is required because this is the initial schema. Production rollout requires setting `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` before starting auth-backed routes.

## 0002_minimum_level_two.sql

Raises the minimum learner level from 1 to 2.

- Backfills existing `child_profiles.current_level` values below 2 to 2.
- Backfills existing `child_training_progress.current_level` values below 2 to 2.
- Changes both `current_level` defaults from 1 to 2.
- Adds validated PostgreSQL CHECK constraints requiring both `current_level` columns to stay between 2 and 15.

Data backfill is required and included in the migration. Production rollout concern: rows with `current_level` above 15 must be corrected before this migration can validate the new constraints.

## 0003_training_session_trial_plan.sql

Stores the server-issued practice-session trial order in `training_sessions.trial_plan`.

- Adds a non-null JSONB `trial_plan` column with an empty-array default.
- New sessions persist each issued trial's index and prompt chord slug.
- Attempt validation can compare submissions against the stored session plan instead of trusting browser-generated prompts.

Existing sessions receive an empty plan. In-progress sessions started before this migration should be restarted before recording new attempts.

## 0004_adaptive_chord_selection.sql

Adds lightweight persistent state for adaptive chord selection.

- Adds `training_sessions.selection_algorithm`, defaulting to `random`.
- Adds `child_chord_review_state` for per-child/per-chord scheduling state.
- Stores a compact FSRS-inspired memory state: stability, difficulty, retrievability, due date, attempts, lapses, last response time, and last review time.

This avoids storing or replaying full historical review logs while still giving the server enough data to prioritize weak or due chords across sessions.

## 0005_training_phases.sql

Adds backend support for post-chord-acquisition training phases.

- Adds `child_training_progress.training_phase`, defaulting to `chord_identification`.
- Adds `training_sessions.training_phase`, defaulting to `chord_identification`.
- Later phases can represent chord-to-notes, single-note extraction, and maintenance without overloading learner level.

## 0006_color_accessibility_keys.sql

Adds a per-child accessibility preference for color-coded chord buttons.

- Adds `child_profiles.show_color_accessibility_keys`, defaulting to false.
- Enables parent/student toggles for ColorADD-style color keys without changing the training protocol.

## 0007_attempt_answer_modes.sql

Adds storage for non-color-choice answers.

- Adds `training_trials.selected_notes` for chord-to-notes attempts.
- Adds `training_trials.selected_tone_note` for single-note extraction attempts.
- Existing `selected_chord_slug` remains the answer field for color-choice chord identification.

## 0008_allow_level_one.sql

Restores level 1 as a valid learner level so the protocol can start with two active colors.

- Changes `child_profiles.current_level` and `child_training_progress.current_level` defaults from 2 to 1.
- Replaces the level 2..15 CHECK constraints with level 1..15 constraints.
- Existing students are not backfilled down; this only allows new or manually adjusted students to use level 1.

## 0009_warmup_chord_preference.sql

Adds a nullable per-child warm-up chord preference.

- `NULL` means ask at the start of each practice session.
- `TRUE` starts sessions with warm-up chords without asking.
- `FALSE` skips warm-up chords without asking.

## 0010_child_practice_preferences.sql

Adds per-child defaults for practice room controls.

- Auto-next, hotkey side, note-name display, chord selection algorithm, and sound engine now persist with the learner profile.
- The learner settings modal and practice drawer can edit the same settings.
