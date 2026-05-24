import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await generateCsrfToken(session.userId);

  return NextResponse.json({ token });
}
