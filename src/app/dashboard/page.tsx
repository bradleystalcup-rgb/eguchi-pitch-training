import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { AppShell, PlaceholderCard } from "@/components/app-shell";
import { ChildrenDashboard } from "@/components/dashboard/children-dashboard";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <AppShell isSignedIn>
      <div className="space-y-8">
        <PlaceholderCard
          title="Your practice dashboard"
          description="Manage child profiles, start practice, and see each learner's latest color-chord progress."
          icon={UserRound}
          tone="green"
        />

        <ChildrenDashboard />
      </div>
    </AppShell>
  );
}
