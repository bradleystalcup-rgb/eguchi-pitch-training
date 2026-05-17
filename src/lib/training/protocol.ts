import { DEFAULT_CHORD_DEFINITIONS } from "./chords";
import type { ProgressionDecision, ProtocolChord, ProtocolLevel, TrialResult } from "./types";

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
  ...whiteChordSlugs.map((_, index) => ({
    level: index + 1,
    phase: "white-keys" as const,
    chordSlugs: whiteChordSlugs.slice(0, index + 1),
    ...levelDefaults,
  })),
  ...blackChordSlugs.map((_, index) => ({
    level: whiteChordSlugs.length + index + 1,
    phase: "black-keys" as const,
    chordSlugs: [...whiteChordSlugs, ...blackChordSlugs.slice(0, index + 1)],
    ...levelDefaults,
  })),
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
  Pick<ProtocolChord, "answerLabel" | "colorName" | "colorHex" | "textClass" | "phase">
> = {
  "white-red-ceg": color("Red", "#ef4444", "text-white"),
  "white-yellow-cfa": color("Yellow", "#facc15", "text-slate-950"),
  "white-blue-bdg": color("Blue", "#2563eb", "text-white"),
  "white-black-acf": color("Black", "#111827", "text-white"),
  "white-green-dgb": color("Green", "#16a34a", "text-white"),
  "white-orange-egc": color("Orange", "#f97316", "text-white"),
  "white-purple-fac": color("Purple", "#9333ea", "text-white"),
  "white-pink-gbd": color("Pink", "#ec4899", "text-white"),
  "white-brown-gce": color("Brown", "#92400e", "text-white"),
  "black-csharp-major": toneName("C sharp"),
  "black-dsharp-major": toneName("D sharp"),
  "black-fsharp-major": toneName("F sharp"),
  "black-gsharp-major": toneName("G sharp"),
  "black-asharp-major": toneName("A sharp"),
};

const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function color(answerLabel: string, colorHex: string, textClass: string) {
  return {
    answerLabel,
    colorName: answerLabel,
    colorHex,
    textClass,
    phase: "white-keys" as const,
  };
}

function toneName(answerLabel: string) {
  return {
    answerLabel,
    colorName: "White",
    colorHex: "#f8fafc",
    textClass: "text-slate-950",
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
  recentResults: readonly TrialResult[],
): ProgressionDecision {
  const protocolLevel = getProtocolLevel(currentLevel);
  const recentAccuracy = calculateAccuracy(recentResults);
  const isFinalLevel = currentLevel >= 15;
  const promoted =
    !isFinalLevel &&
    recentResults.length >= protocolLevel.trialsPerSession &&
    recentResults.every((result) => result.isCorrect);

  return {
    nextLevel: promoted ? currentLevel + 1 : currentLevel,
    recentAccuracy,
    promoted,
  };
}
