ALTER TABLE "child_profiles"
  ALTER COLUMN "current_level" SET DEFAULT 1;

ALTER TABLE "child_training_progress"
  ALTER COLUMN "current_level" SET DEFAULT 1;

ALTER TABLE "child_profiles"
  DROP CONSTRAINT IF EXISTS "child_profiles_current_level_between_2_and_15";

ALTER TABLE "child_training_progress"
  DROP CONSTRAINT IF EXISTS "child_training_progress_current_level_between_2_and_15";

ALTER TABLE "child_profiles"
  ADD CONSTRAINT "child_profiles_current_level_between_1_and_15"
  CHECK ("current_level" BETWEEN 1 AND 15);

ALTER TABLE "child_training_progress"
  ADD CONSTRAINT "child_training_progress_current_level_between_1_and_15"
  CHECK ("current_level" BETWEEN 1 AND 15);
