import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SkillMatrixItem = {
  id: string;
  label: string;
  description: string;
  score: number;
};

export function SkillMatrix({
  skills,
}: {
  skills: SkillMatrixItem[];
}) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <div>
          <Badge tone="sky">Skill map</Badge>
          <CardTitle className="mt-3">Pitch powers</CardTitle>
          <CardDescription>Quick view of what feels strong and what needs practice.</CardDescription>
        </div>
        <Sparkles className="h-10 w-10 text-emerald-500" aria-hidden="true" />
      </CardHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((skill) => {
          const level = getLevel(skill.score);
          const Icon = skill.score >= 80 ? CheckCircle2 : Circle;

          return (
            <div
              key={skill.id}
              className={cn(
                "rounded-3xl border-4 p-4",
                level === "ready" ? "border-emerald-100 bg-emerald-50" : "",
                level === "building" ? "border-amber-100 bg-amber-50" : "",
                level === "new" ? "border-sky-100 bg-sky-50" : "",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black tracking-normal text-slate-900">{skill.label}</h3>
                  <p className="text-sm font-semibold text-slate-600">{skill.description}</p>
                </div>
                <Icon className="h-7 w-7 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="flex gap-2" aria-label={`${skill.label} score ${skill.score} percent`}>
                {[20, 40, 60, 80, 100].map((step) => (
                  <span
                    key={step}
                    className={cn(
                      "h-4 flex-1 rounded-full bg-white",
                      skill.score >= step ? "bg-gradient-to-r from-emerald-400 to-sky-400" : "",
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function getLevel(score: number) {
  if (score >= 80) return "ready";
  if (score >= 45) return "building";
  return "new";
}
