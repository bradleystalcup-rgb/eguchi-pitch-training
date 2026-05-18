import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type FlowLinkProps = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function FlowLink({ href, label, description, icon: Icon }: FlowLinkProps) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
    >
      <Card className="min-h-28 border-2 p-5 shadow-sm transition group-hover:-translate-y-1 group-hover:border-[#118ab2]">
        <CardContent className="flex items-start gap-4 space-y-0">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffd166] text-slate-950 transition group-hover:bg-[#06d6a0]"
            aria-hidden="true"
          >
            <Icon className="size-6" />
          </span>
          <span>
            <span className="block text-lg font-black text-slate-950">{label}</span>
            <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
              {description}
            </span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
