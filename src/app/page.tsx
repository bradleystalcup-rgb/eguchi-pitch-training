import { ArrowRight, BarChart3, CheckCircle2, Ear, Heart, Leaf, Palette, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  const steps = [
    {
      title: "Listen",
      description: "Children hear short color-coded chords in focused practice sessions.",
      icon: Ear,
    },
    {
      title: "Choose",
      description: "Big friendly color choices keep attention on hearing, not reading instructions.",
      icon: Palette,
    },
    {
      title: "Grow",
      description: "Progress unlocks steadily as learners build perfect-session streaks.",
      icon: Leaf,
    },
  ];
  const heroNotes = [
    "Playful ear training for young musicians",
    "Short daily sessions that fit family routines",
    "Parent-guided progress for each learner",
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-rose-100 px-5 py-7 shadow-[0_14px_44px_rgba(190,18,60,0.12)] sm:px-8 lg:px-10 lg:py-9">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#fff1f2,#ffe4e6_52%,#fff7ed)]" />
          <div className="grid gap-7 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="max-w-3xl text-balance text-5xl font-black leading-none tracking-normal text-rose-950 sm:text-6xl lg:text-7xl">
                  Pitch Patch
                </h1>
                <p className="max-w-2xl text-pretty text-xl font-bold leading-8 text-rose-950/80 sm:text-2xl">
                  Short, colorful chord games that help parents nurture a child&apos;s
                  ear for pitch with simple daily practice.
                </p>
                <p className="max-w-2xl text-base font-semibold leading-7 text-slate-700">
                  Create a learner profile, start a listening session, and watch progress
                  build as your child connects chord sounds with bright color choices.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className={buttonVariants({
                    variant: "primary",
                    size: "lg",
                    className: "rounded-full bg-rose-500 text-white shadow-[0_8px_0_#be123c] hover:bg-rose-400",
                  })}
                >
                  Create a FREE account
                  <ArrowRight aria-hidden="true" className="size-5" />
                </Link>
                <Link
                  href="/sign-in"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "lg",
                    className: "rounded-full bg-white/85 text-rose-950 ring-rose-200",
                  })}
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="relative rounded-[1.5rem] bg-white/76 p-5 shadow-[0_10px_30px_rgba(159,18,57,0.08)] ring-4 ring-white/80 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-normal text-rose-700">
                    Built for practice
                  </p>
                  <h2 className="mt-2 max-w-xs text-2xl font-black leading-tight text-rose-950">
                    Start with listening, then make progress visible.
                  </h2>
                </div>
                <Image
                  src="/brand/pitch-patch-logo-tight.png"
                  alt="Pitch Patch strawberry music note logo"
                  width={86}
                  height={132}
                  priority
                  className="h-24 w-auto shrink-0 object-contain drop-shadow-[0_10px_16px_rgba(159,18,57,0.16)]"
                />
              </div>
              <ul className="mt-6 space-y-3">
                {heroNotes.map((note) => (
                  <li key={note} className="flex gap-3 rounded-2xl bg-rose-50/80 p-3 text-base font-bold leading-6 text-slate-700">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="how-it-works-heading" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge tone="pink">How it works</Badge>
              <h2 id="how-it-works-heading" className="mt-3 text-3xl font-black text-rose-950">
                A simple loop kids can repeat.
              </h2>
            </div>
            <p className="max-w-xl text-base font-semibold leading-7 text-slate-600">
              The practice flow stays short and predictable so families can build a habit.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-2xl border-4 border-white bg-white/88 p-6 shadow-[0_10px_28px_rgba(159,18,57,0.08)]"
              >
                <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
                  <Icon aria-hidden="true" className="size-6" />
                </div>
                <h2 className="text-2xl font-black text-rose-950">{step.title}</h2>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            );
          })}
          </div>
        </section>

        <section className="grid gap-5 rounded-[1.75rem] bg-white/82 p-5 shadow-[0_12px_32px_rgba(159,18,57,0.09)] lg:grid-cols-[0.95fr_1.05fr] lg:p-7">
          <div className="space-y-3">
            <Badge tone="amber" className="bg-amber-100 text-amber-900 ring-amber-200">
              Parent dashboard
            </Badge>
            <h2 className="text-balance text-3xl font-black text-rose-950 sm:text-4xl">
              See what happened after practice.
            </h2>
            <p className="text-base font-semibold leading-7 text-slate-600">
              Pitch Patch gives parents enough structure to guide practice without
              turning a short session into homework.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-rose-50 p-5">
              <BarChart3 aria-hidden="true" className="mb-3 size-6 text-rose-700" />
              <h3 className="text-lg font-black text-rose-950">Progress at a glance</h3>
              <p className="mt-2 font-semibold leading-7 text-slate-600">
                Track learner profiles, daily session goals, accuracy, and level
                progress from one parent-friendly dashboard.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <ShieldCheck aria-hidden="true" className="mb-3 size-6 text-amber-700" />
              <h3 className="text-lg font-black text-rose-950">Built for routine</h3>
              <p className="mt-2 font-semibold leading-7 text-slate-600">
                Keep practice focused with colorful choices, short sessions, and
                settings that can be adjusted per child.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-rose-900 px-5 py-7 text-white shadow-[0_14px_38px_rgba(136,19,55,0.22)] sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex gap-2 text-amber-200">
                <Heart aria-hidden="true" className="size-7" />
                <Sparkles aria-hidden="true" className="size-7" />
              </div>
              <h2 className="text-3xl font-black">Start your first listening session.</h2>
              <p className="mt-2 max-w-2xl font-semibold text-rose-100">
                Create a free parent account, add a learner, and begin with a short
                color-chord game today.
              </p>
            </div>
            <Link
              href="/sign-up"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "rounded-full bg-emerald-200 text-emerald-950 shadow-[0_8px_0_#16a34a]",
              })}
            >
              Create a FREE account
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
