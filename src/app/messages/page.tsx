"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser, useAuthModal } from "@/lib/auth-context";

type Conversation = {
  id: string;
  withUser: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

type Message = {
  id: string;
  fromUserId: string;
  content: string;
  createdAt: string;
};

export default function MessagesPage() {
  const { user, isAuthenticated, loading } = useUser();
  const { openAuth } = useAuthModal();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  // Load conversations on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) { setPageLoading(false); return; }
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => { setConversations(d.conversations ?? []); setPageLoading(false); })
      .catch(() => setPageLoading(false));
  }, [isAuthenticated]);

  const loadMessages = async (convId: string) => {
    setActiveChat(convId);
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch { setMessages([]); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const trimmed = input.trim();
    setInput("");
    try {
      const res = await fetch(`/api/messages/${activeChat}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch { /* fail silently */ }
  };

  if (loading || pageLoading) {
    return (
      <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="broadcast-theme min-h-screen bc-grain">
        <div className="mx-auto max-w-2xl px-4 py-20 pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="frosted-card p-10 rounded-[28px] space-y-5"
          >
            <span className="text-5xl block">💬</span>
            <h1 className="cinematic-heading text-2xl text-ink">Messages</h1>
            <p className="text-sm text-muted-soft max-w-sm mx-auto">
              Sign in to message other players, coordinate matches, and build your network.
            </p>
            <button
              onClick={() => openAuth("signin")}
              className="inline-flex h-12 px-8 rounded-[14px] font-bold text-sm tracking-[0.12em] uppercase bg-accent text-black items-center justify-center hover:shadow-[0_0_24px_rgba(0,255,133,0.2)] transition-all"
            >
              Sign in to Message
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeChat);

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-4xl px-4 py-6 pb-28">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">Inbox</p>
            <h1 className="cinematic-heading mt-1 text-3xl sm:text-4xl text-ink">Messages</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Conversation List */}
          <div className="lg:col-span-1 space-y-1 max-h-[600px] overflow-y-auto bc-no-scrollbar">
            {conversations.length === 0 ? (
              <div className="frosted-card p-8 text-center rounded-[20px]">
                <p className="text-sm text-muted-soft">No conversations yet</p>
                <p className="text-xs text-muted-faint mt-1">Challenge someone to start chatting!</p>
                <Link href="/rankings" className="inline-flex mt-4 h-10 px-4 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 items-center hover:bg-accent/15 transition-all">
                  Browse Players
                </Link>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadMessages(conv.id)}
                  className={`w-full text-left p-3.5 rounded-[16px] transition-all duration-200 ${
                    activeChat === conv.id
                      ? "bg-accent/10 border border-accent/20"
                      : "bg-bg-elevated/40 border border-border-faint hover:bg-bg-elevated/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                      {(conv.withUser.displayName || conv.withUser.username)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-ink truncate">
                          {conv.withUser.displayName || conv.withUser.username}
                        </p>
                        {conv.unread > 0 && (
                          <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-accent text-black text-[9px] font-bold flex items-center justify-center shrink-0 ml-2">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-soft truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {!activeChat ? (
              <div className="frosted-card rounded-[20px] h-[500px] lg:h-[600px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <span className="text-4xl block opacity-40">💬</span>
                  <p className="text-sm text-muted-soft">Select a conversation</p>
                  <p className="text-xs text-muted-faint">Or start a new one by challenging a player</p>
                </div>
              </div>
            ) : (
              <div className="frosted-card rounded-[20px] flex flex-col h-[500px] lg:h-[600px] overflow-hidden">
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-border-faint flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                    {(activeConversation?.withUser.displayName || activeConversation?.withUser.username || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {activeConversation?.withUser.displayName || activeConversation?.withUser.username}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bc-no-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-faint">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.fromUserId === user?.id;
                      return (
                        <motion.div
                          key={msg.id || i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-3.5 py-2.5 rounded-[16px] text-sm ${
                              isMine
                                ? "bg-accent/15 text-ink rounded-br-[4px]"
                                : "bg-white/[0.04] text-muted-soft rounded-bl-[4px]"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-[8px] text-muted-faint mt-1 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border-faint flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 h-10 px-4 rounded-[12px] text-sm text-ink outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="h-10 w-10 rounded-[12px] flex items-center justify-center bg-accent text-black disabled:opacity-30 transition-all shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
