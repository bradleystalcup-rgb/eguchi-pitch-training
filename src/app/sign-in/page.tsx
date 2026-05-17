import { KeyRound } from "lucide-react";
import Link from "next/link";
import { AppShell, PlaceholderCard } from "@/components/app-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <AppShell>
      <PlaceholderCard
        title="Welcome back"
        description="Sign in to keep practicing and see each child's latest color-chord progress."
        icon={KeyRound}
        tone="blue"
      >
        <AuthForm mode="sign-in" />
        <p className="mt-6 text-sm font-bold text-slate-700">
          New here?{" "}
          <Link className="text-[#075985] underline-offset-4 hover:underline" href="/sign-up">
            Create an account
          </Link>
          .
        </p>
      </PlaceholderCard>
    </AppShell>
  );
}
