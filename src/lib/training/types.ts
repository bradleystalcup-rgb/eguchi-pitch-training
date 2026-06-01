export type ChordQuality = "major";
export type TrainingSessionStatus = "active" | "completed" | "abandoned";
export type TrainingPhase = "white-keys" | "black-keys" | "maintenance";
export type ChordSelectionAlgorithm = "random" | "adaptive";
export type TrainingTaskType = "chord_identification" | "chord_notes" | "single_note" | "maintenance";
export type AnswerMode = "color_choice" | "note_set" | "single_note";

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
  colorAddKey: string;
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

export interface TrainingTrialPlanItem {
  trialIndex: number;
  taskType: TrainingTaskType;
  answerMode: AnswerMode;
  promptChordSlug: string;
  isolatedToneNote?: string;
}

export interface ProgressSnapshot {
  currentLevel: number;
  trainingPhase: TrainingTaskType;
  sessionsCompleted: number;
  trialsCompleted: number;
  correctTrials: number;
  recentAccuracy: number;
}

export type SkillMapChordStatus = "mastered" | "current" | "next";

export interface SkillMapChordRow {
  slug: string;
  label: string;
  colorName: string;
  colorHex: string;
  streak: number;
  required: number;
  status: SkillMapChordStatus;
}

export interface SkillMapSnapshot {
  requiredPerfectSessionStreak: number;
  mastered: SkillMapChordRow[];
  current: SkillMapChordRow[];
  next: SkillMapChordRow | null;
}

export interface ProgressionDecision {
  nextLevel: number;
  nextTrainingPhase: TrainingTaskType;
  recentAccuracy: number;
  promoted: boolean;
  phasePromoted: boolean;
}
