import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "answer";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-violet-400 text-violet-950 shadow-[0_8px_0_#8b5cf6] hover:bg-violet-300 active:translate-y-1 active:shadow-[0_4px_0_#8b5cf6]",
  secondary:
    "bg-pink-200 text-pink-950 shadow-[0_8px_0_#ec4899] hover:bg-pink-100 active:translate-y-1 active:shadow-[0_4px_0_#ec4899]",
  ghost:
    "bg-white/70 text-slate-700 ring-2 ring-slate-200 hover:bg-white hover:ring-slate-300",
  answer:
    "bg-white text-slate-800 ring-2 ring-slate-200 shadow-sm hover:-translate-y-0.5 hover:ring-sky-300",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 py-2 text-sm",
  md: "min-h-12 px-5 py-3 text-base",
  lg: "min-h-14 px-6 py-4 text-lg",
  icon: "h-12 w-12 p-0",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-black tracking-normal transition duration-150 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
