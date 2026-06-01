import Link from "next/link";
import { Headphones, Layers, Star, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type DailySessionCount = {
  date: string;
  count: number;
};

export type ChildProgressCardProps = {
  id?: string;
  name: string;
  level: string;
  dailySessionGoal: number;
  dailySessionCounts: DailySessionCount[];
  actionMode?: "links" | "none";
};

function dayLabel(date: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

function DailySessionRing({
  day,
  goal,
  isToday,
}: {
  day: DailySessionCount;
  goal: number;
  isToday: boolean;
}) {
  const cappedCount = Math.min(day.count, goal);
  const percent = goal > 0 ? Math.min(100, Math.round((cappedCount / goal) * 100)) : 0;
  const isComplete = day.count >= goal;

  return (
    <div className={["relative text-center", isToday ? "w-20" : "w-14"].join(" ")}>
      <div
        className={[
          "relative grid place-items-center rounded-full bg-slate-100 shadow-inner",
          isToday ? "size-20" : "size-14",
        ].join(" ")}
        style={{ background: `conic-gradient(#10b981 ${percent}%, #e2e8f0 0)` }}
        aria-label={`${dayLabel(day.date)}: ${day.count} of ${goal} sessions`}
      >
        <div className={["grid place-items-center rounded-full bg-white font-black text-slate-950", isToday ? "size-14 text-base" : "size-10 text-sm"].join(" ")}>
          {isToday ? `${day.count}/${goal}` : day.count}
        </div>
      </div>
      {isComplete ? (
        <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-amber-300 text-amber-950 ring-2 ring-white">
          <Star className="size-3.5 fill-current" aria-hidden="true" />
        </span>
      ) : null}
      <div className="mt-2 text-xs font-black uppercase text-slate-500">{dayLabel(day.date)}</div>
    </div>
  );
}

export function ChildProgressCard({
  id,
  name,
  level,
  dailySessionGoal,
  dailySessionCounts,
  actionMode = "none",
}: ChildProgressCardProps) {
  const days = dailySessionCounts.length ? dailySessionCounts.slice(-7) : [];
  const todayIndex = days.length - 1;

  return (
    <Card className="bg-gradient-to-br from-amber-50 via-white to-sky-50">
      <CardHeader>
        <div>
          <Badge tone="amber">{level}</Badge>
          <CardTitle className="mt-3">{name}</CardTitle>
        </div>
        <div className="flex min-w-24 flex-col items-end rounded-2xl bg-white/80 px-3 py-2 text-right ring-2 ring-white">
          <Layers className="mb-1 size-5 text-sky-600" aria-hidden="true" />
          <span className="text-xs font-black uppercase text-slate-500">Current</span>
          <span className="text-lg font-black text-slate-950">{level}</span>
        </div>
      </CardHeader>

      <div className="rounded-3xl bg-white/75 p-4 ring-2 ring-white">
        <div className="flex items-end justify-between gap-3 overflow-x-auto pb-1">
          {days.map((day, index) => (
            <DailySessionRing
              key={day.date}
              day={day}
              goal={dailySessionGoal}
              isToday={index === todayIndex}
            />
          ))}
        </div>
      </div>

      {actionMode === "links" && id ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/dashboard/children/${id}`}
            className={buttonVariants({ variant: "ghost", className: "h-auto min-h-14 justify-start px-4 text-left" })}
          >
            <UserRound className="size-5 shrink-0" aria-hidden="true" />
            <span>{name}&apos;s page</span>
          </Link>
          <Link
            href={`/train/${id}`}
            className={buttonVariants({ className: "h-auto min-h-14 justify-start px-4 text-left" })}
          >
            <Headphones className="size-5 shrink-0" aria-hidden="true" />
            <span>Start practice</span>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
