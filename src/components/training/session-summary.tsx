import { Award, Heart, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SessionSummary({
  childName,
  correct,
  total,
  minutes,
  streak,
}: {
  childName: string;
  correct: number;
  total: number;
  minutes: number;
  streak: number;
}) {
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-white to-pink-50">
      <CardHeader>
        <div>
          <Badge tone="green">Session done</Badge>
          <CardTitle className="mt-3">{childName}&apos;s sound quest</CardTitle>
          <CardDescription>Short, focused practice with clear wins.</CardDescription>
        </div>
        <Award className="h-11 w-11 text-amber-500" aria-hidden="true" />
      </CardHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat icon={<Music2 className="h-6 w-6" />} label="Right notes" value={`${correct}/${total}`} />
        <SummaryStat icon={<Heart className="h-6 w-6" />} label="Practice" value={`${minutes} min`} />
        <SummaryStat icon={<Award className="h-6 w-6" />} label="Streak" value={`${streak} days`} />
      </div>

      <Progress className="mt-5" value={score} label="Listening power" />
    </Card>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-4 ring-2 ring-white">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        {icon}
      </div>
      <div className="text-sm font-black uppercase tracking-normal text-slate-500">{label}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}
