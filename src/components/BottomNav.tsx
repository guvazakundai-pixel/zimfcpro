"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useAuthModal } from "@/lib/auth-context";
import { useAuthStore } from "@/store/auth-store";
import { useRealtime } from "@/lib/socket-provider";
import { motion, LayoutGroup } from "framer-motion";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/rankings", label: "Rank", icon: RankIcon },
  { href: "/leagues", label: "Leagues", icon: LeagueIcon },
  { href: "/matches", label: "Play", icon: PlayIcon },
  { href: "/clubs", label: "Clubs", icon: ShieldIcon },
] as const;

const SPRING_CONFIG = { type: "spring" as const, stiffness: 380, damping: 28 };

export function BottomNav() {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const { isAuthenticated, loading } = useUser();
  const logout = useAuthStore((s) => s.logout);
  const { notifications } = useRealtime();
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  if (loading) {
    return (
      <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md px-3 pb-2 pt-1">
          <div className="flex items-center justify-around rounded-[20px] px-1 py-2" style={{ background: "rgba(10,10,14,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.04)" }}>
            {[1,2,3,4,5].map(i => <div key={i} className="h-4 w-4 rounded-full bg-white/5 animate-pulse" />)}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3 pb-1.5 pt-0.5">
        <LayoutGroup>
          <div
            className="flex items-center justify-around rounded-[20px] px-1 py-1.5"
            style={{
              background: "rgba(10,10,14,0.88)",
              backdropFilter: "blur(24px) saturate(1.8)",
              WebkitBackdropFilter: "blur(24px) saturate(1.8)",
              border: "1px solid rgba(255,255,255,0.04)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.03) inset",
            }}
          >
            {ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className="relative flex flex-col items-center justify-center py-2 px-3 rounded-[12px] transition-colors duration-150 group min-w-0">
                  <span className={`h-[18px] w-[18px] grid place-items-center transition-colors duration-150 ${active ? "text-accent" : "text-muted-soft group-hover:text-ink-soft group-active:text-accent"}`}>
                    <Icon />
                  </span>
                  <span className={`text-[7px] font-bold uppercase tracking-[0.16em] transition-colors duration-150 mt-0.5 ${active ? "text-accent" : "text-muted-faint group-hover:text-muted-soft group-active:text-accent"}`}>
                    {label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      aria-hidden
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] min-w-[18px] rounded-full"
                      style={{
                        background: "var(--accent)",
                        boxShadow: "0 0 10px rgba(0,255,133,0.5), 0 0 4px rgba(0,255,133,0.25)",
                      }}
                      transition={SPRING_CONFIG}
                    />
                  )}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <Link href="/dashboard" className="relative flex flex-col items-center justify-center py-2 px-3 rounded-[12px] transition-colors duration-150 group min-w-0">
                <span className={`h-[18px] w-[18px] grid place-items-center transition-colors duration-150 relative ${pathname.startsWith("/dashboard") ? "text-accent" : "text-muted-soft group-hover:text-ink-soft group-active:text-accent"}`}>
                  <UserIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-0.5 flex items-center justify-center rounded-full bg-negative text-[7px] font-black text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className={`text-[7px] font-bold uppercase tracking-[0.16em] transition-colors duration-150 mt-0.5 ${pathname.startsWith("/dashboard") ? "text-accent" : "text-muted-faint group-hover:text-muted-soft group-active:text-accent"}`}>
                  Me
                </span>
                {pathname.startsWith("/dashboard") && (
                  <motion.span
                    layoutId="nav-indicator"
                    aria-hidden
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] min-w-[18px] rounded-full"
                    style={{
                      background: "var(--accent)",
                      boxShadow: "0 0 10px rgba(0,255,133,0.5), 0 0 4px rgba(0,255,133,0.25)",
                    }}
                    transition={SPRING_CONFIG}
                  />
                )}
              </Link>
            ) : (
              <button onClick={() => openAuth("signin")} className="relative flex flex-col items-center justify-center py-2 px-3 rounded-[12px] transition-colors duration-150 group min-w-0">
                <span className="h-[18px] w-[18px] grid place-items-center text-muted-soft group-hover:text-ink-soft group-active:text-accent transition-colors duration-150">
                  <UserIcon />
                </span>
                <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-muted-faint group-hover:text-muted-soft group-active:text-accent transition-colors duration-150 mt-0.5">
                  Me
                </span>
              </button>
            )}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}
function RankIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M22 20H2" /></svg>;
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>;
}
function LeagueIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]"><path d="M6 3h12v18l-6-4-6 4V3z" /></svg>;
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]"><path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" /></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
}