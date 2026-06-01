import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ChildSettings } from "@/components/dashboard/child-settings";
import { auth } from "@/lib/auth";

export default async function ChildSettingsPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const { childId } = await params;

  return (
    <AppShell isSignedIn>
      <div className="space-y-8">
        <Link
          href={`/dashboard/children/${childId}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#118ab2] focus:outline-none focus:ring-4 focus:ring-[#118ab2]/25"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to profile
        </Link>

        <ChildSettings childId={childId} />
      </div>
    </AppShell>
  );
}
