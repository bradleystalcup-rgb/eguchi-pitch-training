"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, LoaderCircle, Mic2, Settings, X } from "lucide-react";
import { FlowLink } from "@/components/app-shell";
import { ChildProgressCard, type ChildProgressCardProps } from "@/components/dashboard/child-progress-card";
import { SkillMatrix, type SkillMatrixItem } from "@/components/dashboard/skill-matrix";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DEFAULT_PROTOCOL_LEVELS } from "@/lib/training/protocol";

type ChildDetailData = {
  id: string;
  name?: string;
  displayName?: string;
  level?: number | string | null;
  currentLevel?: number | string | null;
  weeklyGoalPercent?: number | null;
  sessionsThisWeek?: number | null;
  favoriteSkill?: string | null;
  showColorAccessibilityKeys?: boolean | null;
  warmUpChordsEnabled?: boolean | null;
  autoNextEnabled?: boolean | null;
  hotkeyMode?: "left" | "right" | null;
  accidentalMode?: "sharps" | "flats" | null;
  chordSelectionAlgorithm?: "random" | "adaptive" | null;
  soundEngine?: "tone" | "native-synth" | "sampled" | null;
  progress?: {
    currentLevel?: number | null;
    sessionsCompleted?: number | null;
    recentAccuracy?: number | null;
  } | null;
  skills?: SkillMatrixItem[];
};

type ChildDetailResponse = { child?: ChildDetailData };

const defaultSkills: SkillMatrixItem[] = [
  { id: "red", label: "Red", description: "First white-key color flag", score: 0 },
  { id: "yellow", label: "Yellow", description: "Next listening target", score: 0 },
  { id: "blue", label: "Blue", description: "Builds after the first colors", score: 0 },
  { id: "black-keys", label: "Black keys", description: "Unlocks after nine colors", score: 0 },
];

const soundEngineOptions = [
  { value: "tone", label: "Tone.js" },
  { value: "native-synth", label: "Native synth" },
  { value: "sampled", label: "Sampled piano" },
] as const;

