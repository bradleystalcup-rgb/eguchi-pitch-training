import Link from "next/link";
import { BookOpen, Home, Sparkles, UserRoundPlus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BookOpen },
];

export function AppShell({
  children,
  isSignedIn = false,
}: {
  children: React.ReactNode;
  isSignedIn?: boolean;
}) {
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
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: "rounded-full shadow-sm",
                      })}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex flex-wrap gap-2">
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-up"}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "rounded-full shadow-sm",
              })}
            >
              <UserRoundPlus aria-hidden="true" className="size-4" />
              {isSignedIn ? "Learners" : "Join"}
            </Link>
            {isSignedIn ? <SignOutButton /> : null}
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
