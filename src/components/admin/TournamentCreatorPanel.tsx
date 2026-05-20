"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Participant = {
  id: string;
  userId: string;
  username: string;
  displayName?: string | null;
  status: string;
  seed: number;
};

type AdminPanelProps = {
  competitionId: string;
  competitionType: "TOURNAMENT" | "LEAGUE";
  competitionName: string;
  participants: Participant[];
  isCreator: boolean;
  onInvitePlayer?: () => void;
  onRemovePlayer?: (userId: string) => void;
  onApproveResult?: (matchId: string) => void;
  onDisqualifyPlayer?: (userId: string) => void;
  onPauseCompetition?: () => void;
  onResumeCompetition?: () => void;
  onExtendDeadline?: (days: number) => void;
  onSendAnnouncement?: (message: string) => void;
  disputes?: { matchId: string; reason: string; reportedBy: string; status: string }[];
};

export function TournamentCreatorPanel({
  competitionId,
  competitionType,
  competitionName,
  participants,
  isCreator,
  onInvitePlayer,
  onRemovePlayer,
  onDisqualifyPlayer,
  onApproveResult,
  onPauseCompetition,
  onResumeCompetition,
  onExtendDeadline,
  onSendAnnouncement,
  disputes = [],
}: AdminPanelProps) {
  const [tab, setTab] = useState<"players" | "settings" | "disputes" | "announce">("players");
  const [announcementText, setAnnouncementText] = useState("");
  const [sending, setSending] = useState(false);

  if (!isCreator) return null;

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setSending(true);
    await onSendAnnouncement?.(announcementText);
    setAnnouncementText("");
    setSending(false);
  };

  return (
    <div className="frosted-card-sm rounded-[24px] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border-faint">
        <div className="flex items-center gap-2 mb-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-accent">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Creator Panel</p>
        </div>
        <p className="text-sm text-muted-soft">Manage {competitionName}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border-faint overflow-x-auto bc-no-scrollbar">
        {[
          { id: "players" as const, label: `Players (${participants.length})` },
          { id: "settings" as const, label: "Settings" },
          ...(disputes.length > 0 ? [{ id: "disputes" as const, label: `Disputes (${disputes.length})` }] : []),
          { id: "announce" as const, label: "Announce" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[8px] font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? "bg-accent/15 text-accent" : "text-muted-faint hover:text-muted-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "players" && (
          <motion.div
            key="players"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 space-y-1"
          >
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-[10px] hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-muted-faint w-5">#{p.seed}</span>
                  <span className="text-sm font-medium text-ink truncate">{p.displayName || p.username}</span>
                  <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    p.status === "ACTIVE" ? "bg-accent/10 text-accent" : "bg-muted/5 text-muted-faint"
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  {onRemovePlayer && (
                    <button
                      onClick={() => onRemovePlayer(p.userId)}
                      className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-[6px] text-negative/60 hover:text-negative hover:bg-negative/10 transition-all"
                    >
                      Remove
                    </button>
                  )}
                  {onDisqualifyPlayer && (
                    <button
                      onClick={() => onDisqualifyPlayer(p.userId)}
                      className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-[6px] text-negative/60 hover:text-negative hover:bg-negative/10 transition-all"
                    >
                      DQ
                    </button>
                  )}
                </div>
              </div>
            ))}
            {onInvitePlayer && (
              <button
                onClick={onInvitePlayer}
                className="w-full mt-2 py-3 rounded-[10px] text-[9px] font-bold uppercase tracking-wider border border-dashed border-white/10 text-muted-soft hover:text-accent hover:border-accent/30 transition-all"
              >
                + Invite Player
              </button>
            )}
          </motion.div>
        )}

        {tab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint mb-3">Competition Controls</p>

            {onPauseCompetition && (
              <button
                onClick={onPauseCompetition}
                className="w-full py-3 px-4 rounded-[12px] text-[9px] font-bold uppercase tracking-wider border border-gold/20 text-gold hover:bg-gold/5 transition-all flex items-center justify-between"
              >
                <span>⏸ Pause Competition</span>
                <span className="text-[8px] text-muted-faint">Players cannot submit results</span>
              </button>
            )}

            {onResumeCompetition && (
              <button
                onClick={onResumeCompetition}
                className="w-full py-3 px-4 rounded-[12px] text-[9px] font-bold uppercase tracking-wider border border-accent/20 text-accent hover:bg-accent/5 transition-all flex items-center justify-between"
              >
                <span>▶ Resume Competition</span>
                <span className="text-[8px] text-muted-faint">Re-open submissions</span>
              </button>
            )}

            {onExtendDeadline && (
              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-mono text-muted-soft">Extend Deadline</p>
                <div className="flex gap-2">
                  {[1, 3, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => onExtendDeadline(days)}
                      className="flex-1 py-2.5 rounded-[10px] text-[9px] font-bold uppercase tracking-wider bg-white/5 text-muted-soft hover:text-ink hover:bg-white/10 transition-all"
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "disputes" && (
          <motion.div
            key="disputes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 space-y-2"
          >
            {disputes.length === 0 ? (
              <p className="text-sm text-muted-soft text-center py-6">No disputes</p>
            ) : (
              disputes.map((d, i) => (
                <div key={i} className="p-3 rounded-[12px]" style={{ background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.08)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-negative">Dispute</span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      d.status === "OPEN" ? "bg-gold/10 text-gold" : "bg-accent/10 text-accent"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink">{d.reason}</p>
                  <p className="text-[9px] text-muted-faint mt-1">Reported by: {d.reportedBy}</p>
                  {onApproveResult && (
                    <button
                      onClick={() => onApproveResult(d.matchId)}
                      className="mt-2 px-3 py-1.5 rounded-[8px] text-[8px] font-bold uppercase tracking-wider bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                    >
                      Review & Resolve
                    </button>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "announce" && (
          <motion.div
            key="announce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint">Send Announcement</p>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Write a message to all participants..."
              className="w-full h-24 rounded-[12px] bg-white/5 border border-white/10 text-sm text-ink p-3 resize-none focus:outline-none focus:border-accent/40"
            />
            <button
              onClick={handleSendAnnouncement}
              disabled={!announcementText.trim() || sending}
              className="w-full h-10 rounded-[10px] cta-primary text-[9px] font-bold uppercase tracking-wider text-[#0D0D0F] disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send to All Players"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
