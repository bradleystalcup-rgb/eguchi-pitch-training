import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseAdaptiveChordSlug,
  chooseNextTrialFromAttempt,
  chooseRandomChordSlug,
} from "../../src/lib/training/scheduler";
import { getActiveChordsForLevel } from "../../src/lib/training/protocol";

test("protocol levels start with two colors and add one per level", () => {
  assert.equal(getActiveChordsForLevel(1).length, 2);
  assert.equal(getActiveChordsForLevel(2).length, 3);
  assert.equal(getActiveChordsForLevel(3).length, 4);
});

test("random selection avoids the previous chord when possible", () => {
  const selected = chooseRandomChordSlug(["red", "yellow", "blue"], "yellow", {
    index: () => 0,
    unit: () => 0,
  });

  assert.equal(selected, "red");
});

test("adaptive selection prioritizes unseen chords", () => {
  const selected = chooseAdaptiveChordSlug({
    chordSlugs: ["red", "yellow", "blue"],
    reviewStates: [
      {
        chordSlug: "red",
        stability: 8,
        difficulty: 1,
        retrievability: 1,
        lapses: 0,
        dueAt: new Date("2026-05-28T00:00:00Z"),
      },
      {
        chordSlug: "yellow",
        stability: 8,
        difficulty: 1,
        retrievability: 1,
        lapses: 0,
        dueAt: new Date("2026-05-28T00:00:00Z"),
      },
    ],
    now: new Date("2026-05-27T00:00:00Z"),
    random: {
      index: () => 0,
      unit: () => 0.95,
    },
  });

  assert.equal(selected, "blue");
});

test("next trial reinforces incorrect answers", async () => {
  const nextTrial = await chooseNextTrialFromAttempt({
    childProfileId: "child",
    chordSlugs: ["red", "yellow"],
    selectionAlgorithm: "random",
    taskType: "chord_identification",
    currentTrialIndex: 2,
    currentPromptChordSlug: "red",
    isCorrect: false,
    responseMs: 1_000,
    totalTrials: 20,
    chooseChordSlug: () => "yellow",
  });

  assert.deepEqual(nextTrial, {
    trialIndex: 3,
    taskType: "chord_identification",
    answerMode: "color_choice",
    promptChordSlug: "red",
    isolatedToneNote: undefined,
  });
});

test("next trial reinforces slow correct answers", async () => {
  const nextTrial = await chooseNextTrialFromAttempt({
    childProfileId: "child",
    chordSlugs: ["red", "yellow"],
    selectionAlgorithm: "random",
    taskType: "chord_identification",
    currentTrialIndex: 2,
    currentPromptChordSlug: "red",
    isCorrect: true,
    responseMs: 6_001,
    totalTrials: 20,
    chooseChordSlug: () => "yellow",
  });

  assert.equal(nextTrial?.promptChordSlug, "red");
});

test("next trial delegates fluent correct answers to the selected algorithm", async () => {
  const nextTrial = await chooseNextTrialFromAttempt({
    childProfileId: "child",
    chordSlugs: ["red", "yellow"],
    selectionAlgorithm: "adaptive",
    taskType: "chord_identification",
    currentTrialIndex: 2,
    currentPromptChordSlug: "red",
    isCorrect: true,
    responseMs: 1_500,
    totalTrials: 20,
    chooseChordSlug: ({ selectionAlgorithm, previousChordSlug }) => {
      assert.equal(selectionAlgorithm, "adaptive");
      assert.equal(previousChordSlug, "red");
      return "yellow";
    },
  });

  assert.equal(nextTrial?.promptChordSlug, "yellow");
});

test("final answered trial returns no next trial", async () => {
  const nextTrial = await chooseNextTrialFromAttempt({
    childProfileId: "child",
    chordSlugs: ["red", "yellow"],
    selectionAlgorithm: "random",
    taskType: "chord_identification",
    currentTrialIndex: 19,
    currentPromptChordSlug: "red",
    isCorrect: true,
    responseMs: 1_500,
    totalTrials: 20,
    chooseChordSlug: () => "yellow",
  });

  assert.equal(nextTrial, null);
});

test("single note trials carry single-note answer metadata", async () => {
  const nextTrial = await chooseNextTrialFromAttempt({
    childProfileId: "child",
    chordSlugs: ["red", "yellow"],
    selectionAlgorithm: "random",
    taskType: "single_note",
    currentTrialIndex: 0,
    currentPromptChordSlug: "red",
    isCorrect: true,
    responseMs: 1_500,
    totalTrials: 20,
    chooseChordSlug: () => "yellow",
    isolatedToneNoteForTask: () => "C5",
  });

  assert.equal(nextTrial?.answerMode, "single_note");
  assert.equal(nextTrial?.isolatedToneNote, "C5");
});
