import type { HTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "danger";

const tones: Record<AlertTone, string> = {
  info: "bg-sky-50 text-sky-900 ring-sky-100",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-100",
  danger: "bg-red-50 text-red-800 ring-red-100",
};

const icons = {
  info: Info,
  success: CheckCircle2,
  danger: AlertCircle,
};

export function Alert({
  className,
  tone = "info",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const Icon = icons[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-bold ring-2",
        tones[tone],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{props.children}</div>
    </div>
  );
}
