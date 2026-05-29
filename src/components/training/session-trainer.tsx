"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Music, Pause, Play, Save, Sparkles, Volume2, X } from "lucide-react";
import { playNotesChord, setDefaultSoundEngine, type SoundEngineKind } from "@/lib/training/audio";
import { DEFAULT_PROTOCOL_LEVELS, DEFAULT_PROTOCOL_VERSION, getActiveChordsForLevel } from "@/lib/training/protocol";
import type { AnswerMode, ChordSelectionAlgorithm, TrainingTaskType } from "@/lib/training/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ColorChoiceGrid, type ColorChoice } from "./color-choice-grid";
import { SessionSummary } from "./session-summary";

type HotkeyMode = "left" | "right";
type AccidentalMode = "sharps" | "flats";

const soundEngineOptions: { value: SoundEngineKind; label: string }[] = [
  { value: "tone", label: "Tone.js" },
  { value: "native-synth", label: "Native synth" },
  { value: "sampled", label: "Sampled piano" },
];

export type TrainingExercise = {
  id: string;
  prompt: string;
  taskType: TrainingTaskType;
  answerMode: AnswerMode;
  chord: {
    slug: string;
    toneNotes: string[];
  };
  choices: ColorChoice[];
  correctChoiceId: string;
  isolatedToneNote?: string;
};

type PracticeSessionResponse = {
  session?: {
    id?: string;
  totalTrials?: number;
  selectionAlgorithm?: ChordSelectionAlgorithm;
  trainingPhase?: TrainingTaskType;
  choices?: ColorChoice[];
    currentTrial?: PracticeTrialResponse;
    trials?: PracticeTrialResponse[];
  };
};

type PracticeAttemptResponse = {
  attempt?: {
    isCorrect?: boolean;
  };
  nextTrial?: PracticeTrialResponse | null;
};

type PracticeTrialResponse = {
  trialIndex: number;
  taskType?: TrainingTaskType;
  answerMode?: AnswerMode;
  promptChordSlug: string;
  prompt: string;
  toneNotes: string[];
  isolatedToneNote?: string;
  correctChoiceId: string;
};

type QueuedAttempt = {
  answer: {
    selectedChordSlug?: string;
    selectedNotes?: string[];
    selectedToneNote?: string;
  };
  responseMs: number;
  correctCount: number;
  index: number;
  sessionExercises: TrainingExercise[];
};

function colorClassForHex(hex: string) {
  return hex === "#f8fafc" ? "bg-slate-50" : "";
}

function exercisesForLevel(level: number): TrainingExercise[] {
  const chords = getActiveChordsForLevel(level);
  const choices = chords.map((chord) => ({
    id: chord.slug,
    label: chord.answerLabel,
    helper: chord.phase === "white-keys" ? "Color flag" : chord.notes.join(" "),
    colorHex: chord.colorHex,
    textClass: chord.textClass,
    colorAddKey: chord.colorAddKey,
    colorClass: colorClassForHex(chord.colorHex),
  }));

  return Array.from({ length: 20 }, (_, index) => {
    const chord = chords[index % chords.length];
    return {
      id: `${chord.slug}-${index}`,
      prompt: chord.phase === "white-keys" ? "Choose the color flag." : "Choose the chord name.",
      chord,
      choices,
      correctChoiceId: chord.slug,
      taskType: "chord_identification",
      answerMode: "color_choice",
    };
  });
}

function clampLevel(level: number | null | undefined) {
  return Math.max(1, level ?? 1);
}

function getIdFromResponse(data: unknown, keys: string[]) {
  if (!data || typeof data !== "object") return undefined;

  for (const key of keys) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }

  const session = (data as Record<string, unknown>).session;
  if (session && typeof session === "object") {
    const id = (session as Record<string, unknown>).id;
    if (typeof id === "string") return id;
  }

  return undefined;
}

function readTimerMs() {
  return performance.now();
}

function exerciseFromTrial(trial: PracticeTrialResponse, choices: ColorChoice[]): TrainingExercise {
  return {
    id: `${trial.promptChordSlug}-${trial.trialIndex}`,
    prompt: trial.prompt,
    taskType: trial.taskType ?? "chord_identification",
    answerMode: trial.answerMode ?? "color_choice",
    chord: {
      slug: trial.promptChordSlug,
      toneNotes: trial.toneNotes,
    },
    choices,
    correctChoiceId: trial.correctChoiceId,
    isolatedToneNote: trial.isolatedToneNote,
  };
}

