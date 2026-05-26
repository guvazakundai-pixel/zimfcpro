import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.error("[ClientError]", JSON.stringify(body));
  } catch {}
  return NextResponse.json({ ok: true });
}
