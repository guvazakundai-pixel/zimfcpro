"use client";

import { motion } from "framer-motion";
import { useUser, useAuthModal } from "@/lib/auth-context";

type AuthGateProps = {
  /** Show a locked state when not authenticated, with an elegant CTA */
  children: React.ReactNode;
  /** The action label in the locked CTA (e.g., "Sign in to challenge players") */
  ctaLabel?: string;
  /** Show a locked overlay on this specific interaction */
  overlay?: "subtle" | "prominent";
  /** If true, children are always rendered behind the locked overlay */
  alwaysRender?: boolean;
  className?: string;
};

export function AuthGate({
  children,
  ctaLabel = "Sign in to unlock",
  overlay = "subtle",
  alwaysRender = false,
  className = "",
}: AuthGateProps) {
  const { isAuthenticated, loading } = useUser();
  const { openAuth } = useAuthModal();

  if (loading) return null;
  if (isAuthenticated) return <>{children}</>;

  if (overlay === "prominent") {
    return (
      <div className={`relative ${className}`}>
        {alwaysRender && <div className="opacity-20 pointer-events-none">{children}</div>}
        <div className={`${alwaysRender ? "absolute inset-0" : ""} flex flex-col items-center justify-center p-6 text-center rounded-[20px]`}
          style={{
            background: alwaysRender ? "rgba(10,10,12,0.75)" : "rgba(255,255,255,0.02)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <span className="text-3xl block opacity-50">🔒</span>
            <p className="text-sm text-muted-soft max-w-[240px]">{ctaLabel}</p>
            <button
              onClick={() => openAuth("signin")}
              className="inline-flex h-10 px-5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all duration-200"
            >
              Sign in
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // subtle: just an elegant CTA instead of the action
  return (
    <button
      onClick={() => openAuth("signin")}
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-accent transition-colors duration-200 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      {ctaLabel}
    </button>
  );
}

/** Shown on pages that require authentication, with a full-page elegant locked state */
export function AuthRequiredPage({
  title,
  description,
  icon = "🔒",
}: {
  title: string;
  description: string;
  icon?: string;
}) {
  const { openAuth } = useAuthModal();

  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center px-4 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="frosted-card p-10 sm:p-12 text-center rounded-[28px] max-w-md w-full space-y-5"
        style={{
          background: "linear-gradient(135deg, rgba(18,20,24,0.65), rgba(14,16,20,0.55))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 16px 64px rgba(0,0,0,0.3)",
        }}
      >
        <motion.span
          className="text-5xl block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon}
        </motion.span>
        <div>
          <h1 className="cinematic-heading text-2xl sm:text-3xl text-ink mb-2">{title}</h1>
          <p className="text-sm text-muted-soft max-w-sm mx-auto">{description}</p>
        </div>
        <button
          onClick={() => openAuth("signin")}
          className="inline-flex h-12 px-8 rounded-[14px] font-bold text-sm tracking-[0.12em] uppercase bg-accent text-black items-center justify-center hover:shadow-[0_0_28px_rgba(0,255,133,0.2)] transition-all active:scale-[0.97]"
        >
          Sign in to Continue
        </button>
        <p className="text-[10px] text-muted-faint">
          Don&apos;t have an account?{" "}
          <button onClick={() => openAuth("signup")} className="text-accent hover:underline font-bold">
            Create one
          </button>
        </p>
      </motion.div>
    </div>
  );
}
