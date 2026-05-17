"use client";

import { useMemo, useState } from "react";
import { Music, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { playNotesChord } from "@/lib/training/audio";
import { getActiveChordsForLevel } from "@/lib/training/protocol";
import type { ProtocolChord } from "@/lib/training/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ColorChoiceGrid, type ColorChoice } from "./color-choice-grid";

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

export function SessionTrainer({
  childName = "Mika",
  level = 2,
  exercises,
  onComplete,
}: {
  childName?: string;
  level?: number;
  exercises?: TrainingExercise[];
  onComplete?: (summary: { correct: number; total: number }) => void;
}) {
  const sessionExercises = useMemo(() => exercises ?? exercisesForLevel(level), [exercises, level]);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  function handleNext() {
    const nextCorrectCount = correctCount + Number(isCorrect);

    if (index >= total - 1) {
      onComplete?.({ correct: nextCorrectCount, total });
      return;
    }

    setCorrectCount(nextCorrectCount);
    setSelectedId(undefined);
    setIndex((value) => value + 1);
  }

  function handleReset() {
    setIndex(0);
    setSelectedId(undefined);
    setCorrectCount(0);
  }

  if (!current) {
    return (
      <Card className="bg-sky-50">
        <CardTitle>No training cards yet</CardTitle>
        <CardDescription>Add a few chords to start a playful practice session.</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <CardHeader>
        <div>
          <Badge tone="pink">Trial {index + 1} of {total}</Badge>
          <CardTitle className="mt-3">Listen, {childName}</CardTitle>
          <CardDescription>{current.prompt}</CardDescription>
        </div>
        <Music className="h-10 w-10 text-pink-500" aria-hidden="true" />
      </CardHeader>

      <div className="space-y-5">
        <Progress value={progress} label="Adventure" />

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
          disabled={answered}
          onSelect={(choice) => setSelectedId(choice.id)}
        />

        <div className="min-h-16 rounded-3xl bg-white/80 p-4 text-lg font-black text-slate-800 ring-2 ring-white">
          {!answered ? "Tap a color after you listen." : null}
          {answered && isCorrect ? (
            <span className="inline-flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
              Nice listening. That chord feels right.
            </span>
          ) : null}
          {answered && !isCorrect ? "Good try. Listen again and remember the color." : null}
        </div>

        <Button size="lg" variant="secondary" disabled={!answered} onClick={handleNext}>
          {index >= total - 1 ? "Finish" : "Next chord"}
        </Button>
      </div>
    </Card>
  );
}
