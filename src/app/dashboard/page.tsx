import { Mic2, PlusCircle, Stars, UserRound } from "lucide-react";
import { AppShell, FlowLink, PlaceholderCard } from "@/components/app-shell";
import { ChildProgressCard } from "@/components/dashboard/child-progress-card";
import { SkillMatrix } from "@/components/dashboard/skill-matrix";

const demoSkills = [
  { id: "red", label: "Red", description: "CEG color flag", score: 90 },
  { id: "yellow", label: "Yellow", description: "CFA color flag", score: 75 },
  { id: "blue", label: "Blue", description: "BDG color flag", score: 45 },
  { id: "black-keys", label: "Black keys", description: "Locked until nine colors", score: 10 },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PlaceholderCard
          title="Your practice dashboard"
          description="See your next pitch practice, today's tiny wins, and which chord colors need another listen."
          icon={UserRound}
          tone="green"
        />

        <section aria-labelledby="children-heading" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="children-heading" className="text-2xl font-black text-slate-950">
                Learners
              </h2>
              <p className="mt-1 font-medium text-slate-700">
                Demo routes are wired now; real child data comes later.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FlowLink
              href="/dashboard/children/demo-child"
              label="Demo learner"
              description="Open the child progress placeholder and confirm the route works."
              icon={Stars}
            />
            <FlowLink
              href="/train/demo-child"
              label="Start demo practice"
              description="Jump into the planned training route for this child."
              icon={Mic2}
            />
            <FlowLink
              href="/sign-up"
              label="Add a learner"
              description="For now, this points to account setup instead of database forms."
              icon={PlusCircle}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ChildProgressCard
            name="Demo learner"
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
