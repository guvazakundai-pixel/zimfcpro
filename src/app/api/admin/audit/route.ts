import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (auth.session.role !== "ADMIN" && auth.session.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
  const action = searchParams.get("action");
  const search = searchParams.get("search");

  try {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { target: { contains: search } },
        { admin: { username: { contains: search } } },
        { admin: { displayName: { contains: search } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          admin: {
            select: { id: true, username: true, displayName: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ success: true, logs, total });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs", logs: [], total: 0 },
      { status: 500 },
    );
  }
}
