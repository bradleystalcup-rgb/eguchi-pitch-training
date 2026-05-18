import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "bad_request"
  | "not_found"
  | "conflict"
  | "internal_error";

export function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && error.code === "23505") {
    return true;
  }

  return "cause" in error && isUniqueConstraintError(error.cause);
}

export function validateChildId(childId: string) {
  const trimmed = childId.trim();

  if (!trimmed || trimmed.length > 128) {
    return null;
  }

  return trimmed;
}

export function validateCreateChildPayload(payload: unknown):
  | { ok: true; value: { displayName: string; birthYear?: number | null } }
  | { ok: false; message: string } {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const body = payload as Record<string, unknown>;
  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim()
      : typeof body.name === "string"
        ? body.name.trim()
        : "";

  if (!displayName) {
    return { ok: false, message: "displayName is required." };
  }

  if (displayName.length > 80) {
    return { ok: false, message: "displayName must be 80 characters or fewer." };
  }

  if (body.birthYear === undefined || body.birthYear === null) {
    return { ok: true, value: { displayName, birthYear: null } };
  }

  const birthYear = body.birthYear;

  if (!Number.isInteger(birthYear)) {
    return { ok: false, message: "birthYear must be an integer when provided." };
  }

  const currentYear = new Date().getUTCFullYear();

  if (typeof birthYear !== "number" || birthYear < 1900 || birthYear > currentYear) {
    return { ok: false, message: `birthYear must be between 1900 and ${currentYear}.` };
  }

  return { ok: true, value: { displayName, birthYear } };
}
