import { ArrowLeft, Mic2 } from "lucide-react";
import Link from "next/link";
import { AppShell, PlaceholderCard } from "@/components/app-shell";
import { SessionTrainer } from "@/components/training/session-trainer";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  return (
    <AppShell>
      <div className="space-y-8">
        <Link
          href={`/dashboard/children/${childId}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#118ab2] focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to learner page
        </Link>

        <PlaceholderCard
          title="Practice room"
          description="Warm up your ears with a short color flag round. Listen first, then tap the matching color."
          icon={Mic2}
          tone="blue"
        />

        <SessionTrainer childName={childId === "demo-child" ? "Demo learner" : "Pitch pal"} />
      </div>
    </AppShell>
  );
}
