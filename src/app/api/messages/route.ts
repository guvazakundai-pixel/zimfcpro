import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.userId;

  const rooms = await prisma.chatRoom.findMany({
    where: {
      type: "DIRECT",
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const conversations = rooms.map((room) => {
    const otherMember = room.members.find((m) => m.userId !== userId);
    const lastMsg = room.messages[0];
    return {
      id: room.id,
      withUser: otherMember?.user ?? null,
      lastMessage: lastMsg?.content ?? "",
      lastMessageAt: lastMsg?.createdAt?.toISOString() ?? room.createdAt.toISOString(),
      unread: 0,
    };
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.userId;
  const { recipientId, content } = await req.json().catch(() => ({}));
  if (!recipientId || !content?.trim()) {
    return NextResponse.json({ error: "Recipient and message content required" }, { status: 400 });
  }

  if (recipientId === userId) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: recipientId } } },
      ],
    },
  });

  let roomId = existingRoom?.id;

  if (!roomId) {
    const newRoom = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        members: {
          create: [
            { userId },
            { userId: recipientId },
          ],
        },
      },
    });
    roomId = newRoom.id;
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      userId,
      content: content.trim(),
      type: "TEXT",
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      fromUserId: message.userId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    },
  });
}
