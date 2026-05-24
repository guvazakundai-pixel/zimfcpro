import { SignJWT, jwtVerify } from "jose";

const CSRF_SECRET = new TextEncoder().encode(
  process.env.CSRF_SECRET ?? process.env.JWT_SECRET ?? "csrf-secret-change-in-prod"
);
const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export async function generateCsrfToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(CSRF_SECRET);
}

export async function validateCsrfToken(
  token: string,
  userId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, CSRF_SECRET);
    return payload.userId === userId;
  } catch {
    return false;
  }
}

export async function getCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/csrf", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

export function csrfSafeMethod(method: string): boolean {
  return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}

export { CSRF_COOKIE, CSRF_HEADER };
