"use client";

import { useAuthStore } from "@/store/auth-store";

type SessionData = {
  userId: string;
  username: string;
  role: string;
} | null;

export function useSession(): SessionData {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return { userId: user.id, username: user.username, role: user.role };
}