const hotkeySets: Record<HotkeyMode, string[]> = {
  left: ["1", "2", "3", "4", "5", "q", "w", "e", "r", "t", "a", "s", "d", "f", "g"],
  right: ["6", "7", "8", "9", "0", "y", "u", "i", "o", "p", "h", "j", "k", "l", ";"],
};

const AUTO_NEXT_MS = 650;

const chromaticNoteChoices = [
  { value: "C", sharp: "C", flat: "C" },
  { value: "C#", sharp: "C♯", flat: "D♭" },
  { value: "D", sharp: "D", flat: "D" },
  { value: "D#", sharp: "D♯", flat: "E♭" },
  { value: "E", sharp: "E", flat: "E" },
  { value: "F", sharp: "F", flat: "F" },
  { value: "F#", sharp: "F♯", flat: "G♭" },
  { value: "G", sharp: "G", flat: "G" },
  { value: "G#", sharp: "G♯", flat: "A♭" },
  { value: "A", sharp: "A", flat: "A" },
  { value: "A#", sharp: "A♯", flat: "B♭" },
  { value: "B", sharp: "B", flat: "B" },
];

function noteLabel(note: (typeof chromaticNoteChoices)[number], accidentalMode: AccidentalMode) {
  return accidentalMode === "flats" ? note.flat : note.sharp;
}

function toneNoteForChoice(choice: string, isolatedToneNote?: string) {
  const octave = isolatedToneNote?.match(/\d+$/)?.[0] ?? "";
  return `${choice}${octave}`;
}

function pitchFromToneNote(toneNote?: string) {
  return toneNote?.replace(/-?\d+$/, "");
}

