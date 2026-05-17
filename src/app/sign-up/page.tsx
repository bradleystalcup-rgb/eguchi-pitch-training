import { UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { AppShell, PlaceholderCard } from "@/components/app-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <AppShell>
      <PlaceholderCard
        title="Start a family account"
        description="Create a parent account, then add child profiles for short daily practice."
        icon={UserRoundPlus}
        tone="green"
      >
        <AuthForm mode="sign-up" />
        <p className="mt-6 text-sm font-bold text-slate-700">
          Already have an account?{" "}
          <Link className="text-[#075985] underline-offset-4 hover:underline" href="/sign-in">
            Sign in
          </Link>
          .
        </p>
      </PlaceholderCard>
    </AppShell>
  );
}
