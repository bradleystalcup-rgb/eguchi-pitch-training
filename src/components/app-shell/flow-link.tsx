import Link from "next/link";
import type { LucideIcon } from "lucide-react";

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
      className="group flex min-h-28 items-start gap-4 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#118ab2] focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
    >
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
    </Link>
  );
}