function NoteChoiceGrid({
  selectedNotes,
  disabled,
  accidentalMode,
  hotkeyLabels,
  onToggle,
}: {
  selectedNotes: string[];
  disabled?: boolean;
  accidentalMode: AccidentalMode;
  hotkeyLabels?: Record<string, string>;
  onToggle: (note: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {chromaticNoteChoices.map((note) => {
        const isSelected = selectedNotes.includes(note.value);
        const label = noteLabel(note, accidentalMode);

        return (
          <button
            key={note.value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onToggle(note.value)}
            className={[
              "relative min-h-24 rounded-3xl border-4 p-3 pb-8 text-center text-2xl font-black shadow-md transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed sm:min-h-28",
              isSelected
                ? "border-emerald-200 bg-emerald-100 text-emerald-900 ring-4 ring-emerald-200"
                : "border-white bg-white/75 text-slate-800 hover:-translate-y-1",
            ].join(" ")}
          >
            {label}
            {hotkeyLabels?.[note.value] ? (
              <span className="absolute bottom-3 right-3 rounded-full bg-white/75 px-2.5 py-1 text-xs font-black uppercase text-slate-600 ring-1 ring-white">
                {hotkeyLabels[note.value]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function SessionTrainer({
  childId,
  childName = "Mika",
  level = 2,
  showColorAccessibilityKeys = false,
  exercises,
  onComplete,
}: {
  childId: string;
  childName?: string;
  level?: number;
  showColorAccessibilityKeys?: boolean;
  exercises?: TrainingExercise[];
  onComplete?: (summary: { correct: number; total: number }) => void;
}) {
  const initialLevel = clampLevel(level);
  const [practiceLevel, setPracticeLevel] = useState(initialLevel);
  const [draftLevel, setDraftLevel] = useState(initialLevel);
  const previewExercises = useMemo(
    () => exercises ?? exercisesForLevel(practiceLevel),
    [exercises, practiceLevel],
  );
  const [activeExercises, setActiveExercises] = useState<TrainingExercise[]>();
  const [sessionTotalTrials, setSessionTotalTrials] = useState(previewExercises.length);
  const [pendingNextExercise, setPendingNextExercise] = useState<TrainingExercise | null>();
  const sessionExercises = activeExercises ?? previewExercises;
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [selectedToneNote, setSelectedToneNote] = useState<string>();
  const [answerIsCorrect, setAnswerIsCorrect] = useState<boolean>();
  const [isAutoNextPending, setIsAutoNextPending] = useState(false);
  const [nextButtonProgressKey, setNextButtonProgressKey] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [sessionStartedAt, setSessionStartedAt] = useState<number>();
  const [trialStartedAt, setTrialStartedAt] = useState<number>();
  const [pausedDurationMs, setPausedDurationMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState<number>();
  const [isPaused, setIsPaused] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [hotkeyMode, setHotkeyMode] = useState<HotkeyMode>("left");
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>("sharps");
  const [selectionAlgorithm, setSelectionAlgorithm] = useState<ChordSelectionAlgorithm>("random");
  const [soundEngine, setSoundEngine] = useState<SoundEngineKind>("tone");
  const [showColorKeys, setShowColorKeys] = useState(showColorAccessibilityKeys);
  const [isSavingColorKeys, setIsSavingColorKeys] = useState(false);
  const [error, setError] = useState<string>();
  const [levelMessage, setLevelMessage] = useState<string>();
  const [settingsToast, setSettingsToast] = useState<string>();
  const [summary, setSummary] = useState<{ correct: number; total: number; minutes: number }>();
  const selectChoiceRef = useRef<(choice: ColorChoice) => void>(() => undefined);
  const nextRef = useRef<() => void>(() => undefined);
  const autoNextTimeoutRef = useRef<number | undefined>(undefined);
  const queuedAttemptRef = useRef<QueuedAttempt | undefined>(undefined);
  const settingsToastTimeoutRef = useRef<number | undefined>(undefined);

  const current = sessionExercises[index];
  const total = sessionId ? sessionTotalTrials : sessionExercises.length;
  const isCorrect = Boolean(answerIsCorrect);
  const answered = answerIsCorrect !== undefined;
  const answerLocked = answered || isAutoNextPending || isSubmittingAttempt;
  const progress = useMemo(() => (total ? Math.round(((index + Number(answered)) / total) * 100) : 0), [answered, index, total]);
  const hotkeyLabels = useMemo(() => {
    const keys = hotkeySets[hotkeyMode];
    if (current?.answerMode === "note_set" || current?.answerMode === "single_note") {
      return Object.fromEntries(chromaticNoteChoices.map((choice, choiceIndex) => [choice.value, keys[choiceIndex] ?? ""]));
    }

    return Object.fromEntries((current?.choices ?? []).map((choice, choiceIndex) => [choice.id, keys[choiceIndex] ?? ""]));
  }, [current, hotkeyMode]);

  useEffect(() => {
    setDefaultSoundEngine(soundEngine);
  }, [soundEngine]);

  async function playExercise(exercise = current) {
    if (!exercise) return;

    setIsPlaying(true);
    try {
      await playNotesChord({ notes: exercise.chord.toneNotes });
    } finally {
      setIsPlaying(false);
    }
  }

  function showSettingsToast() {
    if (settingsToastTimeoutRef.current) {
      window.clearTimeout(settingsToastTimeoutRef.current);
    }

    setSettingsToast(`${childName}'s practice session settings updated`);
    settingsToastTimeoutRef.current = window.setTimeout(() => {
      setSettingsToast(undefined);
      settingsToastTimeoutRef.current = undefined;
    }, 2400);
  }

  async function handlePlay() {
    await playExercise();
  }

  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current) {
        window.clearTimeout(autoNextTimeoutRef.current);
      }
      queuedAttemptRef.current = undefined;
      if (settingsToastTimeoutRef.current) {
        window.clearTimeout(settingsToastTimeoutRef.current);
      }
    };
  }, []);

  function clearAnswerState() {
    setSelectedId(undefined);
    setSelectedNotes([]);
    setSelectedToneNote(undefined);
    setAnswerIsCorrect(undefined);
    setIsAutoNextPending(false);
  }

  async function handleBegin() {
    setError(undefined);
    setIsStarting(true);

    try {
      const response = await fetch(`/api/children/${childId}/practice-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: practiceLevel,
          selectionAlgorithm,
          protocolVersion: DEFAULT_PROTOCOL_VERSION,
          plannedTrials: sessionExercises.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to start session");
      }

      const data = (await response.json()) as PracticeSessionResponse;
      const nextSessionId = getIdFromResponse(data, ["id", "sessionId"]);
      const nextChoices = data.session?.choices;
      const nextTrial = data.session?.currentTrial ?? data.session?.trials?.[0];
      const nextTotalTrials = data.session?.totalTrials;

      if (!nextSessionId || !nextChoices?.length || !nextTrial || !nextTotalTrials) {
        throw new Error("Missing session plan");
      }

      const nextExercise = exerciseFromTrial(nextTrial, nextChoices);
      const now = readTimerMs();
      setSessionId(nextSessionId);
      setActiveExercises([nextExercise]);
      setSessionTotalTrials(nextTotalTrials);
      setPendingNextExercise(undefined);
      setSessionStartedAt(now);
      setTrialStartedAt(now);
      setPausedDurationMs(0);
      setPauseStartedAt(undefined);
      setIsPaused(false);
      setIndex(0);
      clearAnswerState();
      setCorrectCount(0);
      setSummary(undefined);
      void playExercise(nextExercise);
    } catch {
      setError("We could not begin this practice session.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleComplete(nextCorrectCount: number) {
    if (!sessionId) return;

    setError(undefined);
    setIsCompleting(true);

    try {
      const completedAt = readTimerMs();
      const durationMs = Math.max(0, Math.round(completedAt - (sessionStartedAt ?? completedAt) - pausedDurationMs));
      const response = await fetch(`/api/practice-sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctTrials: nextCorrectCount,
          totalTrials: total,
          durationMs,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to complete session");
      }

      setSummary({
        correct: nextCorrectCount,
        total,
        minutes: Math.max(1, Math.round(durationMs / 60000)),
      });
    } catch {
      setError("We could not save the completed session.");
    } finally {
      setIsCompleting(false);
    }
  }

  async function advanceAfterAnswer(
    answerWasCorrect: boolean,
    issuedNextExercise = pendingNextExercise,
    snapshot?: {
      correctCount: number;
      index: number;
      sessionExercises: TrainingExercise[];
    },
  ) {
    const baseCorrectCount = snapshot?.correctCount ?? correctCount;
    const baseIndex = snapshot?.index ?? index;
    const baseExercises = snapshot?.sessionExercises ?? sessionExercises;
    const nextCorrectCount = baseCorrectCount + Number(answerWasCorrect);
    const nextIndex = baseIndex + 1;
    const nextExercise = issuedNextExercise ?? baseExercises[nextIndex];

    if (!nextExercise) {
      await handleComplete(nextCorrectCount);
      onComplete?.({ correct: nextCorrectCount, total });
      return;
    }

    setCorrectCount(nextCorrectCount);
    clearAnswerState();
    setPendingNextExercise(undefined);
    setActiveExercises((currentExercises) => {
      if (!currentExercises || currentExercises[nextIndex]) return currentExercises;
      return [...currentExercises, nextExercise];
    });
    setIndex(nextIndex);
    setTrialStartedAt(readTimerMs());

    if (nextExercise && !isPaused) {
      void playExercise(nextExercise);
    }
  }

  async function saveQueuedAttempt(queuedAttempt: QueuedAttempt, shouldAdvanceOnReply: boolean) {
    if (!current || !sessionId || isPaused || isSubmittingAttempt) return;

    setError(undefined);
    setIsSubmittingAttempt(true);

    try {
      let nextExercise: TrainingExercise | null = null;
      const response = await fetch(`/api/practice-sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trialIndex: queuedAttempt.index,
          chordSlug: current.chord.slug,
          selectedChordSlug: queuedAttempt.answer.selectedChordSlug,
          selectedNotes: queuedAttempt.answer.selectedNotes,
          selectedToneNote: queuedAttempt.answer.selectedToneNote,
          responseMs: queuedAttempt.responseMs,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save attempt");
      }

      const data = (await response.json()) as PracticeAttemptResponse;
      nextExercise = data.nextTrial ? exerciseFromTrial(data.nextTrial, current.choices) : null;
      const nextIsCorrect = Boolean(data.attempt?.isCorrect);
      setAnswerIsCorrect(nextIsCorrect);
      setPendingNextExercise(nextExercise);
      queuedAttemptRef.current = undefined;
      setIsAutoNextPending(false);

      if (shouldAdvanceOnReply) {
        await advanceAfterAnswer(nextIsCorrect, nextExercise, {
          correctCount: queuedAttempt.correctCount,
          index: queuedAttempt.index,
          sessionExercises: queuedAttempt.sessionExercises,
        });
      }
    } catch {
      queuedAttemptRef.current = undefined;
      setIsAutoNextPending(false);
      setError("We could not save that answer. You can keep practicing, but this trial may need to be retried.");
    } finally {
      setIsSubmittingAttempt(false);
    }
  }

  function queueAttempt(answer: { selectedChordSlug?: string; selectedNotes?: string[]; selectedToneNote?: string }) {
    if (!current || answerLocked || !sessionId || isPaused) return;

    const answeredAt = readTimerMs();
    const responseMs = Math.max(0, Math.round(answeredAt - (trialStartedAt ?? answeredAt)));
    const queuedAttempt: QueuedAttempt = {
      answer,
      responseMs,
      correctCount,
      index,
      sessionExercises,
    };

    queuedAttemptRef.current = queuedAttempt;
    setError(undefined);

    if (answer.selectedChordSlug) {
      setAnswerIsCorrect(answer.selectedChordSlug === current.correctChoiceId);
    }

    if (!autoNext) {
      void saveQueuedAttempt(queuedAttempt, false);
      return;
    }

    setIsAutoNextPending(true);
    setNextButtonProgressKey((value) => value + 1);
    autoNextTimeoutRef.current = window.setTimeout(() => {
      const nextQueuedAttempt = queuedAttemptRef.current;
      autoNextTimeoutRef.current = undefined;

      if (!nextQueuedAttempt) return;

      void saveQueuedAttempt(nextQueuedAttempt, true);
    }, AUTO_NEXT_MS);
  }

  async function handleSelect(choice: ColorChoice) {
    setSelectedId(choice.id);
    queueAttempt({ selectedChordSlug: choice.id });
  }

  async function handleNoteSetSubmit() {
    if (!selectedNotes.length) return;
    queueAttempt({ selectedNotes });
  }

  async function handleToneNoteSelect(note: string) {
    const toneNote = toneNoteForChoice(note, current?.isolatedToneNote);
    setSelectedToneNote(toneNote);
    queueAttempt({ selectedToneNote: toneNote });
  }

  function toggleSelectedNote(note: string) {
    if (answerLocked) return;

    setSelectedNotes((notes) => {
      if (notes.includes(note)) return notes.filter((selectedNote) => selectedNote !== note);
      if (notes.length >= 5) return notes;
      return [...notes, note];
    });
  }

  useEffect(() => {
    selectChoiceRef.current = (choice: ColorChoice) => {
      void handleSelect(choice);
    };
  });

  useEffect(() => {
    nextRef.current = () => {
      void handleNext();
    };
  });

  async function handleNext() {
    const queuedAttempt = queuedAttemptRef.current;

    if (autoNextTimeoutRef.current) {
      window.clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = undefined;
    }

    if (queuedAttempt) {
      await saveQueuedAttempt(queuedAttempt, true);
      return;
    }

    queuedAttemptRef.current = undefined;
    setIsAutoNextPending(false);

    await advanceAfterAnswer(isCorrect);
  }

  function handleReset() {
    if (autoNextTimeoutRef.current) {
      window.clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = undefined;
    }
    queuedAttemptRef.current = undefined;
    setIsAutoNextPending(false);

    setSessionId(undefined);
    setSessionStartedAt(undefined);
    setTrialStartedAt(undefined);
    setPausedDurationMs(0);
    setPauseStartedAt(undefined);
    setIsPaused(false);
    setIsSettingsOpen(false);
    setActiveExercises(undefined);
    setSessionTotalTrials(previewExercises.length);
    setPendingNextExercise(undefined);
    setIndex(0);
    clearAnswerState();
    setCorrectCount(0);
    setError(undefined);
    setSummary(undefined);
  }

  function handlePause() {
    if (!sessionId || isPaused) return;

    setIsPaused(true);
    setPauseStartedAt(readTimerMs());
    setIsSettingsOpen(true);

    if (autoNextTimeoutRef.current) {
      window.clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = undefined;
    }
    queuedAttemptRef.current = undefined;
    setIsAutoNextPending(false);
  }

  function handleResume() {
    if (!isPaused) return;

    const now = readTimerMs();
    const pausedMs = Math.max(0, now - (pauseStartedAt ?? now));

    setPausedDurationMs((value) => value + pausedMs);
    setTrialStartedAt((value) => (value ? value + pausedMs : value));
    setPauseStartedAt(undefined);
    setIsPaused(false);
    setIsSettingsOpen(false);
  }

  async function handleSaveLevel() {
    const nextLevel = clampLevel(draftLevel);

    setLevelMessage(undefined);
    setError(undefined);
    setIsSavingLevel(true);

    try {
      const response = await fetch(`/api/children/${childId}/level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: nextLevel }),
      });

      if (!response.ok) {
        throw new Error("Unable to save level");
      }

      setPracticeLevel(nextLevel);
      setDraftLevel(nextLevel);
      handleReset();
      setLevelMessage("Level saved.");
      showSettingsToast();
      setIsSettingsOpen(false);
    } catch {
      setError("We could not save the selected level.");
    } finally {
      setIsSavingLevel(false);
    }
  }

  async function handleColorKeyToggle(nextValue: boolean) {
    setShowColorKeys(nextValue);
    setIsSavingColorKeys(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showColorAccessibilityKeys: nextValue }),
      });

      if (!response.ok) {
        throw new Error("Unable to save color key preference");
      }

      showSettingsToast();
    } catch {
      setShowColorKeys(!nextValue);
      setError("We could not save the color key setting.");
    } finally {
      setIsSavingColorKeys(false);
    }
  }

  useEffect(() => {
    if (!sessionId || !current || isPaused || isSubmittingAttempt || isAutoNextPending) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target?.closest("input, select, textarea, button")) return;

      const key = event.key.toLowerCase();

      if (answered) {
        if (event.code !== "Space" && key !== " ") return;
        event.preventDefault();
        nextRef.current();
        return;
      }

      const choiceIndex = hotkeySets[hotkeyMode].indexOf(key);

      if (current.answerMode === "note_set") {
        const note = chromaticNoteChoices[choiceIndex]?.value;
        if (!note) return;
        event.preventDefault();
        toggleSelectedNote(note);
        return;
      }

      if (current.answerMode === "single_note") {
        const note = chromaticNoteChoices[choiceIndex]?.value;
        if (!note) return;
        event.preventDefault();
        void handleToneNoteSelect(note);
        return;
      }

      const choice = current.choices[choiceIndex];
      if (!choice) return;

      event.preventDefault();
      selectChoiceRef.current(choice);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!current) {
    return (
      <Card className="bg-sky-50">
        <CardTitle>No training cards yet</CardTitle>
        <CardDescription>Add a few chords to start a playful practice session.</CardDescription>
      </Card>
    );
  }

  if (summary) {
    return (
      <div className="space-y-4">
        <SessionSummary
          childName={childName}
          correct={summary.correct}
          total={summary.total}
          minutes={summary.minutes}
          streak={1}
        />
        <Button size="lg" onClick={handleReset}>
          Practice again
        </Button>
      </div>
    );
  }

  const settingsToastElement = settingsToast ? (
    <div
      className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white shadow-xl"
      role="status"
      aria-live="polite"
    >
      {settingsToast}
    </div>
  ) : null;

  const settingsSheet = (
    <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <SheetContent onClose={() => setIsSettingsOpen(false)}>
        <SheetHeader>
          <SheetTitle>{isPaused ? "Practice paused" : "Practice settings"}</SheetTitle>
          <SheetDescription>
            {sessionId ? "Adjust practice options, then resume when ready." : "Choose the learner level before starting a session."}
          </SheetDescription>
        </SheetHeader>

        {isPaused ? (
          <Button size="lg" onClick={handleResume}>
            <Play className="size-5" aria-hidden="true" />
            Resume
          </Button>
        ) : null}

        <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-sky-50 px-4 py-3 text-base font-black text-slate-900">
          Auto-next
          <input
            type="checkbox"
            checked={autoNext}
            onChange={(event) => {
              setAutoNext(event.target.checked);
              showSettingsToast();
            }}
            className="size-6 accent-emerald-500"
          />
        </label>

        <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-emerald-50 px-4 py-3 text-base font-black text-slate-900">
          Color keys
          <input
            type="checkbox"
            checked={showColorKeys}
            disabled={isSavingColorKeys}
            onChange={(event) => void handleColorKeyToggle(event.target.checked)}
            className="size-6 accent-emerald-500"
          />
        </label>

        <div className="space-y-3">
          <Label>Chord order</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectionAlgorithm === "random" ? "secondary" : "ghost"}
              onClick={() => {
                if (selectionAlgorithm !== "random") {
                  setSelectionAlgorithm("random");
                  showSettingsToast();
                }
              }}
              disabled={Boolean(sessionId)}
            >
              Random
            </Button>
            <Button
              variant={selectionAlgorithm === "adaptive" ? "secondary" : "ghost"}
              onClick={() => {
                if (selectionAlgorithm !== "adaptive") {
                  setSelectionAlgorithm("adaptive");
                  showSettingsToast();
                }
              }}
              disabled={Boolean(sessionId)}
            >
              Adaptive
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Keyboard side</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={hotkeyMode === "left" ? "secondary" : "ghost"}
              onClick={() => {
                if (hotkeyMode !== "left") {
                  setHotkeyMode("left");
                  showSettingsToast();
                }
              }}
            >
              Left hand
            </Button>
            <Button
              variant={hotkeyMode === "right" ? "secondary" : "ghost"}
              onClick={() => {
                if (hotkeyMode !== "right") {
                  setHotkeyMode("right");
                  showSettingsToast();
                }
              }}
            >
              Right hand
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Note names</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={accidentalMode === "sharps" ? "secondary" : "ghost"}
              onClick={() => {
                if (accidentalMode !== "sharps") {
                  setAccidentalMode("sharps");
                  showSettingsToast();
                }
              }}
            >
              Sharps
            </Button>
            <Button
              variant={accidentalMode === "flats" ? "secondary" : "ghost"}
              onClick={() => {
                if (accidentalMode !== "flats") {
                  setAccidentalMode("flats");
                  showSettingsToast();
                }
              }}
            >
              Flats
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="sound-engine">Sound</Label>
          <select
            id="sound-engine"
            value={soundEngine}
            onChange={(event) => {
              const nextSoundEngine = event.target.value as SoundEngineKind;
              if (nextSoundEngine !== soundEngine) {
                setSoundEngine(nextSoundEngine);
                showSettingsToast();
              }
            }}
            className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          >
            {soundEngineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="practice-level">Level</Label>
          <select
            id="practice-level"
            value={draftLevel}
            disabled={Boolean(sessionId)}
            onChange={(event) => setDraftLevel(clampLevel(Number(event.target.value)))}
            className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
          >
            {DEFAULT_PROTOCOL_LEVELS.map((protocolLevel) => (
              <option key={protocolLevel.level} value={protocolLevel.level}>
                Level {protocolLevel.level}
              </option>
            ))}
          </select>
        </div>

        {!sessionId ? (
          <Button onClick={handleSaveLevel} disabled={isSavingLevel}>
            <Save className="size-5" aria-hidden="true" />
            {isSavingLevel ? "Saving" : "Save level"}
          </Button>
        ) : null}
      </SheetContent>
    </Sheet>
  );

  if (sessionId) {
    return (
      <div
        className={[
          "fixed inset-0 z-40 min-h-[100svh] w-screen overflow-y-auto px-4 pb-6 pt-8 transition-colors sm:px-6",
          isPaused ? "bg-amber-50" : "bg-sky-50",
        ].join(" ")}
      >
        <div className="absolute inset-x-0 top-0 h-3 bg-white/70">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-emerald-300 via-sky-300 to-pink-300 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-5xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button size="icon" variant="ghost" aria-label={isPaused ? "Resume practice" : "Pause practice"} onClick={isPaused ? handleResume : handlePause}>
              {isPaused ? <Play className="size-6" aria-hidden="true" /> : <Pause className="size-6" aria-hidden="true" />}
            </Button>
            <div className="text-center text-sm font-black text-slate-600">
              Trial {index + 1} of {total}
            </div>
            <Button size="icon" variant="ghost" aria-label="Stop practice session" onClick={handleReset}>
              <X className="size-8" aria-hidden="true" />
            </Button>
          </div>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          {isPaused ? (
            <div className="grid flex-1 place-items-center rounded-3xl bg-white/45 p-6 text-center ring-2 ring-white/80">
              <div>
                <div className="text-4xl font-black text-slate-900 sm:text-5xl">Paused</div>
                <div className="mt-3 text-base font-bold text-slate-600">Options are open.</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="pink">Level {practiceLevel}</Badge>
                <Button size="lg" onClick={handlePlay} disabled={isPlaying}>
                  <Volume2 className="h-6 w-6" aria-hidden="true" />
                  {isPlaying ? "Playing" : "Play chord"}
                </Button>
              </div>

              <div className="min-h-16 rounded-3xl bg-white/65 p-4 text-lg font-black text-slate-800 ring-2 ring-white">
                {!answerLocked ? current.prompt : null}
                {answered && isCorrect ? (
                  <span className="inline-flex items-center gap-2 text-emerald-700">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                    Nice listening.
                  </span>
                ) : null}
                {answered && !isCorrect ? "Good try. Listen again." : null}
              </div>

              {current.answerMode === "note_set" ? (
                <div className="space-y-4">
                  <NoteChoiceGrid
                    selectedNotes={selectedNotes}
                    disabled={answerLocked}
                    accidentalMode={accidentalMode}
                    hotkeyLabels={hotkeyLabels}
                    onToggle={toggleSelectedNote}
                  />
                  {!answerLocked ? (
                    <Button
                      size="lg"
                      disabled={!selectedNotes.length || answerLocked}
                      onClick={handleNoteSetSubmit}
                      className="w-full sm:w-auto sm:self-center"
                    >
                      Check notes
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {current.answerMode === "single_note" ? (
                <NoteChoiceGrid
                  selectedNotes={selectedToneNote ? [pitchFromToneNote(selectedToneNote) ?? ""] : []}
                  disabled={answerLocked}
                  accidentalMode={accidentalMode}
                  hotkeyLabels={hotkeyLabels}
                  onToggle={handleToneNoteSelect}
                />
              ) : null}

              {current.answerMode === "color_choice" ? (
                <ColorChoiceGrid
                  choices={current.choices}
                  selectedId={selectedId}
                  correctId={answered ? current.correctChoiceId : undefined}
                  incorrectId={answered && !isCorrect ? selectedId : undefined}
                  disabled={answerLocked}
                  hotkeyLabels={hotkeyLabels}
                  showColorAddKeys={showColorKeys}
                  onSelect={handleSelect}
                />
              ) : null}

              {answerLocked || !autoNext ? (
                <div className="relative mt-auto w-full pb-2 sm:w-auto sm:self-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled={(!answered && !queuedAttemptRef.current) || isSubmittingAttempt || isCompleting}
                    onClick={handleNext}
                    className="relative z-10 w-full shadow-none sm:w-auto"
                  >
                    <span>{index >= total - 1 ? "Finish" : "Next chord"}</span>
                  </Button>
                  <span className="absolute inset-x-0 bottom-0 h-2 rounded-b-2xl bg-amber-600" aria-hidden="true">
                    {autoNext && answerLocked ? (
                      <span
                        key={nextButtonProgressKey}
                        className="next-chord-button-progress block h-full rounded-b-2xl bg-emerald-600"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {settingsSheet}
        {settingsToastElement}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <CardHeader>
        <div>
          <Badge tone="pink">Level {practiceLevel}</Badge>
          <CardTitle className="mt-3">Practice room</CardTitle>
          <CardDescription>{`${childName} can begin when the room is quiet.`}</CardDescription>
        </div>
        <Button size="icon" variant="ghost" aria-label="Open practice settings" onClick={() => setIsSettingsOpen(true)}>
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </CardHeader>

      <div className="space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {levelMessage ? <Alert tone="success">{levelMessage}</Alert> : null}

        <div className="rounded-3xl bg-white/80 p-5 ring-2 ring-white">
          <div className="mb-4 flex items-center gap-3 text-slate-800">
            <Music className="size-8 text-pink-500" aria-hidden="true" />
            <div>
              <div className="text-lg font-black">Ready for {total} short trials</div>
              <div className="text-sm font-bold text-slate-500">Only level {practiceLevel} choices will appear.</div>
            </div>
          </div>
          <Button size="lg" onClick={handleBegin} disabled={isStarting}>
            {isStarting ? "Starting" : "Begin"}
          </Button>
        </div>
      </div>

      {settingsSheet}
      {settingsToastElement}
    </Card>
  );
}
