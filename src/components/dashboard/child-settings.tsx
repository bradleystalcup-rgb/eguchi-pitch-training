"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_PROTOCOL_LEVELS } from "@/lib/training/protocol";

type ChildSettingsData = {
  id: string;
  name?: string;
  displayName?: string;
  birthYear?: number | null;
  level?: number | null;
  currentLevel?: number | null;
  dailySessionGoal?: number | null;
  showColorAccessibilityKeys?: boolean | null;
  warmUpChordsEnabled?: boolean | null;
  autoNextEnabled?: boolean | null;
  hotkeyMode?: "left" | "right" | null;
  accidentalMode?: "sharps" | "flats" | null;
  chordSelectionAlgorithm?: "random" | "adaptive" | null;
  soundEngine?: "tone" | "native-synth" | "sampled" | null;
};

type ChildSettingsResponse = { child?: ChildSettingsData };

const soundEngineOptions = [
  { value: "tone", label: "Tone.js" },
  { value: "native-synth", label: "Native synth" },
  { value: "sampled", label: "Sampled piano" },
] as const;

function normalizeChild(child: ChildSettingsData | undefined): ChildSettingsData | undefined {
  if (!child) return undefined;
  const level = child.level ?? child.currentLevel ?? 1;

  return {
    ...child,
    name: child.name ?? child.displayName ?? "Learner",
    displayName: child.displayName ?? child.name ?? "Learner",
    level,
    currentLevel: level,
    birthYear: child.birthYear ?? null,
    dailySessionGoal: child.dailySessionGoal ?? 5,
    showColorAccessibilityKeys: Boolean(child.showColorAccessibilityKeys),
    warmUpChordsEnabled: child.warmUpChordsEnabled ?? null,
    autoNextEnabled: Boolean(child.autoNextEnabled),
    hotkeyMode: child.hotkeyMode ?? "left",
    accidentalMode: child.accidentalMode ?? "sharps",
    chordSelectionAlgorithm: child.chordSelectionAlgorithm ?? "random",
    soundEngine: child.soundEngine ?? "tone",
  };
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string | { message?: string }; message?: string };
    return typeof data.error === "string" ? data.error : data.error?.message ?? data.message;
  } catch {
    return undefined;
  }
}

