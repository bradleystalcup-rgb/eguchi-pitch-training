import { ArrowRight, Ear, Heart, Leaf, Music2, Palette, ShieldCheck } from "lucide-react";
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

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-rose-100 px-5 py-8 shadow-[0_18px_60px_rgba(190,18,60,0.16)] sm:px-8 lg:min-h-[560px] lg:px-12 lg:py-12">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(253,230,138,0.8),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(134,239,172,0.45),transparent_24%),linear-gradient(135deg,#fff1f2,#ffe4e6_45%,#fff7ed)]" />
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-6">
              <Badge tone="pink" className="bg-white/80 text-rose-900 ring-rose-200">
                Pitch Patch
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-balance text-5xl font-black leading-[0.95] tracking-normal text-rose-950 sm:text-6xl lg:text-7xl">
                  Perfect pitch is not just a gift.
                </h1>
                <p className="max-w-2xl text-pretty text-xl font-bold leading-8 text-rose-950/80">
                  Pitch Patch nurtures young musical ears with short, colorful chord games
                  inspired by the Japanese Eguchi training method.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className={buttonVariants({
                    variant: "primary",
                    size: "lg",
                    className: "rounded-full bg-rose-400 text-white shadow-[0_8px_0_#be123c] hover:bg-rose-300",
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

            <div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center rounded-full bg-white/65 p-8 ring-4 ring-white/80">
              <div className="absolute left-8 top-14 size-16 rounded-full bg-amber-200/80" />
              <div className="absolute bottom-12 right-12 size-20 rounded-full bg-emerald-200/80" />
              <Image
                src="/brand/pitch-patch-grow.gif"
                alt="Pitch Patch strawberry music note logo"
                width={360}
                height={360}
                unoptimized
                priority
                className="relative h-auto w-full max-w-[320px] object-contain drop-shadow-[0_18px_28px_rgba(159,18,57,0.22)]"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-3xl border-4 border-white bg-white/88 p-6 shadow-[0_14px_34px_rgba(159,18,57,0.10)]"
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
        </section>

        <section className="grid gap-4 rounded-[2rem] bg-white/80 p-5 shadow-[0_14px_40px_rgba(159,18,57,0.10)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div className="space-y-3">
            <Badge tone="amber" className="bg-amber-100 text-amber-900 ring-amber-200">
              Why it works
            </Badge>
            <h2 className="text-balance text-3xl font-black text-rose-950 sm:text-4xl">
              A colorful practice patch for absolute-pitch identification.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-rose-50 p-5">
              <Music2 aria-hidden="true" className="mb-3 size-6 text-rose-700" />
              <h3 className="text-lg font-black text-rose-950">Method-inspired</h3>
              <p className="mt-2 font-semibold leading-7 text-slate-600">
                Practice follows a chord-and-color progression inspired by Japanese
                music trainers, with new sounds added gradually.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <ShieldCheck aria-hidden="true" className="mb-3 size-6 text-amber-700" />
              <h3 className="text-lg font-black text-rose-950">Parent-visible</h3>
              <p className="mt-2 font-semibold leading-7 text-slate-600">
                Families can track daily practice, level progress, and room settings
                from a simple learner dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-rose-900 px-5 py-8 text-white shadow-[0_16px_44px_rgba(136,19,55,0.24)] sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Heart aria-hidden="true" className="mb-3 size-7 text-amber-200" />
              <h2 className="text-3xl font-black">Start your family patch.</h2>
              <p className="mt-2 max-w-2xl font-semibold text-rose-100">
                Create a free account, add a learner, and begin with short listening
                sessions designed for growing ears.
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
