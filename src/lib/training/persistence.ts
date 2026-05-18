import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  childProfiles,
  childTrainingProgress,
  chordDefinitions,
  trainingSessions,
  trainingTrials,
} from "@/lib/db/schema";
import { DEFAULT_CHORD_DEFINITIONS } from "./chords";
import {
  DEFAULT_PROTOCOL_VERSION,
  calculateProgression,
  getProtocolLevel,
} from "./protocol";
import type { ProgressSnapshot, TrialResult } from "./types";

export const MIN_LEARNER_LEVEL = 2;
export const MAX_LEARNER_LEVEL = 15;

export type ChildProfileSummary = {
  id: string;
  displayName: string;
  birthYear: number | null;
  currentLevel: number;
  progress: ProgressSnapshot;
};

function toChildSummary(row: {
  id: string;
  displayName: string;
  birthYear: number | null;
  currentLevel: number;
  sessionsCompleted: number | null;
  trialsCompleted: number | null;
  correctTrials: number | null;
  recentAccuracy: number | null;
}): ChildProfileSummary {
  return {
    id: row.id,
    displayName: row.displayName,
    birthYear: row.birthYear,
    currentLevel: row.currentLevel,
    progress: {
      currentLevel: row.currentLevel,
      sessionsCompleted: row.sessionsCompleted ?? 0,
      trialsCompleted: row.trialsCompleted ?? 0,
      correctTrials: row.correctTrials ?? 0,
      recentAccuracy: row.recentAccuracy ?? 0,
    },
  };
}

export async function ensureDefaultChordDefinitions() {
  await db
    .insert(chordDefinitions)
    .values([...DEFAULT_CHORD_DEFINITIONS])
    .onConflictDoNothing({ target: chordDefinitions.slug });
}

export async function createChildProfile(input: {
  parentUserId: string;
  displayName: string;
  birthYear?: number | null;
}) {
  const id = crypto.randomUUID();
  const now = new Date();

  const [profile] = await db
    .insert(childProfiles)
    .values({
      id,
      parentUserId: input.parentUserId,
      displayName: input.displayName,
      birthYear: input.birthYear ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db
    .insert(childTrainingProgress)
    .values({ childProfileId: id, currentLevel: MIN_LEARNER_LEVEL, updatedAt: now })
    .onConflictDoNothing();

  return profile;
}

export async function listChildProfilesForParent(parentUserId: string): Promise<ChildProfileSummary[]> {
  const rows = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      birthYear: childProfiles.birthYear,
      currentLevel: childProfiles.currentLevel,
      sessionsCompleted: childTrainingProgress.sessionsCompleted,
      trialsCompleted: childTrainingProgress.trialsCompleted,
      correctTrials: childTrainingProgress.correctTrials,
      recentAccuracy: childTrainingProgress.recentAccuracy,
    })
    .from(childProfiles)
    .leftJoin(
      childTrainingProgress,
      eq(childTrainingProgress.childProfileId, childProfiles.id),
    )
    .where(eq(childProfiles.parentUserId, parentUserId))
    .orderBy(childProfiles.createdAt);

  return rows.map(toChildSummary);
}

export async function getChildProfileForParent(
  parentUserId: string,
  childProfileId: string,
): Promise<ChildProfileSummary | null> {
  const [row] = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      birthYear: childProfiles.birthYear,
      currentLevel: childProfiles.currentLevel,
      sessionsCompleted: childTrainingProgress.sessionsCompleted,
      trialsCompleted: childTrainingProgress.trialsCompleted,
      correctTrials: childTrainingProgress.correctTrials,
      recentAccuracy: childTrainingProgress.recentAccuracy,
    })
    .from(childProfiles)
    .leftJoin(
      childTrainingProgress,
      eq(childTrainingProgress.childProfileId, childProfiles.id),
    )
    .where(and(eq(childProfiles.id, childProfileId), eq(childProfiles.parentUserId, parentUserId)))
    .limit(1);

  return row ? toChildSummary(row) : null;
}

