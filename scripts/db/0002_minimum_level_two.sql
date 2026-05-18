UPDATE "child_profiles"
SET "current_level" = 2
WHERE "current_level" < 2;

UPDATE "child_training_progress"
SET "current_level" = 2
WHERE "current_level" < 2;

ALTER TABLE "child_profiles"
  ALTER COLUMN "current_level" SET DEFAULT 2;

ALTER TABLE "child_training_progress"
  ALTER COLUMN "current_level" SET DEFAULT 2;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'child_profiles_current_level_between_2_and_15'
  ) THEN
    ALTER TABLE "child_profiles"
      ADD CONSTRAINT "child_profiles_current_level_between_2_and_15"
      CHECK ("current_level" BETWEEN 2 AND 15)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE "child_profiles"
  VALIDATE CONSTRAINT "child_profiles_current_level_between_2_and_15";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'child_training_progress_current_level_between_2_and_15'
  ) THEN
    ALTER TABLE "child_training_progress"
      ADD CONSTRAINT "child_training_progress_current_level_between_2_and_15"
      CHECK ("current_level" BETWEEN 2 AND 15)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE "child_training_progress"
  VALIDATE CONSTRAINT "child_training_progress_current_level_between_2_and_15";
