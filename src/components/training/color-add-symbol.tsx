import { cn } from "@/lib/utils";

type BaseColorKey = "red" | "yellow" | "blue" | "black" | "white";

const baseLabels: Record<BaseColorKey, string> = {
  red: "red",
  yellow: "yellow",
  blue: "blue",
  black: "black",
  white: "white",
};

function isBaseColorKey(value: string): value is BaseColorKey {
  return value === "red" || value === "yellow" || value === "blue" || value === "black" || value === "white";
}

function BaseSymbol({ colorKey }: { colorKey: BaseColorKey }) {
  const strokeClass = colorKey === "white" ? "stroke-slate-500" : "stroke-slate-950";
  const fillClass = colorKey === "black" ? "fill-slate-950" : "fill-none";

  return (
    <svg
      viewBox="0 0 32 32"
      aria-label={baseLabels[colorKey]}
      role="img"
      className="h-8 w-8 shrink-0 overflow-visible"
    >
      {colorKey === "red" ? (
        <path
          d="M16 5 28 27H4Z"
          className={cn(fillClass, strokeClass)}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ) : null}
      {colorKey === "yellow" ? (
        <path
          d="M7 25 25 7"
          className={strokeClass}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ) : null}
      {colorKey === "blue" ? (
        <path
          d="M6 8H26L16 25Z"
          className={cn(fillClass, strokeClass)}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ) : null}
      {colorKey === "black" ? (
        <rect x="7" y="7" width="18" height="18" rx="2.5" className={fillClass} />
      ) : null}
      {colorKey === "white" ? (
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="2.5"
          className={cn(fillClass, strokeClass)}
          strokeWidth="3.5"
        />
      ) : null}
    </svg>
  );
}

export function ColorAddSymbol({ colorKey, className }: { colorKey: string; className?: string }) {
  const parts = colorKey.split("+").filter(isBaseColorKey);

  if (!parts.length) return null;

  return (
    <span
      aria-label={`Color key: ${parts.map((part) => baseLabels[part]).join(" plus ")}`}
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
    >
      {parts.map((part) => (
        <BaseSymbol key={part} colorKey={part} />
      ))}
    </span>
  );
}
