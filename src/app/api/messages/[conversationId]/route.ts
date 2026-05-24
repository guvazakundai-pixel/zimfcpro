import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { conversationId } = await params;
  const userId = auth.session.userId;

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: conversationId,
      type: "DIRECT",
      members: { some: { userId } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId: conversationId },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      userId: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      fromUserId: m.userId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { conversationId } = await params;
  const userId = auth.session.userId;
  const { content } = await req.json().catch(() => ({}));
  if (!content?.trim()) {
    return NextResponse.json({ error: "Message content required" }, { status: 400 });
  }

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: conversationId,
      type: "DIRECT",
      members: { some: { userId } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId: conversationId,
      userId,
      content: content.trim(),
      type: "TEXT",
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
