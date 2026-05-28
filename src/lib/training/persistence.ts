import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  childChordReviewState,
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
import {
  chooseAdaptiveChordSlug as chooseAdaptiveChordSlugFromState,
  chooseNextTrialFromAttempt,
  chooseRandomChordSlug,
  createTrialPlanItem,
} from "./scheduler";
import type {
  ChordSelectionAlgorithm,
  ProgressSnapshot,
  TrainingTaskType,
  TrainingTrialPlanItem,
  TrialResult,
} from "./types";

export const MIN_LEARNER_LEVEL = 1;
export const MAX_LEARNER_LEVEL = 15;

export type ChildProfileSummary = {
  id: string;
  displayName: string;
  birthYear: number | null;
  currentLevel: number;
  showColorAccessibilityKeys: boolean;
  progress: ProgressSnapshot;
};

export function isValidChordSelectionAlgorithm(
  value: unknown,
): value is ChordSelectionAlgorithm {
  return value === "random" || value === "adaptive";
}

export function isValidTrainingTaskType(value: unknown): value is TrainingTaskType {
  return (
    value === "chord_identification" ||
    value === "chord_notes" ||
    value === "single_note" ||
    value === "maintenance"
  );
}

function isolatedToneNoteForTask(input: {
  taskType: TrainingTaskType;
  promptChordSlug: string;
}) {
  if (input.taskType !== "single_note") return undefined;

  const chord = DEFAULT_CHORD_DEFINITIONS.find((definition) => definition.slug === input.promptChordSlug);
  const midiNote = chord?.midiNotes[chord.midiNotes.length - 1];

  if (midiNote === undefined) return undefined;

  const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${pitchNames[midiNote % 12]}${Math.floor(midiNote / 12) - 1}`;
}

function normalizeNoteName(note: string) {
  const normalized = note.trim().replace("♯", "#").replace("♭", "B").toUpperCase();
  const flatMap: Record<string, string> = {
    DB: "C#",
    EB: "D#",
    GB: "F#",
    AB: "G#",
    BB: "A#",
  };

  return flatMap[normalized] ?? normalized;
}

function normalizeToneNote(note: string) {
  const normalized = note.trim().replace("♯", "#").replace("♭", "B").toUpperCase();
  return normalized.replace(/^([A-G](?:#|B)?)(-?\d+)$/, (_, pitch: string, octave: string) => `${normalizeNoteName(pitch)}${octave}`);
}

function noteSetsMatch(selectedNotes: readonly string[], expectedNotes: readonly string[]) {
  const selected = [...new Set(selectedNotes.map(normalizeNoteName))].sort();
  const expected = [...new Set(expectedNotes.map(normalizeNoteName))].sort();

  return selected.length === expected.length && selected.every((note, index) => note === expected[index]);
}

async function chooseAdaptiveChordSlug(input: {
  childProfileId: string;
  chordSlugs: readonly string[];
  previousChordSlug?: string;
}) {
  if (input.chordSlugs.length <= 1) return input.chordSlugs[0];

  const states = await db
    .select()
    .from(childChordReviewState)
    .where(eq(childChordReviewState.childProfileId, input.childProfileId));
  return chooseAdaptiveChordSlugFromState({
    chordSlugs: input.chordSlugs,
    previousChordSlug: input.previousChordSlug,
    reviewStates: states,
  });
}

async function chooseChordSlug(input: {
  childProfileId: string;
  chordSlugs: readonly string[];
  selectionAlgorithm: ChordSelectionAlgorithm;
  previousChordSlug?: string;
}) {
  if (input.selectionAlgorithm === "adaptive") {
    return chooseAdaptiveChordSlug(input);
  }

  return chooseRandomChordSlug(input.chordSlugs, input.previousChordSlug);
}

async function buildFirstTrial(input: {
  childProfileId: string;
  chordSlugs: readonly string[];
  selectionAlgorithm: ChordSelectionAlgorithm;
  taskType: TrainingTaskType;
}): Promise<TrainingTrialPlanItem> {
  const promptChordSlug = await chooseChordSlug(input);

  return createTrialPlanItem({
    trialIndex: 0,
    taskType: input.taskType,
    promptChordSlug,
    isolatedToneNote: isolatedToneNoteForTask({ taskType: input.taskType, promptChordSlug }),
  });
}

async function chooseNextTrial(input: {
  childProfileId: string;
  chordSlugs: readonly string[];
  selectionAlgorithm: ChordSelectionAlgorithm;
  taskType: TrainingTaskType;
  currentTrialIndex: number;
  currentPromptChordSlug: string;
  isCorrect: boolean;
  responseMs: number | null;
  totalTrials: number;
}): Promise<TrainingTrialPlanItem | null> {
  return chooseNextTrialFromAttempt({
    ...input,
    chooseChordSlug,
    isolatedToneNoteForTask,
  });
}

function ratingForAttempt(isCorrect: boolean, responseMs: number | null) {
  if (!isCorrect) return 1;
  if (responseMs === null || responseMs > 6_000) return 2;
  if (responseMs <= 2_500) return 4;
  return 3;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function updateChordReviewState(input: {
  childProfileId: string;
  chordSlug: string;
  isCorrect: boolean;
  responseMs: number | null;
}) {
  const now = new Date();
  const rating = ratingForAttempt(input.isCorrect, input.responseMs);
  const [state] = await db
    .select()
    .from(childChordReviewState)
    .where(
      and(
        eq(childChordReviewState.childProfileId, input.childProfileId),
        eq(childChordReviewState.chordSlug, input.chordSlug),
      ),
    )
    .limit(1);
  const previousStability = state?.stability ?? 1;
  const previousDifficulty = state?.difficulty ?? 5;
  const lastReviewedAt = state?.lastReviewedAt;
  const elapsedDays = lastReviewedAt
    ? Math.max(0, (now.getTime() - lastReviewedAt.getTime()) / 86_400_000)
    : 0;
  const retrievability = clampNumber(Math.pow(0.9, elapsedDays / Math.max(0.25, previousStability)), 0, 1);
  const nextDifficulty = clampNumber(previousDifficulty + (3 - rating) * 0.7, 1, 10);
  const nextStability = input.isCorrect
    ? clampNumber(previousStability * (1 + (11 - nextDifficulty) * 0.06 * (1.2 - retrievability)), 0.25, 365)
    : clampNumber(previousStability * 0.35, 0.25, 365);
  const intervalHours = input.isCorrect
    ? rating === 4
      ? Math.max(12, nextStability * 24)
      : rating === 3
        ? Math.max(6, nextStability * 12)
        : Math.max(1, nextStability * 3)
    : 0.05;
  const dueAt = new Date(now.getTime() + intervalHours * 3_600_000);

  if (state) {
    await db
      .update(childChordReviewState)
      .set({
        stability: nextStability,
        difficulty: nextDifficulty,
        retrievability,
        attempts: state.attempts + 1,
        lapses: state.lapses + Number(!input.isCorrect),
        lastResponseMs: input.responseMs,
        lastReviewedAt: now,
        dueAt,
        updatedAt: now,
      })
      .where(eq(childChordReviewState.id, state.id));
    return;
  }

  await db.insert(childChordReviewState).values({
    id: crypto.randomUUID(),
    childProfileId: input.childProfileId,
    chordSlug: input.chordSlug,
    stability: nextStability,
    difficulty: nextDifficulty,
    retrievability,
    attempts: 1,
    lapses: Number(!input.isCorrect),
    lastResponseMs: input.responseMs,
    lastReviewedAt: now,
    dueAt,
    updatedAt: now,
  });
}

function toChildSummary(row: {
  id: string;
  displayName: string;
  birthYear: number | null;
  currentLevel: number;
  showColorAccessibilityKeys: boolean;
  trainingPhase: TrainingTaskType | null;
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
    showColorAccessibilityKeys: row.showColorAccessibilityKeys,
    progress: {
      currentLevel: row.currentLevel,
      trainingPhase: row.trainingPhase ?? "chord_identification",
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
    .values({
      childProfileId: id,
      currentLevel: MIN_LEARNER_LEVEL,
      trainingPhase: "chord_identification",
      updatedAt: now,
    })
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
      showColorAccessibilityKeys: childProfiles.showColorAccessibilityKeys,
      trainingPhase: childTrainingProgress.trainingPhase,
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
      showColorAccessibilityKeys: childProfiles.showColorAccessibilityKeys,
      trainingPhase: childTrainingProgress.trainingPhase,
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
        showColorAccessibilityKeys: childProfiles.showColorAccessibilityKeys,
      });

    if (!profile) return null;

    const [progress] = await tx
      .insert(childTrainingProgress)
      .values({
        childProfileId: profile.id,
        currentLevel: input.level,
        trainingPhase: "chord_identification",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: childTrainingProgress.childProfileId,
        set: {
          currentLevel: input.level,
          trainingPhase: "chord_identification",
          updatedAt: now,
        },
      })
      .returning({
        trainingPhase: childTrainingProgress.trainingPhase,
        sessionsCompleted: childTrainingProgress.sessionsCompleted,
        trialsCompleted: childTrainingProgress.trialsCompleted,
        correctTrials: childTrainingProgress.correctTrials,
        recentAccuracy: childTrainingProgress.recentAccuracy,
      });

    return {
      ...profile,
      showColorAccessibilityKeys: profile.showColorAccessibilityKeys,
      trainingPhase: progress?.trainingPhase ?? "chord_identification",
      sessionsCompleted: progress?.sessionsCompleted ?? 0,
      trialsCompleted: progress?.trialsCompleted ?? 0,
      correctTrials: progress?.correctTrials ?? 0,
      recentAccuracy: progress?.recentAccuracy ?? 0,
    };
  });

  return updated ? toChildSummary(updated) : null;
}

export async function updateChildColorAccessibilityForParent(input: {
  parentUserId: string;
  childProfileId: string;
  showColorAccessibilityKeys: boolean;
}): Promise<ChildProfileSummary | null> {
  const now = new Date();
  const [profile] = await db
    .update(childProfiles)
    .set({
      showColorAccessibilityKeys: input.showColorAccessibilityKeys,
      updatedAt: now,
    })
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
      showColorAccessibilityKeys: childProfiles.showColorAccessibilityKeys,
    });

  if (!profile) return null;

  const progress = await getProgressSnapshot(profile.id);

  return {
    ...profile,
    progress,
  };
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
  selectionAlgorithm?: ChordSelectionAlgorithm;
}) {
  await assertParentOwnsChild(input.parentUserId, input.childProfileId);

  const [progress] = await db
    .select({
      currentLevel: childTrainingProgress.currentLevel,
      trainingPhase: childTrainingProgress.trainingPhase,
    })
    .from(childTrainingProgress)
    .where(eq(childTrainingProgress.childProfileId, input.childProfileId))
    .limit(1);

  const level = input.level ?? progress?.currentLevel ?? MIN_LEARNER_LEVEL;
  const trainingPhase = progress?.trainingPhase ?? "chord_identification";

  if (!isValidLearnerLevel(level)) {
    throw new Error("Invalid learner level.");
  }

  const protocolLevel = getProtocolLevel(level);
  const selectionAlgorithm = input.selectionAlgorithm ?? "random";

  if (!isValidChordSelectionAlgorithm(selectionAlgorithm)) {
    throw new Error("Invalid chord selection algorithm.");
  }

  const firstTrial = await buildFirstTrial({
    childProfileId: input.childProfileId,
    chordSlugs: protocolLevel.chordSlugs,
    selectionAlgorithm,
    taskType: trainingPhase,
  });

  const [session] = await db
    .insert(trainingSessions)
    .values({
      id: crypto.randomUUID(),
      childProfileId: input.childProfileId,
      parentUserId: input.parentUserId,
      protocolVersion: DEFAULT_PROTOCOL_VERSION,
      level,
      trainingPhase,
      chordSet: protocolLevel.chordSlugs,
      trialPlan: [firstTrial],
      selectionAlgorithm,
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
  selectedChordSlug?: string | null;
  selectedNotes?: string[] | null;
  selectedToneNote?: string | null;
  responseMs: number | null;
}) {
  const session = await getTrainingSessionForParent(input.parentUserId, input.sessionId);

  if (!session) {
    return { status: "not_found" as const };
  }

  if (session.status !== "active") {
    return { status: "not_active" as const };
  }

  const plannedTrial = session.trialPlan.find((trial) => trial.trialIndex === input.trialIndex);

  if (!plannedTrial) {
    return { status: "invalid_attempt" as const };
  }

  if (
    !Number.isInteger(input.trialIndex) ||
    input.trialIndex < 0 ||
    input.trialIndex >= session.totalTrials ||
    plannedTrial.promptChordSlug !== input.promptChordSlug
  ) {
    return { status: "invalid_attempt" as const };
  }

  const [chordDefinition] = await db
    .select({
      id: chordDefinitions.id,
      displayNotes: chordDefinitions.displayNotes,
    })
    .from(chordDefinitions)
    .where(eq(chordDefinitions.slug, input.promptChordSlug))
    .limit(1);

  if (!chordDefinition) {
    return { status: "invalid_attempt" as const };
  }

  let isCorrect = false;

  if (plannedTrial.answerMode === "color_choice") {
    if (!input.selectedChordSlug || !session.chordSet.includes(input.selectedChordSlug)) {
      return { status: "invalid_attempt" as const };
    }

    isCorrect = input.promptChordSlug === input.selectedChordSlug;
  } else if (plannedTrial.answerMode === "note_set") {
    if (!input.selectedNotes?.length) {
      return { status: "invalid_attempt" as const };
    }

    isCorrect = noteSetsMatch(input.selectedNotes, chordDefinition.displayNotes);
  } else if (plannedTrial.answerMode === "single_note") {
    if (!input.selectedToneNote || !plannedTrial.isolatedToneNote) {
      return { status: "invalid_attempt" as const };
    }

    isCorrect = normalizeToneNote(input.selectedToneNote) === normalizeToneNote(plannedTrial.isolatedToneNote);
  }

  await updateChordReviewState({
    childProfileId: session.childProfileId,
    chordSlug: input.promptChordSlug,
    isCorrect,
    responseMs: input.responseMs,
  });

  const nextTrial = await chooseNextTrial({
    childProfileId: session.childProfileId,
    chordSlugs: session.chordSet,
    selectionAlgorithm: session.selectionAlgorithm,
    taskType: session.trainingPhase,
    currentTrialIndex: input.trialIndex,
    currentPromptChordSlug: input.promptChordSlug,
    isCorrect,
    responseMs: input.responseMs,
    totalTrials: session.totalTrials,
  });
  const [trial] = await db
    .insert(trainingTrials)
    .values({
      id: crypto.randomUUID(),
      sessionId: session.id,
      chordDefinitionId: chordDefinition.id,
      trialIndex: input.trialIndex,
      promptChordSlug: input.promptChordSlug,
      selectedChordSlug: input.selectedChordSlug ?? null,
      selectedNotes: input.selectedNotes ?? null,
      selectedToneNote: input.selectedToneNote ?? null,
      isCorrect,
      responseMs: input.responseMs,
    })
    .returning();

  if (nextTrial) {
    await db
      .update(trainingSessions)
      .set({
        trialPlan: [...session.trialPlan, nextTrial],
      })
      .where(eq(trainingSessions.id, session.id));
  }

  return { status: "created" as const, session, trial, nextTrial };
}

export async function getProgressSnapshot(childProfileId: string): Promise<ProgressSnapshot> {
  const [progress] = await db
    .select()
    .from(childTrainingProgress)
    .where(eq(childTrainingProgress.childProfileId, childProfileId))
    .limit(1);

  return {
    currentLevel: progress?.currentLevel ?? MIN_LEARNER_LEVEL,
    trainingPhase: progress?.trainingPhase ?? "chord_identification",
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
  trainingPhase: TrainingTaskType;
  recentResults: readonly TrialResult[];
}) {
  const snapshot = await getProgressSnapshot(input.childProfileId);
  const decision = calculateProgression(
    snapshot.currentLevel,
    input.trainingPhase,
    input.recentResults,
  );
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
      trainingPhase: decision.nextTrainingPhase,
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
        trainingPhase: decision.nextTrainingPhase,
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

  if (decision.phasePromoted) {
    await db
      .update(childProfiles)
      .set({ updatedAt: now })
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
    trainingPhase: session.trainingPhase,
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
