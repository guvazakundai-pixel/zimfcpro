"use client";

import Link from "next/link";
import { useUser, useAuthModal } from "@/lib/auth-context";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/lib/theme-store";
import { NotificationBell } from "@/components/match/NotificationBell";

export function TopBar() {
  const { isAuthenticated, loading, user } = useUser();
  const { openAuth } = useAuthModal();
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user && (user.role === "MANAGER" || user.role === "ADMIN");

  if (loading) {
    return (
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(10,10,12,0.85)",
          backdropFilter: "blur(28px) saturate(1.6)",
          WebkitBackdropFilter: "blur(28px) saturate(1.6)",
          borderBottom: "1px solid rgba(0,255,133,0.06)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-12 flex items-center justify-between gap-4 w-full min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span
              className="inline-grid place-items-center h-7 w-7 rounded-[8px] text-accent font-display text-sm leading-none group-hover:shadow-[0_0_16px_rgba(0,255,133,0.2)] transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,133,0.15) 0%, rgba(0,255,133,0.04) 100%)",
                border: "1px solid rgba(0,255,133,0.25)",
              }}
            >
              Z
            </span>
            <div className="leading-tight">
              <p className="cinematic-heading tracking-wider text-ink text-xs sm:text-sm">ZIM FCPRO</p>
              <p className="font-mono text-[8px] text-muted-faint tracking-wider">FC26 · ZW</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 rounded-[8px] bg-white/5 animate-pulse" />
            <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[9px] text-muted-soft">
              S1 · <span className="text-accent bc-live-dot">●</span> <span className="text-shimmer">Live</span>
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--surface-ultra)",
        backdropFilter: "blur(var(--glass-blur)) saturate(1.6)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(1.6)",
        borderBottom: "1px solid var(--border-faint)",
        boxShadow: "inset 0 -1px 0 0 rgba(0,255,133,0.04)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-12 flex items-center justify-between gap-4 w-full min-w-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="inline-grid place-items-center h-7 w-7 rounded-[8px] text-accent font-display text-sm leading-none group-hover:shadow-[0_0_16px_rgba(0,255,133,0.2)] transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,133,0.15) 0%, rgba(0,255,133,0.04) 100%)",
              border: "1px solid rgba(0,255,133,0.25)",
            }}
          >
            Z
          </span>
          <div className="leading-tight">
            <p className="cinematic-heading tracking-wider text-ink text-xs sm:text-sm">ZIM FCPRO</p>
            <p className="font-mono text-[8px] text-muted-faint tracking-wider">FC26 · ZW</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => useThemeStore.getState().toggle()}
            className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all duration-200 text-xs"
            style={{ background: "var(--accent-soft)" }}
            aria-label="Toggle theme"
          >
            <span className="dark:hidden">🌙</span>
            <span className="light:hidden">☀️</span>
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex rounded-[8px] border border-accent/18 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-accent hover:bg-accent/8 hover:border-accent/30 hover:shadow-[0_0_16px_rgba(0,255,133,0.06)] transition-all duration-300"
              style={{ background: "rgba(0,255,133,0.05)" }}
            >
              Control Panel
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link
                href="/notifications"
                className="hidden sm:inline-flex rounded-[8px] border border-border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300 relative"
              >
                <NotificationBell />
              </Link>
              <Link
                href="/messages"
                className="hidden sm:inline-flex rounded-[8px] border border-border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3 w-3 mr-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Messages
              </Link>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex rounded-[8px] border border-border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/rankings"
                className="hidden sm:inline-flex rounded-[8px] text-[8px] font-bold uppercase tracking-[0.2em] text-muted-soft hover:text-ink transition-all duration-300"
              >
                Rankings
              </Link>
              <Link
                href="/tournaments"
                className="hidden sm:inline-flex rounded-[8px] text-[8px] font-bold uppercase tracking-[0.2em] text-muted-soft hover:text-ink transition-all duration-300"
              >
                Tournaments
              </Link>
              <button
                onClick={() => openAuth("signin")}
                className="hidden sm:inline-flex rounded-[8px] border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft hover:bg-bg-highlight hover:text-ink transition-all duration-200"
              >
                Sign in
              </button>
            </>
          )}
          <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[9px] text-muted-soft">
            S1 · <span className="text-accent bc-live-dot">●</span> <span className="text-shimmer">Live</span>
          </span>
        </div>
      </div>
    </header>
  );
}