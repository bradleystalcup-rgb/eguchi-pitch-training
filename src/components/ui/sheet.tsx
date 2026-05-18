"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-slate-950/40"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function SheetContent({
  className,
  children,
  onClose,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  onClose: () => void;
}) {
  return (
    <aside
      className={cn(
        "absolute right-0 top-0 flex h-full w-full max-w-sm flex-col gap-5 bg-white p-5 shadow-2xl",
        className,
      )}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      <div className="flex justify-end">
        <Button size="icon" variant="ghost" aria-label="Close settings" onClick={onClose}>
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>
      {children}
    </aside>
  );
}

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-2xl font-black text-slate-950", className)} {...props} />;
}

export function SheetDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm font-bold text-slate-600", className)} {...props} />;
}
