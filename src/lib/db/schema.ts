import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  }),
);

export const childProfiles = pgTable(
  "child_profiles",
  {
    id: text("id").primaryKey(),
    parentUserId: text("parent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    birthYear: integer("birth_year"),
    currentLevel: integer("current_level").notNull().default(2),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    parentIdx: index("child_profiles_parent_user_id_idx").on(table.parentUserId),
    parentDisplayNameUnique: uniqueIndex("child_profiles_parent_display_name_unique").on(
      table.parentUserId,
      table.displayName,
    ),
    currentLevelRange: check(
      "child_profiles_current_level_between_2_and_15",
      sql`${table.currentLevel} BETWEEN 2 AND 15`,
    ),
  }),
);

export const chordDefinitions = pgTable(
  "chord_definitions",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    rootNote: text("root_note").notNull(),
    quality: text("quality").notNull(),
    inversion: integer("inversion").notNull().default(0),
    midiNotes: jsonb("midi_notes").$type<number[]>().notNull(),
    displayNotes: jsonb("display_notes").$type<string[]>().notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("chord_definitions_slug_unique").on(table.slug),
    defaultSortIdx: index("chord_definitions_default_sort_idx").on(table.isDefault, table.sortOrder),
  }),
);

export const childTrainingProgress = pgTable(
  "child_training_progress",
  {
    childProfileId: text("child_profile_id")
      .primaryKey()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    currentLevel: integer("current_level").notNull().default(2),
    sessionsCompleted: integer("sessions_completed").notNull().default(0),
    trialsCompleted: integer("trials_completed").notNull().default(0),
    correctTrials: integer("correct_trials").notNull().default(0),
    recentAccuracy: integer("recent_accuracy").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    currentLevelRange: check(
      "child_training_progress_current_level_between_2_and_15",
      sql`${table.currentLevel} BETWEEN 2 AND 15`,
    ),
  }),
);

export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: text("id").primaryKey(),
    childProfileId: text("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    parentUserId: text("parent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    protocolVersion: text("protocol_version").notNull(),
    level: integer("level").notNull(),
    chordSet: jsonb("chord_set").$type<string[]>().notNull(),
    status: text("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalTrials: integer("total_trials").notNull().default(0),
    correctTrials: integer("correct_trials").notNull().default(0),
  },
  (table) => ({
    childStartedIdx: index("training_sessions_child_started_idx").on(
      table.childProfileId,
      table.startedAt,
    ),
    parentStartedIdx: index("training_sessions_parent_started_idx").on(
      table.parentUserId,
      table.startedAt,
    ),
  }),
);

export const trainingTrials = pgTable(
  "training_trials",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    chordDefinitionId: text("chord_definition_id").references(() => chordDefinitions.id, {
      onDelete: "set null",
    }),
    trialIndex: integer("trial_index").notNull(),
    promptChordSlug: text("prompt_chord_slug").notNull(),
    selectedChordSlug: text("selected_chord_slug"),
    isCorrect: boolean("is_correct").notNull(),
    responseMs: integer("response_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionTrialUnique: uniqueIndex("training_trials_session_trial_unique").on(
      table.sessionId,
      table.trialIndex,
    ),
    sessionIdx: index("training_trials_session_id_idx").on(table.sessionId),
    promptIdx: index("training_trials_prompt_chord_slug_idx").on(table.promptChordSlug),
  }),
);
