import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "sky" | "green" | "amber" | "pink" | "slate";

const tones: Record<BadgeTone, string> = {
  sky: "bg-rose-100 text-rose-900 ring-rose-200",
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-100 text-amber-900 ring-amber-200",
  pink: "bg-pink-100 text-pink-800 ring-pink-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function Badge({
  className,
  tone = "sky",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 py-1 text-sm font-black ring-2",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
