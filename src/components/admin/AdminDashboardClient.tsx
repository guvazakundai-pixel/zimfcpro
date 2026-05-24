"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AdminCompetitionManager } from "@/components/AdminCompetitionManager";
import Link from "next/link";

type AdminStats = {
  totalUsers: number;
  totalClubs: number;
  totalMatches: number;
  pendingReports: number;
  totalTournaments: number;
  activeLeagues: number;
  totalAchievements: number;
};

type Activity = {
  type: string;
  message: string;
  createdAt: string;
  username: string;
};

type Props = {
  stats: AdminStats;
  recentActivity: Activity[];
};

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    MATCH_WON: "W", MATCH_LOST: "L", MATCH_DRAW: "D",
    TOURNAMENT_JOINED: "T", TOURNAMENT_CREATED: "T",
    CLUB_JOINED: "C", CLUB_CREATED: "C",
    ACHIEVEMENT_UNLOCKED: "A", USER_REGISTERED: "U",
  };
  return (
    <span className="h-6 w-6 rounded-[8px] flex items-center justify-center text-[10px] font-black bg-white/[0.04] text-muted-soft shrink-0">
      {icons[type] || "•"}
    </span>
  );
}

export function AdminDashboardClient({ stats, recentActivity }: Props) {
  const [tab, setTab] = useState<"overview" | "manage">("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
        <p className="text-muted-soft mt-1">System overview and governance controls</p>
      </div>

      <div className="flex gap-1 p-1 rounded-[14px] bg-bg-elevated/40 border border-border-faint">
        <button
          onClick={() => setTab("overview")}
          className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all ${
            tab === "overview" ? "bg-accent/15 text-accent shadow-sm" : "text-muted-soft hover:text-ink"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("manage")}
          className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all ${
            tab === "manage" ? "bg-accent/15 text-accent shadow-sm" : "text-muted-soft hover:text-ink"
          }`}
        >
          Manage Competitions
        </button>
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Users" value={stats.totalUsers} tone="accent" href="/admin/users" />
            <StatCard label="Clubs" value={stats.totalClubs} tone="purple" href="/admin/members" />
            <StatCard label="Tournaments" value={stats.totalTournaments} tone="gold" href="/admin/control-tower" />
            <StatCard label="Live Leagues" value={stats.activeLeagues} tone="emerald" href="/admin/command-center" />
            <StatCard label="Matches" value={stats.totalMatches} tone="cyan" href="/admin/command-center" />
            <StatCard label="Disputes" value={stats.pendingReports} tone="danger" href="/admin/disputes" />
            <StatCard label="Achievements" value={stats.totalAchievements} tone="accent" href="/admin/settings" />
            <StatCard label="Rankings" value="—" tone="muted" href="/admin/rankings" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="frosted-card rounded-[20px] p-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <QuickAction href="/admin/users" label="Manage Users" desc="View, ban, or promote users" />
                <QuickAction href="/admin/disputes" label="Resolve Disputes" desc={`${stats.pendingReports} open reports`} />
                <QuickAction href="/admin/points" label="Award Points" desc="Manual point adjustments" />
                <QuickAction href="/admin/control-tower" label="Tournament Control" desc="Manage all tournaments" />
                <QuickAction href="/admin/command-center" label="Command Center" desc="Live match oversight" />
                <QuickAction href="/admin/audit" label="Audit Log" desc="Full system activity trail" />
                <QuickAction href="/admin/settings" label="Settings" desc="System configuration" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="frosted-card rounded-[20px] p-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">
                Recent Activity
              </h3>
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-soft text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-1 max-h-[320px] overflow-y-auto bc-no-scrollbar">
                  {recentActivity.map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-2.5 rounded-[12px] hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: i < recentActivity.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                    >
                      <ActivityIcon type={a.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-soft truncate">{a.message}</p>
                        <p className="text-[9px] text-muted-faint mt-0.5">
                          {a.username} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health metrics */}
          <div className="frosted-card rounded-[20px] p-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">System Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <HealthMetric label="Users" value={stats.totalUsers} max={500} />
              <HealthMetric label="Clubs" value={stats.totalClubs} max={100} />
              <HealthMetric label="Matches" value={stats.totalMatches} max={500} />
              <HealthMetric label="Open Reports" value={stats.pendingReports} max={30} />
            </div>
          </div>
        </div>
      )}

      {tab === "manage" && (
        <div className="frosted-card p-5 rounded-[24px]">
          <AdminCompetitionManager />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone, href }: { label: string; value: string | number; tone?: string; href?: string }) {
  const colors: Record<string, string> = {
    accent: "text-accent border-accent/10",
    gold: "text-gold border-gold/10",
    purple: "text-purple border-purple/10",
    emerald: "text-emerald border-emerald/10",
    cyan: "text-cyan border-cyan/10",
    danger: "text-negative border-negative/10",
    muted: "text-muted-soft border-muted/10",
  };
  const colorCls = colors[tone || "accent"];

  const card = (
    <div className={`frosted-card-sm p-4 rounded-[16px] hover:scale-[1.02] transition-transform cursor-pointer border ${colorCls.split(" ")[1] || "border-border-faint"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">{label}</p>
      <p className={`text-2xl font-black mt-1 tabular-nums ${colorCls.split(" ")[0] || "text-ink"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[14px] border border-border-faint bg-bg-highlight/50 px-4 py-3 hover:border-accent/18 transition-all duration-200 group"
    >
      <div>
        <span className="text-ink font-bold text-sm group-hover:text-accent transition-colors duration-200">{label}</span>
        <p className="text-xs text-muted-soft">{desc}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-muted-faint group-hover:text-accent transition-colors duration-200">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

function HealthMetric({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(Math.round((value / Math.max(max, 1)) * 100), 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-soft font-medium">{label}</span>
        <span className="text-muted-faint font-mono tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background: pct > 80
              ? "linear-gradient(90deg, var(--accent), #22d3ee)"
              : pct > 50
              ? "linear-gradient(90deg, var(--gold), var(--accent))"
              : "linear-gradient(90deg, var(--negative), var(--gold))",
          }}
        />
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
