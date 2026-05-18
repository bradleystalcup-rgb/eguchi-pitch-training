import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
};

type SessionUser = {
  id?: string;
  email?: string;
  name?: string | null;
};

function normalizeUser(user: SessionUser | undefined): CurrentUser | null {
  if (!user?.id || !user.email) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
  };
}

export async function getCurrentUserFromHeaders(headerList: Headers): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: headerList });
  return normalizeUser(session?.user);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getCurrentUserFromHeaders(await headers());
}

export async function requireCurrentUserFromHeaders(headerList: Headers): Promise<CurrentUser> {
  const user = await getCurrentUserFromHeaders(headerList);
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
