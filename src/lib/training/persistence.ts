import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  childProfiles,
  childTrainingProgress,
  chordDefinitions,
  trainingSessions,
} from "@/lib/db/schema";
import { DEFAULT_CHORD_DEFINITIONS } from "./chords";
import {
  DEFAULT_PROTOCOL_VERSION,
  calculateProgression,
  getProtocolLevel,
} from "./protocol";
import type { ProgressSnapshot, TrialResult } from "./types";

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
    .values({ childProfileId: id, currentLevel: 1, updatedAt: now })
    .onConflictDoNothing();

  return profile;
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

  const level = input.level ?? progress?.currentLevel ?? 1;
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

export async function getProgressSnapshot(childProfileId: string): Promise<ProgressSnapshot> {
  const [progress] = await db
    .select()
    .from(childTrainingProgress)
    .where(eq(childTrainingProgress.childProfileId, childProfileId))
    .limit(1);

  return {
    currentLevel: progress?.currentLevel ?? 1,
    sessionsCompleted: progress?.sessionsCompleted ?? 0,
    trialsCompleted: progress?.trialsCompleted ?? 0,
    correctTrials: progress?.correctTrials ?? 0,
    recentAccuracy: progress?.recentAccuracy ?? 0,
  };
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
