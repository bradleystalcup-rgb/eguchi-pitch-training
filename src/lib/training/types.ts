export type ChordQuality = "major";
export type TrainingSessionStatus = "active" | "completed" | "abandoned";
export type TrainingPhase = "white-keys" | "black-keys" | "maintenance";

export interface ChordDefinition {
  id: string;
  slug: string;
  name: string;
  rootNote: string;
  quality: ChordQuality;
  inversion: number;
  midiNotes: number[];
  displayNotes: string[];
  sortOrder: number;
  isDefault: boolean;
}

export interface ProtocolChord extends ChordDefinition {
  answerLabel: string;
  colorName: string;
  colorHex: string;
  textClass: string;
  phase: Exclude<TrainingPhase, "maintenance">;
  notes: string[];
  toneNotes: string[];
}

export interface ProtocolLevel {
  level: number;
  phase: TrainingPhase;
  chordSlugs: string[];
  trialsPerSession: number;
  dailySessionsMin: number;
  dailySessionsMax: number;
  targetMinutesMin: number;
  targetMinutesMax: number;
  earliestNextChordDays: number | null;
  requiresPerfectCurrentSet: boolean;
}

export interface TrialResult {
  isCorrect: boolean;
}

export interface ProgressSnapshot {
  currentLevel: number;
  sessionsCompleted: number;
  trialsCompleted: number;
  correctTrials: number;
  recentAccuracy: number;
}

export interface ProgressionDecision {
  nextLevel: number;
  recentAccuracy: number;
  promoted: boolean;
}
