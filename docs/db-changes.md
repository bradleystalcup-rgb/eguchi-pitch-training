# Database Changes

## 0001_initial_auth_training.sql

Adds the initial PostgreSQL schema for Better Auth and the Eguchi pitch-training protocol.

- Better Auth tables: `user`, `session`, `account`, and `verification`.
- Parent-managed child profiles in `child_profiles`.
- Default chord catalog in `chord_definitions`, seeded with the 14 essential Eguchi/CIM chords: nine white-key color chords plus five black-key tone-name chords.
- Child-level rollups in `child_training_progress`.
- Session and trial persistence in `training_sessions` and `training_trials`.

No data backfill is required because this is the initial schema. Production rollout requires setting `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` before starting auth-backed routes.
