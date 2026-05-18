"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, LoaderCircle, Mic2 } from "lucide-react";
import { FlowLink } from "@/components/app-shell";
import { ChildProgressCard, type ChildProgressCardProps } from "@/components/dashboard/child-progress-card";
import { SkillMatrix, type SkillMatrixItem } from "@/components/dashboard/skill-matrix";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

type ChildDetailData = {
  id: string;
  name?: string;
  displayName?: string;
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
  skills?: SkillMatrixItem[];
};

type ChildDetailResponse = { child?: ChildDetailData };

const defaultSkills: SkillMatrixItem[] = [
  { id: "red", label: "Red", description: "First white-key color flag", score: 0 },
  { id: "yellow", label: "Yellow", description: "Next listening target", score: 0 },
  { id: "blue", label: "Blue", description: "Builds after the first colors", score: 0 },
  { id: "black-keys", label: "Black keys", description: "Unlocks after nine colors", score: 0 },
];

export function ChildDetail({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildDetailData>();
  const [isLoading, setIsLoading] = useState(true);
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
      weeklyGoalPercent: child.weeklyGoalPercent ?? child.progress?.recentAccuracy ?? 0,
      sessionsThisWeek: child.sessionsThisWeek ?? child.progress?.sessionsCompleted ?? 0,
      favoriteSkill: child.favoriteSkill ?? "First color",
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

  return (
    <div className="space-y-8">
      <section aria-labelledby="next-heading" className="grid gap-4 md:grid-cols-2">
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
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ChildProgressCard {...cardProps} />
        <SkillMatrix skills={child.skills?.length ? child.skills : defaultSkills} />
      </section>
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
  };
}

function readChildDetail(data: ChildDetailResponse): ChildDetailData | undefined {
  return data.child;
}
