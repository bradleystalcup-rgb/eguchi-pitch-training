import { DEFAULT_CHORD_DEFINITIONS } from "./chords";
import { chordPalette } from "@/lib/design/palette";
import type {
  ProgressionDecision,
  ProtocolChord,
  ProtocolLevel,
  TrainingTaskType,
  TrialResult,
} from "./types";

export const DEFAULT_PROTOCOL_VERSION = "eguchi-cim-v1";

const whiteChordSlugs = DEFAULT_CHORD_DEFINITIONS.slice(0, 9).map((chord) => chord.slug);
const blackChordSlugs = DEFAULT_CHORD_DEFINITIONS.slice(9, 14).map((chord) => chord.slug);

const levelDefaults = {
  trialsPerSession: 20,
  dailySessionsMin: 4,
  dailySessionsMax: 5,
  targetMinutesMin: 2,
  targetMinutesMax: 5,
  earliestNextChordDays: 14,
  requiresPerfectCurrentSet: true,
};

export const DEFAULT_PROTOCOL_LEVELS = [
  ...whiteChordSlugs.slice(0, -1).map((_, index) => ({
    level: index + 1,
    phase: "white-keys" as const,
    chordSlugs: whiteChordSlugs.slice(0, index + 2),
    ...levelDefaults,
  })),
  ...blackChordSlugs.map((_, index) => ({
    level: whiteChordSlugs.length + index,
    phase: "black-keys" as const,
    chordSlugs: [...whiteChordSlugs, ...blackChordSlugs.slice(0, index + 1)],
    ...levelDefaults,
  })),
  {
    level: 14,
    phase: "maintenance" as const,
    chordSlugs: [...whiteChordSlugs, ...blackChordSlugs],
    ...levelDefaults,
  },
  {
    level: 15,
    phase: "maintenance" as const,
    chordSlugs: [...whiteChordSlugs, ...blackChordSlugs],
    trialsPerSession: 20,
    dailySessionsMin: 1,
    dailySessionsMax: 5,
    targetMinutesMin: 2,
    targetMinutesMax: 5,
    earliestNextChordDays: null,
    requiresPerfectCurrentSet: true,
  },
] as const satisfies readonly ProtocolLevel[];

const chordPresentation: Record<
  string,
  Pick<ProtocolChord, "answerLabel" | "colorName" | "colorHex" | "textClass" | "colorAddKey" | "phase">
> = {
  "white-red-ceg": color("Red", chordPalette.red, "text-white", "red"),
  "white-yellow-cfa": color("Yellow", chordPalette.yellow, "text-slate-950", "yellow"),
  "white-blue-bdg": color("Blue", chordPalette.blue, "text-white", "blue"),
  "white-black-acf": color("Black", chordPalette.black, "text-white", "black"),
  "white-green-dgb": color("Green", chordPalette.green, "text-white", "blue+yellow"),
  "white-orange-egc": color("Orange", chordPalette.orange, "text-white", "red+yellow"),
  "white-purple-fac": color("Purple", chordPalette.purple, "text-white", "blue+red"),
  "white-pink-gbd": color("Pink", chordPalette.pink, "text-white", "red+white"),
  "white-brown-gce": color("Brown", chordPalette.brown, "text-white", "red+yellow+black"),
  "black-csharp-major": toneName("C sharp", chordPalette.cSharp),
  "black-dsharp-major": toneName("D sharp", chordPalette.dSharp),
  "black-fsharp-major": toneName("F sharp", chordPalette.fSharp),
  "black-gsharp-major": toneName("G sharp", chordPalette.gSharp),
  "black-asharp-major": toneName("A sharp", chordPalette.aSharp),
};

const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function color(answerLabel: string, colorHex: string, textClass: string, colorAddKey: string) {
  return {
    answerLabel,
    colorName: answerLabel,
    colorHex,
    textClass,
    colorAddKey,
    phase: "white-keys" as const,
  };
}

function toneName(answerLabel: string, colorHex: string) {
  return {
    answerLabel,
    colorName: "White",
    colorHex,
    textClass: "text-slate-950",
    colorAddKey: "white",
    phase: "black-keys" as const,
  };
}

function midiToToneNote(midiNote: number) {
  const pitch = pitchNames[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return `${pitch}${octave}`;
}

export function getProtocolLevel(level: number): ProtocolLevel {
  return (
    DEFAULT_PROTOCOL_LEVELS.find((protocolLevel) => protocolLevel.level === level) ??
    DEFAULT_PROTOCOL_LEVELS[0]
  );
}

export function getActiveChordsForLevel(level: number): ProtocolChord[] {
  const protocolLevel = getProtocolLevel(level);

  return protocolLevel.chordSlugs.map((slug) => {
    const chord = DEFAULT_CHORD_DEFINITIONS.find((definition) => definition.slug === slug);

    if (!chord) {
      throw new Error(`Protocol references unknown chord: ${slug}`);
    }

    return {
      ...chord,
      ...chordPresentation[chord.slug],
      notes: [...chord.displayNotes],
      toneNotes: chord.midiNotes.map(midiToToneNote),
    };
  });
}

export function calculateAccuracy(results: readonly TrialResult[]): number {
  if (results.length === 0) return 0;
  const correctCount = results.filter((result) => result.isCorrect).length;
  return Math.round((correctCount / results.length) * 100);
}

export function calculateProgression(
  currentLevel: number,
  currentTrainingPhase: TrainingTaskType,
  recentResults: readonly TrialResult[],
): ProgressionDecision {
  const protocolLevel = getProtocolLevel(currentLevel);
  const recentAccuracy = calculateAccuracy(recentResults);
  const isFinalLevel = currentLevel >= 15;
  const mastered =
    recentResults.length >= protocolLevel.trialsPerSession &&
    recentResults.every((result) => result.isCorrect);
  const promoted = currentTrainingPhase === "chord_identification" && !isFinalLevel && mastered;
  const phasePromoted = currentTrainingPhase === "chord_identification" && isFinalLevel && mastered;

  return {
    nextLevel: promoted ? currentLevel + 1 : currentLevel,
    nextTrainingPhase: phasePromoted ? "chord_notes" : currentTrainingPhase,
    recentAccuracy,
    promoted,
    phasePromoted,
  };
}
