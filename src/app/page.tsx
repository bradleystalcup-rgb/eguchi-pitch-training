import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Ear,
  Heart,
  Leaf,
  Palette,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  const trainingSteps = [
    {
      title: "Create a learner profile",
      description: "Set up a child profile so practice history, settings, and level progress stay organized.",
      icon: Sparkles,
    },
    {
      title: "Hear a chord",
      description: "Pitch Patch plays a short color-coded chord prompt during a focused listening round.",
      icon: Ear,
    },
    {
      title: "Choose the color",
      description: "Your child picks the matching color, keeping the task visual, fast, and kid-friendly.",
      icon: Palette,
    },
    {
      title: "Repeat short sessions",
      description: "Small sessions make it easier to practice consistently without turning it into homework.",
      icon: Leaf,
    },
  ];
  const heroNotes = [
    "Playful ear training for young musicians",
    "Short daily sessions that fit family routines",
    "Parent-guided progress for each learner",
  ];
  const dashboardFeatures = [
    {
      title: "Learner profiles",
      description: "Keep each child's practice settings and training level separate.",
      icon: ShieldCheck,
    },
    {
      title: "Daily goals",
      description: "See recent session counts against a simple practice target.",
      icon: Target,
    },
    {
      title: "Progress signals",
      description: "Track accuracy, level progress, and practice history from one place.",
      icon: BarChart3,
    },
    {
      title: "Practice controls",
      description: "Adjust color keys, warmups, hotkeys, sound engine, and answer flow per child.",
      icon: Settings2,
    },
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
                  Perfect pitch is not just an innate gift. Short, colorful chord
                  games help parents nurture a child&apos;s ear with simple daily practice.
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

        <section
          aria-labelledby="how-it-works-heading"
          className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_36px_rgba(159,18,57,0.08)] ring-1 ring-rose-100"
        >
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="bg-rose-900 p-6 text-white sm:p-8">
              <Badge tone="pink" className="bg-white/12 text-rose-50 ring-white/20">
                How it works
              </Badge>
              <h2 id="how-it-works-heading" className="mt-4 text-3xl font-black sm:text-4xl">
                A short training process families can repeat.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-rose-100">
                Pitch Patch is built around a predictable listening loop: hear a chord,
                make a color choice, and repeat in short sessions. The process is simple
                enough for young learners and structured enough for parents to guide.
              </p>
              <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm font-black uppercase tracking-normal text-amber-200">
                  Training focus
                </p>
                <p className="mt-2 text-lg font-black leading-7">
                  Build recognition through repeated chord-to-color associations.
                </p>
              </div>
            </div>
            <div className="grid gap-4 bg-rose-50/55 p-5 sm:p-7">
              {trainingSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="grid gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(159,18,57,0.07)] sm:grid-cols-[auto_1fr]"
                  >
                    <div className="flex items-center gap-3 sm:block">
                      <div className="grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
                        <Icon aria-hidden="true" className="size-6" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-normal text-rose-500 sm:mt-3 sm:block">
                        Step {index + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-rose-950">{step.title}</h3>
                      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-[linear-gradient(135deg,#ffffff,#fff7ed)] p-5 shadow-[0_12px_34px_rgba(159,18,57,0.08)] ring-1 ring-amber-100 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
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
              {dashboardFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article key={feature.title} className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(159,18,57,0.07)]">
                    <Icon aria-hidden="true" className="mb-3 size-6 text-rose-700" />
                    <h3 className="text-lg font-black text-rose-950">{feature.title}</h3>
                    <p className="mt-2 font-semibold leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
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