export function ChildSettings({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildSettingsData>();
  const [draftName, setDraftName] = useState("");
  const [draftBirthYear, setDraftBirthYear] = useState("");
  const [draftLevel, setDraftLevel] = useState(1);
  const [draftDailyGoal, setDraftDailyGoal] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadChild() {
      try {
        const response = await fetch(`/api/children/${childId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Request failed");

        const data = (await response.json()) as ChildSettingsResponse;
        const nextChild = normalizeChild(data.child);
        setChild(nextChild);
        setDraftName(nextChild?.displayName ?? "Learner");
        setDraftBirthYear(nextChild?.birthYear ? String(nextChild.birthYear) : "");
        setDraftLevel(Number(nextChild?.currentLevel ?? 1));
        setDraftDailyGoal(Number(nextChild?.dailySessionGoal ?? 5));
      } catch {
        setError("We could not load this child's settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadChild();
  }, [childId]);

  async function patchChild(settings: Record<string, boolean | string | number | null>) {
    if (!child) return;
    const previousChild = child;
    const nextChild = normalizeChild({ ...child, ...settings });
    setChild(nextChild);
    setIsSaving(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error((await readApiError(response)) ?? "Unable to save settings");
      }

      const data = (await response.json()) as ChildSettingsResponse;
      const savedChild = normalizeChild(data.child) ?? nextChild ?? previousChild;
      setChild(savedChild);
      setDraftName(savedChild.displayName ?? "Learner");
      setDraftBirthYear(savedChild.birthYear ? String(savedChild.birthYear) : "");
      setDraftDailyGoal(Number(savedChild.dailySessionGoal ?? 5));
      setMessage("Settings saved.");
    } catch (caughtError) {
      setChild(previousChild);
      setError(caughtError instanceof Error ? caughtError.message : "We could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveProfileSettings() {
    const name = draftName.trim();
    const birthYear = draftBirthYear ? Number(draftBirthYear) : null;
    if (name.length < 2) {
      setError("Enter the child's name.");
      return;
    }

    await patchChild({
      displayName: name,
      birthYear,
      dailySessionGoal: draftDailyGoal,
    });
  }

  async function saveLevel() {
    if (!child) return;
    setIsSaving(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/children/${childId}/level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: draftLevel }),
      });

      if (!response.ok) {
        throw new Error((await readApiError(response)) ?? "Unable to save level");
      }

      const data = (await response.json()) as ChildSettingsResponse;
      const savedChild = normalizeChild(data.child);
      setChild(savedChild);
      setDraftLevel(Number(savedChild?.currentLevel ?? draftLevel));
      setMessage("Level saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We could not save level.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="inline-flex items-center gap-2 p-6 text-base font-bold text-slate-700">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Loading settings...
      </Card>
    );
  }

  if (!child) {
    return <Alert tone="danger">{error ?? "This child profile was not found."}</Alert>;
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}

      <Card>
        <Badge tone="sky">Child profile</Badge>
        <CardTitle className="mt-3">{child.displayName}&apos;s settings</CardTitle>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="child-name">Child name</Label>
            <Input id="child-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="child-birth-year">Birth year</Label>
            <Input
              id="child-birth-year"
              type="number"
              value={draftBirthYear}
              onChange={(event) => setDraftBirthYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
              min={1900}
              max={new Date().getUTCFullYear()}
              inputMode="numeric"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="daily-goal">Daily session goal</Label>
            <Input
              id="daily-goal"
              type="number"
              value={draftDailyGoal}
              onChange={(event) => setDraftDailyGoal(Math.min(12, Math.max(1, Number(event.target.value) || 1)))}
              min={1}
              max={12}
              inputMode="numeric"
              className="mt-2"
            />
          </div>
        </div>
        <Button onClick={saveProfileSettings} disabled={isSaving} className="mt-5">
          <Save className="size-5" aria-hidden="true" />
          Save profile
        </Button>
      </Card>

      <Card>
        <Badge tone="amber">Practice room</Badge>
        <CardTitle className="mt-3">Practice room settings</CardTitle>
        <div className="mt-5 space-y-4">
          <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-sky-50 px-4 py-3 text-base font-black text-slate-900">
            Auto-next
            <input type="checkbox" checked={Boolean(child.autoNextEnabled)} disabled={isSaving} onChange={(event) => void patchChild({ autoNextEnabled: event.target.checked })} className="size-6 accent-emerald-500" />
          </label>
          <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-emerald-50 px-4 py-3 text-base font-black text-slate-900">
            Color keys
            <input type="checkbox" checked={Boolean(child.showColorAccessibilityKeys)} disabled={isSaving} onChange={(event) => void patchChild({ showColorAccessibilityKeys: event.target.checked })} className="size-6 accent-emerald-500" />
          </label>

          <div className="space-y-3">
            <div className="text-base font-black text-slate-900">Warm-up chords</div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant={child.warmUpChordsEnabled === null ? "secondary" : "ghost"} onClick={() => void patchChild({ warmUpChordsEnabled: null })} disabled={isSaving}>Ask</Button>
              <Button variant={child.warmUpChordsEnabled === true ? "secondary" : "ghost"} onClick={() => void patchChild({ warmUpChordsEnabled: true })} disabled={isSaving}>Yes</Button>
              <Button variant={child.warmUpChordsEnabled === false ? "secondary" : "ghost"} onClick={() => void patchChild({ warmUpChordsEnabled: false })} disabled={isSaving}>No</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="practice-level">Level</Label>
              <select id="practice-level" value={draftLevel} disabled={isSaving} onChange={(event) => setDraftLevel(Number(event.target.value))} className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-60">
                {DEFAULT_PROTOCOL_LEVELS.map((protocolLevel) => <option key={protocolLevel.level} value={protocolLevel.level}>Level {protocolLevel.level}</option>)}
              </select>
              <Button onClick={saveLevel} disabled={isSaving}>Save level</Button>
            </div>
            <div className="space-y-3">
              <Label htmlFor="sound-engine">Sound</Label>
              <select id="sound-engine" value={child.soundEngine ?? "tone"} disabled={isSaving} onChange={(event) => void patchChild({ soundEngine: event.target.value })} className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-60">
                {soundEngineOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SettingButtons title="Chord order" value={child.chordSelectionAlgorithm ?? "random"} options={[["random", "Random"], ["adaptive", "Adaptive"]]} onChange={(value) => void patchChild({ chordSelectionAlgorithm: value })} disabled={isSaving} />
            <SettingButtons title="Keyboard side" value={child.hotkeyMode ?? "left"} options={[["left", "Left hand"], ["right", "Right hand"]]} onChange={(value) => void patchChild({ hotkeyMode: value })} disabled={isSaving} />
            <SettingButtons title="Note names" value={child.accidentalMode ?? "sharps"} options={[["sharps", "Sharps"], ["flats", "Flats"]]} onChange={(value) => void patchChild({ accidentalMode: value })} disabled={isSaving} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function SettingButtons({
  title,
  value,
  options,
  disabled,
  onChange,
}: {
  title: string;
  value: string;
  options: [string, string][];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-base font-black text-slate-900">{title}</div>
      <div className="grid gap-2">
        {options.map(([optionValue, label]) => (
          <Button key={optionValue} variant={value === optionValue ? "secondary" : "ghost"} onClick={() => onChange(optionValue)} disabled={disabled}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
