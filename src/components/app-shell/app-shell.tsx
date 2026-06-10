import Link from "next/link";
import Image from "next/image";
import { Code2, LayoutDashboard, LogIn, UserRoundPlus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";

export function AppShell({
  children,
  isSignedIn = false,
}: {
  children: React.ReactNode;
  isSignedIn?: boolean;
}) {
  return (
    <div className="min-h-screen bg-rose-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <header className="border-b-4 border-rose-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-3 text-xl font-black tracking-normal text-slate-950"
            aria-label="Pitch Patch home"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 shadow-sm ring-2 ring-rose-200">
              <Image
                src="/brand/pitch-patch-logo-tight.png"
                alt=""
                width={32}
                height={44}
                aria-hidden="true"
                className="h-10 w-auto object-contain"
              />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span>Pitch Patch</span>
              <span className="mt-1 hidden text-xs font-black text-rose-700 sm:block">
                Nurturing young musical ears
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {!isSignedIn ? (
              <Link
                href="/sign-in"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "hidden rounded-full bg-white/85 text-rose-950 ring-rose-200 sm:inline-flex",
                })}
              >
                <LogIn aria-hidden="true" className="size-4" />
                Login
              </Link>
            ) : null}
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-up"}
              className={buttonVariants({
                variant: "primary",
                size: "sm",
                className: "rounded-full bg-rose-500 text-white shadow-[0_6px_0_#be123c] hover:bg-rose-400",
              })}
            >
              {isSignedIn ? (
                <LayoutDashboard aria-hidden="true" className="size-4" />
              ) : (
                <UserRoundPlus aria-hidden="true" className="size-4" />
              )}
              {isSignedIn ? "Dashboard" : "Join"}
            </Link>
            {isSignedIn ? <SignOutButton /> : null}
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t-4 border-rose-100 bg-white/75">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm font-bold text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Pitch Patch is an open-source ear-training project.</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-3">
            <Link href="/" className="hover:text-rose-700">
              Home
            </Link>
            <Link href="/sign-in" className="hover:text-rose-700">
              Login
            </Link>
            <Link href="https://github.com/bradleystalcup-rgb/eguchi-pitch-training" className="inline-flex items-center gap-1 hover:text-rose-700">
              <Code2 aria-hidden="true" className="size-4" />
              GitHub
            </Link>
            <Link href="https://bradstalcup.com" className="hover:text-rose-700">
              Brad Stalcup
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
