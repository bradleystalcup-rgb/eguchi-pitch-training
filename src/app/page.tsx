import { ArrowRight, BookOpen, Mic2, Palette } from "lucide-react";
import Link from "next/link";
import { AppShell, FlowLink, PlaceholderCard } from "@/components/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PlaceholderCard
          title="Eguchi Pitch Training"
          description="Practice your pitch with quick chord games, bright color flags, and parent-tracked progress."
          icon={Palette}
          tone="yellow"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ef476f] px-6 py-3 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d93d63] focus:outline-none focus:ring-4 focus:ring-[#ef476f]/30"
            >
              Start a family account
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-base font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-[#118ab2] focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
            >
              Sign in
            </Link>
          </div>
        </PlaceholderCard>

        <section aria-labelledby="flow-heading" className="space-y-4">
          <h2 id="flow-heading" className="text-2xl font-black text-slate-950">
            Planned path
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <FlowLink
              href="/dashboard"
              label="Pick a learner"
              description="A grown-up dashboard will show child profiles and practice streaks."
              icon={BookOpen}
            />
            <FlowLink
              href="/dashboard/children/demo-child"
              label="See the journey"
              description="Each child will have a simple progress page with next steps."
              icon={Palette}
            />
            <FlowLink
              href="/train/demo-child"
              label="Try practice"
              description="Training will live here when the listening and singing tools are ready."
              icon={Mic2}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
