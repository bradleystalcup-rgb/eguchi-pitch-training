import Link from "next/link";
import { BookOpen, Home, Mic2, Sparkles, UserRoundPlus } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BookOpen },
  { href: "/train/demo-child", label: "Practice", icon: Mic2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fff7d6] text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <header className="border-b-4 border-[#ffd166] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-xl font-black tracking-normal text-slate-950"
            aria-label="Eguchi Pitch Training home"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-[#06d6a0] text-slate-950 shadow-sm">
              <Sparkles aria-hidden="true" className="size-6" />
            </span>
            <span>Eguchi Pitch Club</span>
          </Link>
          <nav aria-label="Main navigation">
            <ul className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#118ab2] hover:text-[#075985] focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#ef476f] px-5 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d93d63] focus:outline-none focus:ring-4 focus:ring-[#ef476f]/30"
          >
            <UserRoundPlus aria-hidden="true" className="size-4" />
            Join
          </Link>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
