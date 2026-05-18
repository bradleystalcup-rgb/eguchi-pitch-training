"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Mic2, PlusCircle, Sparkles } from "lucide-react";
import { FlowLink } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChildProgressCard } from "@/components/dashboard/child-progress-card";

export type ChildSummary = {
  id: string;
  name?: string;
  displayName?: string;
  birthYear?: number | null;
  level?: number | string | null;
  currentLevel?: number | string | null;
  weeklyGoalPercent?: number | null;
  sessionsThisWeek?: number | null;
  favoriteSkill?: string | null;
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
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : "We could not add that child. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const hasChildren = children.length > 0;

  return (
    <section aria-labelledby="children-heading" className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="children-heading" className="text-2xl font-black text-slate-950">
            Learners
          </h2>
          <p className="mt-1 font-medium text-slate-700">
            Add a child profile, then open their progress or start a short practice round.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="sm:min-w-96"
          noValidate
        >
          <Card className="border-2 p-4 shadow-sm">
            <CardContent className="gap-2 space-y-2">
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
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
                <div>
                  <Label htmlFor="child-birth-year">Birth year</Label>
                  <Input
                    id="child-birth-year"
                    value={birthYear}
                    onChange={(event) => setBirthYear(event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    aria-invalid={Boolean(formError)}
                    aria-describedby={formError ? "child-name-error" : undefined}
                    className="mt-2 min-h-12"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <PlusCircle className="size-5" aria-hidden="true" />
                  )}
                  {isCreating ? "Adding" : "Add learner"}
                </Button>
              </div>
              {formError ? (
                <Alert id="child-name-error" tone="danger">
                  {formError}
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </form>
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

      {!isLoading && !error && !hasChildren ? <EmptyChildrenState /> : null}

      {hasChildren ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {children.map((child) => (
            <ChildCard key={child.id} child={normalizeChild(child)} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function EmptyChildrenState() {
  return (
    <Card className="border-dashed border-sky-200 p-8">
      <CardHeader className="mb-0 justify-start">
        <Sparkles className="size-10 text-emerald-500" aria-hidden="true" />
        <div>
          <CardTitle>No learners yet</CardTitle>
          <CardDescription className="mt-2 max-w-2xl leading-7">
            Create the first child profile to unlock the learner page and training room.
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function ChildCard({ child }: { child: ChildSummary }) {
  const childName = child.name ?? child.displayName ?? "Learner";
  const levelLabel = useMemo(() => {
    const level = child.level ?? child.currentLevel ?? child.progress?.currentLevel;

    if (level === undefined || level === null || level === "") {
      return "Level 1";
    }

    return typeof level === "number" ? `Level ${level}` : level;
  }, [child.currentLevel, child.level, child.progress?.currentLevel]);

  return (
    <div className="space-y-3">
      <ChildProgressCard
        name={childName}
        level={levelLabel}
        weeklyGoalPercent={child.weeklyGoalPercent ?? child.progress?.recentAccuracy ?? 0}
        sessionsThisWeek={child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0}
        favoriteSkill={child.favoriteSkill ?? "First color"}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <FlowLink
          href={`/dashboard/children/${child.id}`}
          label={`${childName}'s page`}
          description="Review progress and next practice steps."
          icon={Sparkles}
        />
        <FlowLink
          href={`/train/${child.id}`}
          label="Start practice"
          description="Open this child's training room."
          icon={Mic2}
        />
      </div>
    </div>
  );
}

function normalizeChild(child: ChildSummary): ChildSummary {
  return {
    ...child,
    name: child.name ?? child.displayName ?? "Learner",
    displayName: child.displayName ?? child.name ?? "Learner",
    level: child.level ?? child.currentLevel ?? child.progress?.currentLevel ?? 1,
    weeklyGoalPercent: child.weeklyGoalPercent ?? child.progress?.recentAccuracy ?? 0,
    sessionsThisWeek: child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0,
  };
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
