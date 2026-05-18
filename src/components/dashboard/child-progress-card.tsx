import { CalendarDays, Headphones, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type ChildProgressCardProps = {
  name: string;
  level: string;
  weeklyGoalPercent: number;
  sessionsThisWeek: number;
  favoriteSkill: string;
};

export function ChildProgressCard({
  name,
  level,
  weeklyGoalPercent,
  sessionsThisWeek,
  favoriteSkill,
}: ChildProgressCardProps) {
  return (
    <Card className="bg-gradient-to-br from-amber-50 via-white to-sky-50">
      <CardHeader>
        <div>
          <Badge tone="amber">{level}</Badge>
          <CardTitle className="mt-3">{name}</CardTitle>
          <CardDescription>Growing steady listening habits.</CardDescription>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-pink-100 text-pink-600">
          <Star className="h-8 w-8 fill-current" aria-hidden="true" />
        </div>
      </CardHeader>

      <Progress value={weeklyGoalPercent} label="Weekly goal" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 ring-2 ring-white">
          <CalendarDays className="mb-2 h-7 w-7 text-emerald-600" aria-hidden="true" />
          <div className="text-2xl font-black text-slate-900">{sessionsThisWeek}</div>
          <div className="text-sm font-black text-slate-500">sessions this week</div>
        </div>
        <div className="rounded-3xl bg-white p-4 ring-2 ring-white">
          <Headphones className="mb-2 h-7 w-7 text-sky-600" aria-hidden="true" />
          <div className="text-2xl font-black text-slate-900">{favoriteSkill}</div>
          <div className="text-sm font-black text-slate-500">favorite skill</div>
        </div>
      </div>
    </Card>
  );
}
