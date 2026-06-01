import { Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SkillMapChordRow, SkillMapSnapshot } from "@/lib/training/types";

export type SkillMatrixItem = {
  id: string;
  label: string;
  description: string;
  score: number;
};

function fallbackSkillMap(skills: SkillMatrixItem[]): SkillMapSnapshot {
  return {
    requiredPerfectSessionStreak: 5,
    mastered: [],
    current: skills.map((skill) => ({
      slug: skill.id,
      label: skill.label,
      colorName: skill.label,
      colorHex: "#e2e8f0",
      streak: Math.min(5, Math.floor(skill.score / 20)),
      required: 5,
      status: skill.score >= 100 ? "mastered" : "current",
    })),
    next: null,
  };
}

function StreakSegments({ streak, required }: { streak: number; required: number }) {
  return (
    <div className="flex gap-1.5" aria-label={`${streak} of ${required} perfect-session streak`}>
      {Array.from({ length: required }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-3 flex-1 rounded-full bg-slate-100",
            index < streak ? "bg-gradient-to-r from-emerald-400 to-sky-400" : "",
          )}
        />
      ))}
    </div>
  );
}

function SkillRow({ row }: { row: SkillMapChordRow }) {
  const isMastered = row.status === "mastered";

  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="size-9 shrink-0 rounded-full border-2 border-white shadow-sm ring-2 ring-slate-100"
            style={{ backgroundColor: row.colorHex }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950">{row.label}</h3>
            <p className="text-xs font-bold text-slate-500">{row.streak}/{row.required} perfect sessions</p>
          </div>
        </div>
        {isMastered ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-300 text-amber-950">
            <Star className="size-4 fill-current" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <StreakSegments streak={Math.min(row.streak, row.required)} required={row.required} />
    </div>
  );
}

export function SkillMatrix({
  skills = [],
  skillMap,
}: {
  skills?: SkillMatrixItem[];
  skillMap?: SkillMapSnapshot;
}) {
  const map = skillMap ?? fallbackSkillMap(skills);
  const rows = [...map.mastered, ...map.current];
  const next = map.next;

  return (
    <Card className="bg-white">
      <CardHeader>
        <div>
          <Badge tone="sky">Skill map</Badge>
          <CardTitle className="mt-3">Chord mastery</CardTitle>
          <CardDescription>
            Get a streak of {map.requiredPerfectSessionStreak} perfect sessions before moving to the next chord.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {rows.map((row) => (
          <SkillRow key={row.slug} row={row} />
        ))}

        {next ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-slate-500">
            <div className="flex items-center gap-3">
              <span
                className="size-9 shrink-0 rounded-full border-2 border-white opacity-35 shadow-sm grayscale"
                style={{ backgroundColor: next.colorHex }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-black text-slate-700">{next.label}</h3>
                <p className="text-xs font-bold">Unlock the next chord after you get a streak of {next.required}.</p>
              </div>
              <Lock className="size-5 shrink-0" aria-hidden="true" />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
