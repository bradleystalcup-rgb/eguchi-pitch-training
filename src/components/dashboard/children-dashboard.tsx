"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChildProgressCard } from "@/components/dashboard/child-progress-card";
import { DEFAULT_PROTOCOL_LEVELS } from "@/lib/training/protocol";

export type ChildSummary = {
  id: string;
  name?: string;
  displayName?: string;
  birthYear?: number | null;
  level?: number | string | null;
  currentLevel?: number | string | null;
  dailySessionGoal?: number | null;
  dailySessionCounts?: { date: string; count: number }[];
  sessionsThisWeek?: number | null;
  progress?: {
    currentLevel?: number | null;
    sessionsCompleted?: number | null;
    recentAccuracy?: number | null;
  } | null;
};

type ChildrenResponse = { children?: ChildSummary[] };
type ApiErrorResponse = {
  message?: string;
  error?: string | { message?: string };
};

export function ChildrenDashboard() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [startingLevel, setStartingLevel] = useState(1);
  const [dailySessionGoal, setDailySessionGoal] = useState(5);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  useEffect(() => {
    async function loadChildren() {
      try {
        const response = await fetch("/api/children", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as ChildrenResponse;
        setChildren((data.children ?? []).map(normalizeChild));
      } catch {
        setError("We could not load child profiles yet. Try again in a moment.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadChildren();
  }, []);

  useEffect(() => {
    if (!isCreateOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCreateOpen]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const childName = name.trim();
    const trimmedBirthYear = birthYear.trim();
    setFormError(undefined);

    if (childName.length < 2) {
      setFormError("Enter the child's name.");
      return;
    }

    if (trimmedBirthYear && !isValidBirthYear(trimmedBirthYear)) {
      setFormError("Use a four-digit birth year.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: childName,
          level: startingLevel,
          dailySessionGoal,
          ...(trimmedBirthYear ? { birthYear: Number(trimmedBirthYear) } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error((await readApiError(response)) ?? "We could not add that child. Try again.");
      }

      const data = (await response.json()) as { child: ChildSummary };
      const child = normalizeChild(data.child);
      setChildren((current) => [child, ...current.filter((item) => item.id !== child.id)]);
      setName("");
      setBirthYear("");
      setStartingLevel(1);
      setDailySessionGoal(5);
      setIsCreateOpen(false);
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : "We could not add that child. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const createModal = isCreateOpen ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Add learner"
        noValidate
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Add learner</CardTitle>
          </div>
          <Button size="icon" variant="ghost" aria-label="Close add learner" onClick={() => setIsCreateOpen(false)}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="child-name">Child name</Label>
            <Input
              id="child-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? "child-name-error" : undefined}
              className="mt-2 min-h-12"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <div>
              <Label htmlFor="child-birth-year">Birth year</Label>
              <Input
                id="child-birth-year"
                type="number"
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                pattern="[0-9]{4}"
                min={1900}
                max={new Date().getUTCFullYear()}
                step={1}
                aria-invalid={Boolean(formError)}
                aria-describedby={formError ? "child-name-error" : undefined}
                className="mt-2 min-h-12"
              />
            </div>
            <div>
              <Label htmlFor="child-starting-level">Starting level</Label>
              <select
                id="child-starting-level"
                value={startingLevel}
                onChange={(event) => setStartingLevel(Number(event.target.value))}
                className="mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                {DEFAULT_PROTOCOL_LEVELS.map((protocolLevel) => (
                  <option key={protocolLevel.level} value={protocolLevel.level}>
                    Level {protocolLevel.level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="child-daily-session-goal">Daily session goal</Label>
            <Input
              id="child-daily-session-goal"
              type="number"
              value={dailySessionGoal}
              onChange={(event) => setDailySessionGoal(Math.min(12, Math.max(1, Number(event.target.value) || 1)))}
              inputMode="numeric"
              min={1}
              max={12}
              step={1}
              className="mt-2 min-h-12"
            />
            <p className="mt-2 text-xs font-bold text-slate-500">
              * The method works best with at least 4 or 5 short sessions each day.
            </p>
          </div>

          {formError ? (
            <Alert id="child-name-error" tone="danger">
              {formError}
            </Alert>
          ) : null}

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
            {isCreating ? "Adding" : "Add learner"}
          </Button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <section aria-labelledby="children-heading" className="space-y-5">
      <div>
        <h2 id="children-heading" className="text-2xl font-black text-slate-950">
          Learners
        </h2>
      </div>

      {isLoading ? (
        <Card className="inline-flex items-center gap-2 p-6 text-base font-bold text-slate-700">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Loading child profiles...
        </Card>
      ) : null}

      {error ? (
        <Alert role="alert" tone="danger">
          {error}
        </Alert>
      ) : null}

      {!isLoading && !error ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {children.map((child) => (
            <ChildCard key={child.id} child={normalizeChild(child)} />
          ))}
          <AddChildCard onClick={() => setIsCreateOpen(true)} />
        </div>
      ) : null}

      {createModal}
    </section>
  );
}

function AddChildCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-72 rounded-3xl border-2 border-dashed border-sky-200 bg-white/70 p-6 text-left transition hover:-translate-y-1 hover:border-sky-400 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
      aria-label="Add learner"
    >
      <CardContent className="grid h-full place-items-center space-y-3 p-0 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-200">
          <Plus className="size-8" aria-hidden="true" />
        </span>
      </CardContent>
    </button>
  );
}

function ChildCard({ child }: { child: ChildSummary }) {
  const childName = child.name ?? child.displayName ?? "Learner";
  const levelLabel = formatLevel(child.level ?? child.currentLevel ?? child.progress?.currentLevel);

  return (
    <ChildProgressCard
      id={child.id}
      name={childName}
      level={levelLabel}
      dailySessionGoal={child.dailySessionGoal ?? 5}
      dailySessionCounts={child.dailySessionCounts ?? createEmptyDailySessionCounts()}
      actionMode="links"
    />
  );
}

function normalizeChild(child: ChildSummary): ChildSummary {
  const level = child.currentLevel ?? child.level ?? child.progress?.currentLevel ?? 1;

  return {
    ...child,
    name: child.name ?? child.displayName ?? "Learner",
    displayName: child.displayName ?? child.name ?? "Learner",
    level,
    currentLevel: level,
    dailySessionGoal: child.dailySessionGoal ?? 5,
    dailySessionCounts: child.dailySessionCounts ?? createEmptyDailySessionCounts(),
    sessionsThisWeek: child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0,
  };
}

function createEmptyDailySessionCounts() {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 6 * 86_400_000;

  return Array.from({ length: 7 }, (_, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count: 0,
  }));
}

function formatLevel(level: number | string | null | undefined) {
  if (level === undefined || level === null || level === "") {
    return "Level 1";
  }

  return typeof level === "number" ? `Level ${level}` : level;
}

function isValidBirthYear(value: string) {
  if (!/^\d{4}$/.test(value)) {
    return false;
  }

  const year = Number(value);
  const currentYear = new Date().getUTCFullYear();

  return year >= 1900 && year <= currentYear;
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    const message =
      typeof data.error === "string" ? data.error : data.error?.message ?? data.message;

    return message?.trim() || undefined;
  } catch {
    return undefined;
  }
}
