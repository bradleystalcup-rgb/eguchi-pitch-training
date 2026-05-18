"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SessionTrainer } from "@/components/training/session-trainer";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

type ChildData = {
  id: string;
  name?: string;
  displayName?: string;
  level?: number | null;
  currentLevel?: number | null;
  progress?: { currentLevel?: number | null } | null;
};

type ChildResponse = { child?: ChildData };

export function ChildTrainingRoom({ childId }: { childId: string }) {
  const [child, setChild] = useState<{ name: string; level?: number | null }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadChild() {
      try {
        const response = await fetch(`/api/children/${childId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as ChildResponse;
        const nextChild = data.child;
        setChild(
          nextChild
            ? {
                name: nextChild.name ?? nextChild.displayName ?? "Learner",
                level: nextChild.level ?? nextChild.currentLevel ?? nextChild.progress?.currentLevel ?? 1,
              }
            : undefined,
        );
      } catch {
        setError("We could not load this child profile.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadChild();
  }, [childId]);

  if (isLoading) {
    return (
      <Card className="inline-flex items-center gap-2 p-6 text-base font-bold text-slate-700">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Loading practice room...
      </Card>
    );
  }

  if (error || !child) {
    return (
      <Alert role="alert" tone="danger">
        {error ?? "This child profile was not found."}
      </Alert>
    );
  }

  return <SessionTrainer childName={child.name} level={child.level ?? 1} />;
}
