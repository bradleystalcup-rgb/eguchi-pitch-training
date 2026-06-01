ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "daily_session_goal" integer NOT NULL DEFAULT 5;

ALTER TABLE "child_profiles"
  DROP CONSTRAINT IF EXISTS "child_profiles_daily_session_goal_between_1_and_12";

ALTER TABLE "child_profiles"
  ADD CONSTRAINT "child_profiles_daily_session_goal_between_1_and_12"
  CHECK ("daily_session_goal" BETWEEN 1 AND 12);
