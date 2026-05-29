import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { sendNotification } from "@/lib/match-engine/notifications";
import { audit } from "@/lib/audit";

const PatchSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

const playerSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const clubSelect = { id: true, name: true, tag: true } as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { action } = parsed.data;

  try {
    const request = await prisma.matchRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.receiverId !== auth.session.userId) {
      return NextResponse.json({ error: "Only the receiver can accept or decline" }, { status: 403 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
    }

    if (request.expiresAt && request.expiresAt < new Date()) {
      await prisma.matchRequest.update({
        where: { id: requestId },
        data: { status: "EXPIRED", statusRaw: "EXPIRED" },
      });
      return NextResponse.json({ error: "Request has expired" }, { status: 400 });
    }

    if (action === "accept") {
      const updated = await prisma.matchRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED", statusRaw: "ACTIVE" },
        include: {
          sender: { select: playerSelect },
          receiver: { select: playerSelect },
          club: { select: clubSelect },
        },
      });

      const matchReport = await prisma.matchReport.create({
        data: {
          player1Id: request.senderId,
          player2Id: auth.session.userId,
          clubId: request.clubId ?? undefined,
          status: "ACTIVE",
          statusRaw: "ACTIVE",
          submittedById: request.senderId,
        },
      });

      await audit(auth.session.userId, "MATCH_REQUEST_ACCEPT", matchReport.id, { senderId: request.senderId, matchId: matchReport.id });

      await sendNotification({
        userId: request.senderId,
        type: "CHALLENGE",
        title: "Challenge Accepted!",
        message: `${updated.receiver.displayName || updated.receiver.username} accepted your match request. The battle begins!`,
        link: `/matches/${matchReport.id}`,
      });

      await sendNotification({
        userId: auth.session.userId,
        type: "CHALLENGE",
        title: "Match Created",
        message: `You accepted ${updated.sender.displayName || updated.sender.username}'s challenge. Good luck!`,
        link: `/matches/${matchReport.id}`,
      });

      return NextResponse.json({ success: true, request: updated, matchId: matchReport.id });
    }

    if (action === "decline") {
      const updated = await prisma.matchRequest.update({
        where: { id: requestId },
        data: { status: "DECLINED", statusRaw: "DECLINED" },
        include: {
          sender: { select: playerSelect },
          receiver: { select: playerSelect },
          club: { select: clubSelect },
        },
      });

      await audit(auth.session.userId, "MATCH_REQUEST_DECLINE", requestId, { senderId: request.senderId });

      await sendNotification({
        userId: request.senderId,
        type: "CHALLENGE",
        title: "Challenge Declined",
        message: `Your match request was declined.`,
      });

      return NextResponse.json({ success: true, request: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[match-requests PATCH]", e);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}