export async function updateChildLevelForParent(input: {
  parentUserId: string;
  childProfileId: string;
  level: number;
}): Promise<ChildProfileSummary | null> {
  if (!isValidLearnerLevel(input.level)) {
    throw new Error("Invalid learner level.");
  }

  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [profile] = await tx
      .update(childProfiles)
      .set({ currentLevel: input.level, updatedAt: now })
      .where(
        and(
          eq(childProfiles.id, input.childProfileId),
          eq(childProfiles.parentUserId, input.parentUserId),
        ),
      )
      .returning({
        id: childProfiles.id,
        displayName: childProfiles.displayName,
        birthYear: childProfiles.birthYear,
        currentLevel: childProfiles.currentLevel,
      });

    if (!profile) return null;

    const [progress] = await tx
      .insert(childTrainingProgress)
      .values({
        childProfileId: profile.id,
        currentLevel: input.level,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: childTrainingProgress.childProfileId,
        set: {
          currentLevel: input.level,
          updatedAt: now,
        },
      })
      .returning({
        sessionsCompleted: childTrainingProgress.sessionsCompleted,
        trialsCompleted: childTrainingProgress.trialsCompleted,
        correctTrials: childTrainingProgress.correctTrials,
        recentAccuracy: childTrainingProgress.recentAccuracy,
      });

    return {
      ...profile,
      sessionsCompleted: progress?.sessionsCompleted ?? 0,
      trialsCompleted: progress?.trialsCompleted ?? 0,
      correctTrials: progress?.correctTrials ?? 0,
      recentAccuracy: progress?.recentAccuracy ?? 0,
    };
  });

  return updated ? toChildSummary(updated) : null;
}

export async function assertParentOwnsChild(parentUserId: string, childProfileId: string) {
  const [profile] = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(and(eq(childProfiles.id, childProfileId), eq(childProfiles.parentUserId, parentUserId)))
    .limit(1);

  if (!profile) throw new Error("Child profile not found for parent.");
}

export async function startTrainingSession(input: {
  parentUserId: string;
  childProfileId: string;
  level?: number;
}) {
  await assertParentOwnsChild(input.parentUserId, input.childProfileId);

  const [progress] = await db
    .select({ currentLevel: childTrainingProgress.currentLevel })
    .from(childTrainingProgress)
    .where(eq(childTrainingProgress.childProfileId, input.childProfileId))
    .limit(1);

  const level = input.level ?? progress?.currentLevel ?? MIN_LEARNER_LEVEL;

  if (!isValidLearnerLevel(level)) {
    throw new Error("Invalid learner level.");
  }

  const protocolLevel = getProtocolLevel(level);

  const [session] = await db
    .insert(trainingSessions)
    .values({
      id: crypto.randomUUID(),
      childProfileId: input.childProfileId,
      parentUserId: input.parentUserId,
      protocolVersion: DEFAULT_PROTOCOL_VERSION,
      level,
      chordSet: protocolLevel.chordSlugs,
      status: "active",
      totalTrials: protocolLevel.trialsPerSession,
      correctTrials: 0,
    })
    .returning();

  return session;
}

export async function getTrainingSessionForParent(parentUserId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(and(eq(trainingSessions.id, sessionId), eq(trainingSessions.parentUserId, parentUserId)))
    .limit(1);

  return session ?? null;
}

export async function recordTrainingAttempt(input: {
  parentUserId: string;
  sessionId: string;
  trialIndex: number;
  promptChordSlug: string;
  selectedChordSlug: string;
  responseMs: number | null;
}) {
  const session = await getTrainingSessionForParent(input.parentUserId, input.sessionId);

  if (!session) {
    return { status: "not_found" as const };
  }

  if (session.status !== "active") {
    return { status: "not_active" as const };
  }

  if (
    !Number.isInteger(input.trialIndex) ||
    input.trialIndex < 0 ||
    input.trialIndex >= session.totalTrials ||
    !session.chordSet.includes(input.promptChordSlug) ||
    !session.chordSet.includes(input.selectedChordSlug)
  ) {
    return { status: "invalid_attempt" as const };
  }

  const [chordDefinition] = await db
    .select({ id: chordDefinitions.id })
    .from(chordDefinitions)
    .where(eq(chordDefinitions.slug, input.promptChordSlug))
    .limit(1);

  if (!chordDefinition) {
    return { status: "invalid_attempt" as const };
  }

  const isCorrect = input.promptChordSlug === input.selectedChordSlug;
  const [trial] = await db
    .insert(trainingTrials)
    .values({
      id: crypto.randomUUID(),
      sessionId: session.id,
      chordDefinitionId: chordDefinition.id,
      trialIndex: input.trialIndex,
      promptChordSlug: input.promptChordSlug,
      selectedChordSlug: input.selectedChordSlug,
      isCorrect,
      responseMs: input.responseMs,
    })
    .returning();

  return { status: "created" as const, trial };
}

