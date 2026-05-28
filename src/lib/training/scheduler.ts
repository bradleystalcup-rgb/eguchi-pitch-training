import type {
  AnswerMode,
  ChordSelectionAlgorithm,
  TrainingTaskType,
  TrainingTrialPlanItem,
} from "./types";

export const SLOW_RESPONSE_MS = 6_000;

export type ReviewStateSummary = {
  chordSlug: string;
  stability: number;
  difficulty: number;
  retrievability: number;
  lapses: number;
  dueAt: Date;
};

export type RandomSource = {
  index(length: number): number;
  unit(): number;
};

export const cryptoRandomSource: RandomSource = {
  index(length) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % length;
  },
  unit() {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff;
  },
};

export function answerModeForTask(taskType: TrainingTaskType): AnswerMode {
  if (taskType === "chord_notes") return "note_set";
  if (taskType === "single_note") return "single_note";
  return "color_choice";
}

export function chooseRandomChordSlug(
  chordSlugs: readonly string[],
  previousChordSlug: string | undefined,
  random: RandomSource = cryptoRandomSource,
) {
  if (chordSlugs.length <= 1) return chordSlugs[0];

  const candidates = previousChordSlug
    ? chordSlugs.filter((slug) => slug !== previousChordSlug)
    : [...chordSlugs];

  return candidates[random.index(candidates.length)];
}

export function chooseAdaptiveChordSlug(input: {
  chordSlugs: readonly string[];
  previousChordSlug?: string;
  reviewStates: readonly ReviewStateSummary[];
  now?: Date;
  random?: RandomSource;
}) {
  if (input.chordSlugs.length <= 1) return input.chordSlugs[0];

  const now = input.now ?? new Date();
  const random = input.random ?? cryptoRandomSource;
  const stateBySlug = new Map(input.reviewStates.map((state) => [state.chordSlug, state]));
  const candidates = input.chordSlugs.filter((slug) => slug !== input.previousChordSlug);
  const scored = candidates.map((slug) => {
    const state = stateBySlug.get(slug);

    if (!state) {
      return { slug, score: 100 };
    }

    const overdueMs = Math.max(0, now.getTime() - state.dueAt.getTime());
    const overdueHours = overdueMs / 3_600_000;
    const retrievabilityGap = Math.max(0, 1 - state.retrievability);
    const difficultyWeight = state.difficulty / 10;
    const lapseWeight = Math.min(3, state.lapses) * 0.15;

    return {
      slug,
      score: 1 + overdueHours + retrievabilityGap * 3 + difficultyWeight * 2 + lapseWeight,
    };
  });
  const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
  let target = random.unit() * totalScore;

  for (const item of scored) {
    target -= item.score;
    if (target <= 0) return item.slug;
  }

  return scored[scored.length - 1]?.slug ?? chooseRandomChordSlug(input.chordSlugs, input.previousChordSlug, random);
}

export function createTrialPlanItem(input: {
  trialIndex: number;
  taskType: TrainingTaskType;
  promptChordSlug: string;
  isolatedToneNote?: string;
}): TrainingTrialPlanItem {
  return {
    trialIndex: input.trialIndex,
    taskType: input.taskType,
    answerMode: answerModeForTask(input.taskType),
    promptChordSlug: input.promptChordSlug,
    isolatedToneNote: input.isolatedToneNote,
  };
}

export function chooseNextTrialFromAttempt(input: {
  childProfileId: string;
  chordSlugs: readonly string[];
  selectionAlgorithm: ChordSelectionAlgorithm;
  taskType: TrainingTaskType;
  currentTrialIndex: number;
  currentPromptChordSlug: string;
  isCorrect: boolean;
  responseMs: number | null;
  totalTrials: number;
  chooseChordSlug: (args: {
    childProfileId: string;
    chordSlugs: readonly string[];
    selectionAlgorithm: ChordSelectionAlgorithm;
    previousChordSlug?: string;
  }) => string | Promise<string>;
  isolatedToneNoteForTask?: (args: {
    taskType: TrainingTaskType;
    promptChordSlug: string;
  }) => string | undefined;
}): Promise<TrainingTrialPlanItem | null> | TrainingTrialPlanItem | null {
  const nextTrialIndex = input.currentTrialIndex + 1;

  if (nextTrialIndex >= input.totalTrials) return null;

  const shouldReinforce =
    !input.isCorrect || (input.responseMs !== null && input.responseMs > SLOW_RESPONSE_MS);

  if (shouldReinforce) {
    return createTrialPlanItem({
      trialIndex: nextTrialIndex,
      taskType: input.taskType,
      promptChordSlug: input.currentPromptChordSlug,
      isolatedToneNote: input.isolatedToneNoteForTask?.({
        taskType: input.taskType,
        promptChordSlug: input.currentPromptChordSlug,
      }),
    });
  }

  return Promise.resolve(
    input.chooseChordSlug({
      childProfileId: input.childProfileId,
      chordSlugs: input.chordSlugs,
      selectionAlgorithm: input.selectionAlgorithm,
      previousChordSlug: input.currentPromptChordSlug,
    }),
  ).then((promptChordSlug) =>
    createTrialPlanItem({
      trialIndex: nextTrialIndex,
      taskType: input.taskType,
      promptChordSlug,
      isolatedToneNote: input.isolatedToneNoteForTask?.({
        taskType: input.taskType,
        promptChordSlug,
      }),
    }),
  );
}
