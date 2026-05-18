"use client";

import { useMemo, useState } from "react";
import { Menu, Music, RotateCcw, Save, Sparkles, Volume2 } from "lucide-react";
import { playNotesChord } from "@/lib/training/audio";
import { DEFAULT_PROTOCOL_LEVELS, DEFAULT_PROTOCOL_VERSION, getActiveChordsForLevel } from "@/lib/training/protocol";
import type { ProtocolChord } from "@/lib/training/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ColorChoiceGrid, type ColorChoice } from "./color-choice-grid";
import { SessionSummary } from "./session-summary";

export type TrainingExercise = {
  id: string;
  prompt: string;
  chord: ProtocolChord;
  choices: ColorChoice[];
  correctChoiceId: string;
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
    };
  });
}

function clampLevel(level: number | null | undefined) {
  return Math.max(2, level ?? 2);
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

export function SessionTrainer({
  childId,
  childName = "Mika",
  level = 2,
  exercises,
  onComplete,
}: {
  childId: string;
  childName?: string;
  level?: number;
  exercises?: TrainingExercise[];
  onComplete?: (summary: { correct: number; total: number }) => void;
}) {
  const initialLevel = clampLevel(level);
  const [practiceLevel, setPracticeLevel] = useState(initialLevel);
  const [draftLevel, setDraftLevel] = useState(initialLevel);
  const sessionExercises = useMemo(
    () => exercises ?? exercisesForLevel(practiceLevel),
    [exercises, practiceLevel],
  );
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [sessionStartedAt, setSessionStartedAt] = useState<number>();
  const [trialStartedAt, setTrialStartedAt] = useState<number>();
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [error, setError] = useState<string>();
  const [levelMessage, setLevelMessage] = useState<string>();
  const [summary, setSummary] = useState<{ correct: number; total: number; minutes: number }>();

  const current = sessionExercises[index];
  const total = sessionExercises.length;
  const isCorrect = selectedId === current?.correctChoiceId;
  const answered = Boolean(selectedId);
  const progress = useMemo(() => Math.round(((index + Number(answered)) / total) * 100), [answered, index, total]);

  async function handlePlay() {
    if (!current) return;

    setIsPlaying(true);
    try {
      await playNotesChord({ notes: current.chord.toneNotes });
    } finally {
      window.setTimeout(() => setIsPlaying(false), 500);
    }
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
          protocolVersion: DEFAULT_PROTOCOL_VERSION,
          plannedTrials: sessionExercises.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to start session");
      }

      const data = (await response.json()) as unknown;
      const nextSessionId = getIdFromResponse(data, ["id", "sessionId"]);

      if (!nextSessionId) {
        throw new Error("Missing session id");
      }

      const now = readTimerMs();
      setSessionId(nextSessionId);
      setSessionStartedAt(now);
      setTrialStartedAt(now);
      setIndex(0);
      setSelectedId(undefined);
      setCorrectCount(0);
      setSummary(undefined);
    } catch {
      setError("We could not begin this practice session.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSelect(choice: ColorChoice) {
    if (!current || selectedId || !sessionId || isSubmittingAttempt) return;

    const answeredAt = readTimerMs();
    const responseMs = Math.max(0, Math.round(answeredAt - (trialStartedAt ?? answeredAt)));
    const nextIsCorrect = choice.id === current.correctChoiceId;

    setSelectedId(choice.id);
    setError(undefined);
    setIsSubmittingAttempt(true);

    try {
      const response = await fetch(`/api/practice-sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trialIndex: index,
          chordSlug: current.chord.slug,
          selectedChoiceId: choice.id,
          correctChoiceId: current.correctChoiceId,
          isCorrect: nextIsCorrect,
          responseMs,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save attempt");
      }
    } catch {
      setError("We could not save that answer. You can keep practicing, but this trial may need to be retried.");
    } finally {
      setIsSubmittingAttempt(false);
    }
  }

  async function handleNext() {
    const nextCorrectCount = correctCount + Number(isCorrect);

    if (index >= total - 1) {
      await handleComplete(nextCorrectCount);
      onComplete?.({ correct: nextCorrectCount, total });
      return;
    }

    setCorrectCount(nextCorrectCount);
    setSelectedId(undefined);
    setIndex((value) => value + 1);
    setTrialStartedAt(readTimerMs());
  }

  async function handleComplete(nextCorrectCount: number) {
    if (!sessionId) return;

    setError(undefined);
    setIsCompleting(true);

    try {
      const completedAt = readTimerMs();
      const durationMs = Math.max(0, Math.round(completedAt - (sessionStartedAt ?? completedAt)));
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

  function handleReset() {
    setSessionId(undefined);
    setSessionStartedAt(undefined);
    setTrialStartedAt(undefined);
    setIndex(0);
    setSelectedId(undefined);
    setCorrectCount(0);
    setError(undefined);
    setSummary(undefined);
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
      setIsSettingsOpen(false);
    } catch {
      setError("We could not save the selected level.");
    } finally {
      setIsSavingLevel(false);
    }
  }

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

  return (
    <Card className="bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <CardHeader>
        <div>
          <Badge tone="pink">Level {practiceLevel}</Badge>
          <CardTitle className="mt-3">Practice room</CardTitle>
          <CardDescription>{sessionId ? current.prompt : `${childName} can begin when the room is quiet.`}</CardDescription>
        </div>
        <Button size="icon" variant="ghost" aria-label="Open practice settings" onClick={() => setIsSettingsOpen(true)}>
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </CardHeader>

      <div className="space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {levelMessage ? <Alert tone="success">{levelMessage}</Alert> : null}

        {!sessionId ? (
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
        ) : (
          <>
            <Progress value={progress} label={`Trial ${index + 1} of ${total}`} />

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={handlePlay} disabled={isPlaying}>
                <Volume2 className="h-6 w-6" aria-hidden="true" />
                {isPlaying ? "Playing" : "Play chord"}
              </Button>
              <Button variant="ghost" size="lg" onClick={handleReset}>
                <RotateCcw className="h-6 w-6" aria-hidden="true" />
                Start over
              </Button>
            </div>

            <ColorChoiceGrid
              choices={current.choices}
              selectedId={selectedId}
              correctId={answered ? current.correctChoiceId : undefined}
              disabled={answered || isSubmittingAttempt}
              onSelect={handleSelect}
            />

            <div className="min-h-16 rounded-3xl bg-white/80 p-4 text-lg font-black text-slate-800 ring-2 ring-white">
              {!answered ? "Tap an available color after you listen." : null}
              {answered && isCorrect ? (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <Sparkles className="h-6 w-6" aria-hidden="true" />
                  Nice listening. That chord feels right.
                </span>
              ) : null}
              {answered && !isCorrect ? "Good try. Listen again and remember the color." : null}
            </div>

            <Button size="lg" variant="secondary" disabled={!answered || isSubmittingAttempt || isCompleting} onClick={handleNext}>
              {index >= total - 1 ? "Finish" : "Next chord"}
            </Button>
          </>
        )}
      </div>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent onClose={() => setIsSettingsOpen(false)}>
          <SheetHeader>
            <SheetTitle>Practice settings</SheetTitle>
            <SheetDescription>Choose the learner level before starting a session.</SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            <Label htmlFor="practice-level">Level</Label>
            <select
              id="practice-level"
              value={draftLevel}
              onChange={(event) => setDraftLevel(clampLevel(Number(event.target.value)))}
              className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              {DEFAULT_PROTOCOL_LEVELS.filter((protocolLevel) => protocolLevel.level >= 2).map((protocolLevel) => (
                <option key={protocolLevel.level} value={protocolLevel.level}>
                  Level {protocolLevel.level}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleSaveLevel} disabled={isSavingLevel}>
            <Save className="size-5" aria-hidden="true" />
            {isSavingLevel ? "Saving" : "Save level"}
          </Button>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
