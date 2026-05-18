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
