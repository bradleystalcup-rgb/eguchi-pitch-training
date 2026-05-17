import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColorChoice = {
  id: string;
  label: string;
  colorClass?: string;
  colorHex?: string;
  textClass?: string;
  helper?: string;
};

export function ColorChoiceGrid({
  choices,
  selectedId,
  correctId,
  disabled,
  onSelect,
}: {
  choices: ColorChoice[];
  selectedId?: string;
  correctId?: string;
  disabled?: boolean;
  onSelect?: (choice: ColorChoice) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {choices.map((choice) => {
        const isSelected = choice.id === selectedId;
        const isCorrect = choice.id === correctId;

        return (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(choice)}
            className={cn(
              "group min-h-28 rounded-3xl border-4 border-white p-3 text-left shadow-md transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed",
              choice.colorClass,
              isSelected ? "scale-[0.98] ring-4 ring-slate-900/15" : "hover:-translate-y-1",
              isCorrect ? "ring-4 ring-emerald-300" : "",
            )}
            style={choice.colorHex ? { backgroundColor: choice.colorHex } : undefined}
            aria-pressed={isSelected}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xl font-black tracking-normal text-white drop-shadow-sm">
                <span className={cn(choice.textClass)}>{choice.label}</span>
              </span>
              {isCorrect ? <CheckCircle2 className="h-7 w-7 text-white drop-shadow" /> : null}
            </span>
            {choice.helper ? (
              <span className="mt-3 block rounded-2xl bg-white/75 px-3 py-2 text-sm font-black text-slate-700">
                {choice.helper}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