export async function getProgressSnapshot(childProfileId: string): Promise<ProgressSnapshot> {
  const [progress] = await db
    .select()
    .from(childTrainingProgress)
    .where(eq(childTrainingProgress.childProfileId, childProfileId))
    .limit(1);

  return {
    currentLevel: progress?.currentLevel ?? MIN_LEARNER_LEVEL,
    sessionsCompleted: progress?.sessionsCompleted ?? 0,
    trialsCompleted: progress?.trialsCompleted ?? 0,
    correctTrials: progress?.correctTrials ?? 0,
    recentAccuracy: progress?.recentAccuracy ?? 0,
  };
}

export function isValidLearnerLevel(level: unknown): level is number {
  return (
    typeof level === "number" &&
    Number.isInteger(level) &&
    level >= MIN_LEARNER_LEVEL &&
    level <= MAX_LEARNER_LEVEL
  );
}

export async function completeTrainingSession(input: {
  sessionId: string;
  childProfileId: string;
  recentResults: readonly TrialResult[];
}) {
  const snapshot = await getProgressSnapshot(input.childProfileId);
  const decision = calculateProgression(snapshot.currentLevel, input.recentResults);
  const correctTrials = input.recentResults.filter((result) => result.isCorrect).length;
  const now = new Date();

  await db
    .update(trainingSessions)
    .set({
      status: "completed",
      completedAt: now,
      totalTrials: input.recentResults.length,
      correctTrials,
    })
    .where(eq(trainingSessions.id, input.sessionId));

  await db
    .insert(childTrainingProgress)
    .values({
      childProfileId: input.childProfileId,
      currentLevel: decision.nextLevel,
      sessionsCompleted: 1,
      trialsCompleted: input.recentResults.length,
      correctTrials,
      recentAccuracy: decision.recentAccuracy,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: childTrainingProgress.childProfileId,
      set: {
        currentLevel: decision.nextLevel,
        sessionsCompleted: sql`${childTrainingProgress.sessionsCompleted} + 1`,
        trialsCompleted: sql`${childTrainingProgress.trialsCompleted} + ${input.recentResults.length}`,
        correctTrials: sql`${childTrainingProgress.correctTrials} + ${correctTrials}`,
        recentAccuracy: decision.recentAccuracy,
        updatedAt: now,
      },
    });

  if (decision.promoted) {
    await db
      .update(childProfiles)
      .set({ currentLevel: decision.nextLevel, updatedAt: now })
      .where(eq(childProfiles.id, input.childProfileId));
  }

  return decision;
}

export async function completeTrainingSessionFromSavedAttempts(input: {
  parentUserId: string;
  sessionId: string;
}) {
  const session = await getTrainingSessionForParent(input.parentUserId, input.sessionId);

  if (!session) {
    return { status: "not_found" as const };
  }

  if (session.status !== "active") {
    return { status: "not_active" as const };
  }

  const trials = await db
    .select({ isCorrect: trainingTrials.isCorrect })
    .from(trainingTrials)
    .where(eq(trainingTrials.sessionId, session.id))
    .orderBy(asc(trainingTrials.trialIndex));

  if (trials.length === 0) {
    return { status: "empty" as const };
  }

  const decision = await completeTrainingSession({
    sessionId: session.id,
    childProfileId: session.childProfileId,
    recentResults: trials,
  });

  return {
    status: "completed" as const,
    sessionId: session.id,
    childProfileId: session.childProfileId,
    totalTrials: trials.length,
    correctTrials: trials.filter((trial) => trial.isCorrect).length,
    decision,
  };
}

export async function getLatestCompletedSession(childProfileId: string) {
  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.childProfileId, childProfileId),
        eq(trainingSessions.status, "completed"),
      ),
    )
    .orderBy(desc(trainingSessions.completedAt))
    .limit(1);

  return session;
}
