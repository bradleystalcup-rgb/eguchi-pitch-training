import { ArrowLeft, BarChart3, Mic2, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell, FlowLink, PlaceholderCard } from "@/components/app-shell";
import { ChildProgressCard } from "@/components/dashboard/child-progress-card";
import { SkillMatrix } from "@/components/dashboard/skill-matrix";

const demoSkills = [
  { id: "red", label: "Red", description: "CEG color flag", score: 90 },
  { id: "yellow", label: "Yellow", description: "CFA color flag", score: 75 },
  { id: "blue", label: "Blue", description: "BDG color flag", score: 45 },
  { id: "black-keys", label: "Black keys", description: "Locked until nine colors", score: 10 },
];

export default async function ChildDashboardPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const childName = childId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <AppShell>
      <div className="space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#118ab2] focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to dashboard
        </Link>

        <PlaceholderCard
          title={`${childName || "Learner"}'s pitch path`}
          description="This child page shows the next friendly challenge, practice rhythm, and chord-color progress."
          icon={Sparkles}
          tone="pink"
        />

        <section aria-labelledby="next-heading" className="grid gap-4 md:grid-cols-2">
          <h2 id="next-heading" className="sr-only">
            Next steps
          </h2>
          <FlowLink
            href={`/train/${childId}`}
            label="Begin practice"
            description="Open the training placeholder for this learner."
            icon={Mic2}
          />
          <FlowLink
            href="/dashboard"
            label="Progress will appear here"
            description="Scores and lesson history are intentionally left for later app work."
            icon={BarChart3}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ChildProgressCard
            name={childName || "Learner"}
            level="Level 2"
            weeklyGoalPercent={35}
            sessionsThisWeek={3}
            favoriteSkill="Red"
          />
          <SkillMatrix skills={demoSkills} />
        </section>
      </div>
    </AppShell>
  );
}
