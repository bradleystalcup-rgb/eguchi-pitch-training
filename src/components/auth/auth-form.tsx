"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [status, setStatus] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(undefined);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? "Pitch parent"),
    };

    const response = await fetch(
      isSignUp ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setIsSubmitting(false);
    setStatus(
      response.ok
        ? isSignUp
          ? "Account created. You can add child profiles next."
          : "Signed in. Head to the dashboard when you are ready."
        : "That did not work yet. Check the email, password, and database setup.",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-[2rem] bg-white p-5 ring-4 ring-white/70"
    >
      {isSignUp ? (
        <label className="block">
          <span className="text-sm font-black text-slate-700">Grown-up name</span>
          <input
            name="name"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-lg font-bold text-slate-900 outline-none focus:border-sky-400"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm font-black text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          required
          className="mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-lg font-bold text-slate-900 outline-none focus:border-sky-400"
        />
      </label>
      <label className="block">
        <span className="text-sm font-black text-slate-700">Password</span>
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-lg font-bold text-slate-900 outline-none focus:border-sky-400"
        />
      </label>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}
        {isSignUp ? "Create account" : "Sign in"}
      </Button>
      {status ? <p className="text-sm font-bold text-slate-700">{status}</p> : null}
    </form>
  );
}
