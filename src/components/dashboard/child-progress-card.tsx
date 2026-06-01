import Link from "next/link";
import { CalendarDays, Headphones, Layers, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type ChildProgressCardProps = {
  id?: string;
  name: string;
  level: string;
  sessionsCompleted: number;
  actionMode?: "links" | "none";
};

export function ChildProgressCard({
  id,
  name,
  level,
  sessionsCompleted,
  actionMode = "none",
}: ChildProgressCardProps) {
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

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 ring-2 ring-white">
          <CalendarDays className="mb-2 h-7 w-7 text-emerald-600" aria-hidden="true" />
          <div className="text-2xl font-black text-slate-900">4-5</div>
          <div className="text-sm font-black text-slate-500">daily rounds</div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-2 ring-white">
          <Headphones className="mb-2 h-7 w-7 text-sky-600" aria-hidden="true" />
          <div className="text-2xl font-black text-slate-900">2-5m</div>
          <div className="text-sm font-black text-slate-500">each round</div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-2 ring-white">
          <Headphones className="mb-2 h-7 w-7 text-pink-600" aria-hidden="true" />
          <div className="text-2xl font-black text-slate-900">{sessionsCompleted}</div>
          <div className="text-sm font-black text-slate-500">sessions done</div>
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
