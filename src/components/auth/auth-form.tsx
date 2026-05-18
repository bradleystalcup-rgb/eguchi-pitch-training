"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "sign-in" | "sign-up";
type FieldErrors = Partial<Record<"name" | "email" | "password" | "form", string>>;
type AuthErrorResponse = {
  message?: string;
  error?: { message?: string } | string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const nextErrors = validateFields(formData, isSignUp);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? "Pitch parent").trim(),
    };

    try {
      const response = await fetch(
        isSignUp ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const apiMessage = await readAuthError(response);
        setErrors({
          form:
            apiMessage ??
            (isSignUp
              ? "We could not create that account. Try another email or check the password."
              : "That email and password did not match an account."),
        });
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Something went wrong. Check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-xl"
      aria-describedby="auth-status"
    >
      <Card className="border-2 p-5 shadow-sm">
        <CardContent>
          {isSignUp ? (
            <FormField
              label="Grown-up name"
              name="name"
              autoComplete="name"
              error={errors.name}
            />
          ) : null}
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            error={errors.email}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            error={errors.password}
          />

          <div id="auth-status" aria-live="polite">
            {errors.form ? (
              <Alert role="alert" tone="danger">
                {errors.form}
              </Alert>
            ) : null}
            {isSubmitting ? (
              <p className="sr-only">{isSignUp ? "Creating account" : "Signing in"}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Please wait" : isSignUp ? "Create account" : "Sign in"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  error,
}: {
  label: string;
  name: "name" | "email" | "password";
  type?: string;
  autoComplete?: string;
  minLength?: number;
  error?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <div className="block">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        minLength={minLength}
        required
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 text-lg"
      />
      {error ? (
        <span id={errorId} className="mt-2 block text-sm font-bold text-red-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}

async function readAuthError(response: Response) {
  try {
    const data = (await response.json()) as AuthErrorResponse;
    const message =
      typeof data.error === "string" ? data.error : data.error?.message ?? data.message;

    return message?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function validateFields(formData: FormData, isSignUp: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (isSignUp && name.length < 2) {
    errors.name = "Enter the grown-up's name.";
  }

  if (!email) {
    errors.email = "Enter an email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter a password.";
  } else if (password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  return errors;
}