export function ChildDetail({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildDetailData>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadChild() {
      try {
        const response = await fetch(`/api/children/${childId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as ChildDetailResponse;
        setChild(normalizeChild(readChildDetail(data)));
      } catch {
        setError("We could not load this child profile.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadChild();
  }, [childId]);

  const cardProps = useMemo<ChildProgressCardProps | undefined>(() => {
    if (!child) return undefined;

    return {
      name: child.name ?? child.displayName ?? "Learner",
      level:
        child.level === undefined || child.level === null || child.level === ""
          ? "Level 1"
          : typeof child.level === "number"
          ? `Level ${child.level}`
          : child.level,
      sessionsCompleted: child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0,
    };
  }, [child]);

  useEffect(() => {
    if (!isSettingsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSettingsOpen]);

  if (isLoading) {
    return (
      <Card className="inline-flex items-center gap-2 p-6 text-base font-bold text-slate-700">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Loading learner...
      </Card>
    );
  }

  if (error || !child || !cardProps) {
    return (
      <Alert role="alert" tone="danger">
        {error ?? "This child profile was not found."}
      </Alert>
    );
  }

  async function updateSettings(settings: {
    showColorAccessibilityKeys?: boolean;
    warmUpChordsEnabled?: boolean | null;
    autoNextEnabled?: boolean;
    hotkeyMode?: "left" | "right";
    accidentalMode?: "sharps" | "flats";
    chordSelectionAlgorithm?: "random" | "adaptive";
    soundEngine?: "tone" | "native-synth" | "sampled";
  }) {
    if (!child) return;

    const previousChild = child;
    const nextChild = { ...child, ...settings };
    setChild(nextChild);
    setIsSavingSettings(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Unable to save settings");
      }

      const data = (await response.json()) as ChildDetailResponse;
      setChild(normalizeChild(readChildDetail(data)) ?? nextChild);
    } catch {
      setChild(previousChild);
      setError("We could not save this learner's settings.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function updateLevel(level: number) {
    if (!child) return;

    const previousChild = child;
    const nextChild = { ...child, level, currentLevel: level };
    setChild(nextChild);
    setIsSavingSettings(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/children/${childId}/level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });

      if (!response.ok) {
        throw new Error("Unable to save level");
      }

      const data = (await response.json()) as ChildDetailResponse;
      setChild(normalizeChild(readChildDetail(data)) ?? nextChild);
    } catch {
      setChild(previousChild);
      setError("We could not save this learner's level.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  const settingsModal = isSettingsOpen ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation">
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Learner settings"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="sky">Settings</Badge>
            <h2 className="mt-3 text-2xl font-black text-slate-950">{cardProps.name}</h2>
          </div>
          <Button size="icon" variant="ghost" aria-label="Close learner settings" onClick={() => setIsSettingsOpen(false)}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-5 max-h-[70svh] space-y-4 overflow-y-auto pr-1">
          <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-sky-50 px-4 py-3 text-base font-black text-slate-900">
            Auto-next
            <input
              type="checkbox"
              checked={Boolean(child.autoNextEnabled)}
              disabled={isSavingSettings}
              onChange={(event) => void updateSettings({ autoNextEnabled: event.target.checked })}
              className="size-6 accent-emerald-500"
            />
          </label>

          <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-emerald-50 px-4 py-3 text-base font-black text-slate-900">
            Color keys
            <input
              type="checkbox"
              checked={Boolean(child.showColorAccessibilityKeys)}
              disabled={isSavingSettings}
              onChange={(event) => void updateSettings({ showColorAccessibilityKeys: event.target.checked })}
              className="size-6 accent-emerald-500"
            />
          </label>

          <div className="space-y-3">
            <div className="text-base font-black text-slate-900">Warm-up chords</div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={child.warmUpChordsEnabled === null || child.warmUpChordsEnabled === undefined ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ warmUpChordsEnabled: null })}
                disabled={isSavingSettings}
              >
                Ask
              </Button>
              <Button
                variant={child.warmUpChordsEnabled === true ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ warmUpChordsEnabled: true })}
                disabled={isSavingSettings}
              >
                Yes
              </Button>
              <Button
                variant={child.warmUpChordsEnabled === false ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ warmUpChordsEnabled: false })}
                disabled={isSavingSettings}
              >
                No
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-base font-black text-slate-900">Chord order</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={child.chordSelectionAlgorithm === "random" ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ chordSelectionAlgorithm: "random" })}
                disabled={isSavingSettings}
              >
                Random
              </Button>
              <Button
                variant={child.chordSelectionAlgorithm === "adaptive" ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ chordSelectionAlgorithm: "adaptive" })}
                disabled={isSavingSettings}
              >
                Adaptive
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-base font-black text-slate-900">Keyboard side</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={child.hotkeyMode === "left" ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ hotkeyMode: "left" })}
                disabled={isSavingSettings}
              >
                Left hand
              </Button>
              <Button
                variant={child.hotkeyMode === "right" ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ hotkeyMode: "right" })}
                disabled={isSavingSettings}
              >
                Right hand
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-base font-black text-slate-900">Note names</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={child.accidentalMode === "sharps" ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ accidentalMode: "sharps" })}
                disabled={isSavingSettings}
              >
                Sharps
              </Button>
              <Button
                variant={child.accidentalMode === "flats" ? "secondary" : "ghost"}
                onClick={() => void updateSettings({ accidentalMode: "flats" })}
                disabled={isSavingSettings}
              >
                Flats
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="learner-sound-engine">Sound</Label>
            <select
              id="learner-sound-engine"
              value={child.soundEngine ?? "tone"}
              disabled={isSavingSettings}
              onChange={(event) => void updateSettings({ soundEngine: event.target.value as "tone" | "native-synth" | "sampled" })}
              className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
            >
              {soundEngineOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="learner-practice-level">Level</Label>
            <select
              id="learner-practice-level"
              value={Number(child.level ?? child.currentLevel ?? 1)}
              disabled={isSavingSettings}
              onChange={(event) => void updateLevel(Number(event.target.value))}
              className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
            >
              {DEFAULT_PROTOCOL_LEVELS.map((protocolLevel) => (
                <option key={protocolLevel.level} value={protocolLevel.level}>
                  Level {protocolLevel.level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      <section aria-labelledby="next-heading" className="grid gap-4 md:grid-cols-3">
        <h2 id="next-heading" className="sr-only">
          Next steps
        </h2>
        <FlowLink
          href={`/train/${childId}`}
          label="Begin practice"
          description={`Open ${child.name ?? child.displayName ?? "this learner"}'s training room.`}
          icon={Mic2}
        />
        <FlowLink
          href="/dashboard"
          label="All learners"
          description="Return to the family dashboard."
          icon={BarChart3}
        />
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="group block rounded-3xl text-left focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
        >
          <Card className="min-h-28 border-2 p-5 shadow-sm transition group-hover:-translate-y-1 group-hover:border-[#118ab2]">
            <div className="flex items-start gap-4">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffd166] text-slate-950 transition group-hover:bg-[#06d6a0]"
                aria-hidden="true"
              >
                <Settings className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-black text-slate-950">Learner settings</span>
                <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
                  Adjust practice settings for this learner.
                </span>
              </span>
            </div>
          </Card>
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ChildProgressCard {...cardProps} />
        <SkillMatrix skills={child.skills?.length ? child.skills : defaultSkills} />
      </section>
      {settingsModal}
    </div>
  );
}

function normalizeChild(child: ChildDetailData | undefined): ChildDetailData | undefined {
  if (!child) return undefined;

  return {
    ...child,
    name: child.name ?? child.displayName ?? "Learner",
    level: child.level ?? child.currentLevel ?? child.progress?.currentLevel ?? 1,
    weeklyGoalPercent: child.weeklyGoalPercent ?? child.progress?.recentAccuracy ?? 0,
    sessionsThisWeek: child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0,
    showColorAccessibilityKeys: Boolean(child.showColorAccessibilityKeys),
    warmUpChordsEnabled: child.warmUpChordsEnabled ?? null,
    autoNextEnabled: Boolean(child.autoNextEnabled),
    hotkeyMode: child.hotkeyMode ?? "left",
    accidentalMode: child.accidentalMode ?? "sharps",
    chordSelectionAlgorithm: child.chordSelectionAlgorithm ?? "random",
    soundEngine: child.soundEngine ?? "tone",
  };
}

function readChildDetail(data: ChildDetailResponse): ChildDetailData | undefined {
  return data.child;
}
