import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PlaceholderCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "pink" | "yellow";
  children?: React.ReactNode;
};

const toneStyles = {
  blue: "bg-[#118ab2] text-white",
  green: "bg-[#06d6a0] text-slate-950",
  pink: "bg-[#ef476f] text-white",
  yellow: "bg-[#ffd166] text-slate-950",
};

export function PlaceholderCard({
  title,
  description,
  icon: Icon,
  tone = "blue",
  children,
}: PlaceholderCardProps) {
  return (
    <Card className="bg-white/85 p-6 shadow-[0_18px_0_rgba(15,23,42,0.08)] sm:p-8">
      <CardContent>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            className={`grid size-16 shrink-0 place-items-center rounded-3xl ${toneStyles[tone]}`}
            aria-hidden="true"
          >
            <Icon className="size-8" />
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-normal text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-lg font-medium leading-8 text-slate-700">
              {description}
            </p>
          </div>
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
