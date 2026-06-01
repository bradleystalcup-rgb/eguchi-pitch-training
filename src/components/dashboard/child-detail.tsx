"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Headphones, LoaderCircle, Settings } from "lucide-react";
import { ChildProgressCard, type ChildProgressCardProps } from "@/components/dashboard/child-progress-card";
import { SkillMatrix, type SkillMatrixItem } from "@/components/dashboard/skill-matrix";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SkillMapSnapshot } from "@/lib/training/types";

export type ChildDetailData = {
  id: string;
  name?: string;
  displayName?: string;
  level?: number | string | null;
  currentLevel?: number | string | null;
  weeklyGoalPercent?: number | null;
  sessionsThisWeek?: number | null;
  dailySessionGoal?: number | null;
  dailySessionCounts?: { date: string; count: number }[];
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
  skillMap?: SkillMapSnapshot;
  skills?: SkillMatrixItem[];
};

type ChildDetailResponse = { child?: ChildDetailData };

const defaultSkills: SkillMatrixItem[] = [
  { id: "red", label: "Red", description: "First white-key color flag", score: 0 },
  { id: "yellow", label: "Yellow", description: "Next listening target", score: 0 },
  { id: "blue", label: "Blue", description: "Builds after the first colors", score: 0 },
  { id: "black-keys", label: "Black keys", description: "Unlocks after nine colors", score: 0 },
];

function levelLabel(child: ChildDetailData) {
  const level = child.level ?? child.currentLevel ?? child.progress?.currentLevel ?? 1;
  return typeof level === "number" ? `Level ${level}` : level || "Level 1";
}

function createEmptyDailySessionCounts() {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 6 * 86_400_000;

  return Array.from({ length: 7 }, (_, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count: 0,
  }));
}

function normalizeChild(child: ChildDetailData | undefined): ChildDetailData | undefined {
  if (!child) return undefined;
  const level = child.level ?? child.currentLevel ?? child.progress?.currentLevel ?? 1;

  return {
    ...child,
    name: child.name ?? child.displayName ?? "Learner",
    level,
    currentLevel: level,
    sessionsThisWeek: child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0,
    dailySessionGoal: child.dailySessionGoal ?? 5,
    dailySessionCounts: child.dailySessionCounts ?? createEmptyDailySessionCounts(),
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

export function ChildDetail({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildDetailData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadChild() {
      try {
        const response = await fetch(`/api/children/${childId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Request failed");

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
      level: levelLabel(child),
      dailySessionGoal: child.dailySessionGoal ?? 5,
      dailySessionCounts: child.dailySessionCounts ?? createEmptyDailySessionCounts(),
    };
  }, [child]);

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

  const childName = child.name ?? child.displayName ?? "Learner";
  const dailyCounts = child.dailySessionCounts ?? createEmptyDailySessionCounts();
  const dailyGoal = child.dailySessionGoal ?? 5;
  const todayCount = dailyCounts[dailyCounts.length - 1]?.count ?? 0;
  const weeklyTotal = dailyCounts.reduce((sum, day) => sum + day.count, 0);
  const weeklyGoal = dailyGoal * dailyCounts.length;
  const completedGoalDays = dailyCounts.filter((day) => day.count >= dailyGoal).length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge tone="sky">{levelLabel(child)}</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              {childName}&apos;s Eguchi Profile
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link href={`/train/${childId}`} className={buttonVariants({ size: "lg", className: "min-w-52" })}>
              <Headphones className="size-6" aria-hidden="true" />
              Begin practice
            </Link>
            <Link href={`/dashboard/children/${childId}/settings`} className={buttonVariants({ size: "lg", variant: "ghost" })}>
              <Settings className="size-6" aria-hidden="true" />
              Settings
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white p-4">
          <div className="text-sm font-black uppercase text-sky-700">Today</div>
          <div className="mt-2 text-3xl font-black text-slate-950">{todayCount}/{dailyGoal}</div>
          <div className="text-sm font-bold text-slate-500">daily goal</div>
        </Card>
        <Card className="bg-white p-4">
          <div className="text-sm font-black uppercase text-emerald-700">This week</div>
          <div className="mt-2 text-3xl font-black text-slate-950">{weeklyTotal}/{weeklyGoal}</div>
          <div className="text-sm font-bold text-slate-500">sessions completed</div>
        </Card>
        <Card className="bg-white p-4">
          <div className="text-sm font-black uppercase text-amber-700">Goal days</div>
          <div className="mt-2 text-3xl font-black text-slate-950">{completedGoalDays}/7</div>
          <div className="text-sm font-bold text-slate-500">met this week</div>
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ChildProgressCard {...cardProps} />
        <SkillMatrix skills={child.skills?.length ? child.skills : defaultSkills} skillMap={child.skillMap} />
      </section>
    </div>
  );
}
