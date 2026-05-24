"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { NumberTicker } from "@/components/ui/PageTransition";

type PlayerRanking = {
  id: string;
  userId: string;
  rankPosition: number;
  prevPosition: number | null;
  rankChange: number;
  points: number;
  finalScore: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    country: string;
    favoriteClub: string | null;
    isFake: boolean;
    isVerified: boolean;
    fantasyTeam: { teamName: string; teamValue: number; budget: number; transfersUsed: number } | null;
    playerStats: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      goalsScored: number;
      goalsConceded: number;
      skillRating: number;
      points: number;
      formScore: number;
      winStreak: number;
      mvpCount: number;
      formHistory: string;
    } | null;
    playerAchievements: { icon: string; title: string; rarity: string }[];
  };
};

type SortField = "rank" | "points" | "finalScore" | "wins" | "winRate" | "gd" | "streak";

export function RankingsTable() {
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRanking | null>(null);
  const limit = 50;

  const fetchRankings = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rankings/top?limit=${limit}&offset=${pageNum * limit}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRankings(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setError("Could not load rankings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings(page);
  }, [page, fetchRankings]);

  const totalPages = Math.ceil(total / limit);

  const sorted = useMemo(() => {
    const list = [...rankings];
    list.sort((a, b) => {
      const s = a.user.playerStats;
      const t = b.user.playerStats;
      let cmp = 0;
      switch (sortField) {
        case "rank": cmp = a.rankPosition - b.rankPosition; break;
        case "points": cmp = (s?.points ?? 0) - (t?.points ?? 0); break;
        case "finalScore": cmp = a.finalScore - b.finalScore; break;
        case "wins": cmp = (s?.wins ?? 0) - (t?.wins ?? 0); break;
        case "winRate": {
          const aWr = (s?.matchesPlayed ?? 0) > 0 ? ((s?.wins ?? 0) / (s?.matchesPlayed ?? 1)) * 100 : 0;
          const bWr = (t?.matchesPlayed ?? 0) > 0 ? ((t?.wins ?? 0) / (t?.matchesPlayed ?? 1)) * 100 : 0;
          cmp = aWr - bWr; break;
        }
        case "gd": {
          const aGd = (s?.goalsScored ?? 0) - (s?.goalsConceded ?? 0);
          const bGd = (t?.goalsScored ?? 0) - (t?.goalsConceded ?? 0);
          cmp = aGd - bGd; break;
        }
        case "streak": cmp = (s?.winStreak ?? 0) - (t?.winStreak ?? 0); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [rankings, sortField, sortDir]);

  const filtered = useMemo(() => {
    if (!search) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (r) =>
        (r.user.displayName || r.user.username).toLowerCase().includes(q) ||
        r.user.username.toLowerCase().includes(q) ||
        (r.user.favoriteClub || "").toLowerCase().includes(q),
    );
  }, [sorted, search]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "rank" ? "asc" : "desc");
    }
  }

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const active = sortField === field;
    return (
      <button
        onClick={() => toggleSort(field)}
        className="text-[10px] uppercase tracking-wider text-muted-soft hover:text-ink transition-colors flex items-center gap-1 font-bold"
      >
        {label}
        {active && <span className="text-accent text-[8px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
      </button>
    );
  }

  function RankChange({ change }: { change: number }) {
    if (change > 0) return <span className="text-accent text-[10px]">▲{change}</span>;
    if (change < 0) return <span className="text-negative text-[10px]">▼{Math.abs(change)}</span>;
    return <span className="text-muted-faint text-[10px]">—</span>;
  }

  function getWinRateClass(wr: number): string {
    if (wr >= 60) return "text-accent";
    if (wr >= 40) return "text-ink";
    return "text-negative";
  }

  function getTierColor(rank: number): string {
    if (rank === 1) return "text-[#ffb800]";
    if (rank <= 3) return "text-[#E8E8F0]";
    if (rank <= 10) return "text-[#22d3ee]";
    if (rank <= 50) return "text-[#00ff85]";
    return "text-muted-soft";
  }

  function getRowGlow(rank: number): string {
    if (rank === 1) return "shadow-[0_0_30px_rgba(255,184,0,0.08)]";
    if (rank <= 3) return "shadow-[0_0_20px_rgba(200,200,210,0.04)]";
    return "";
  }

  if (loading && rankings.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-soft">Loading rankings…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-negative text-sm mb-3">{error}</p>
        <button onClick={() => fetchRankings(page)} className="text-xs text-accent hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-ink">
            Global Rankings
            <span className="text-muted-faint text-xs ml-2 font-normal">({total} managers)</span>
          </h2>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search managers…"
          className="bg-white/[0.04] border border-white/[0.06] rounded-[10px] px-3 py-1.5 text-xs text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/30 w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-3 py-3 text-left"><SortHeader field="rank" label="Rank" /></th>
              <th className="px-3 py-3 text-left"><span className="text-[10px] uppercase tracking-wider text-muted-soft font-bold">Manager</span></th>
              <th className="px-3 py-3 text-left hidden sm:table-cell"><span className="text-[10px] uppercase tracking-wider text-muted-soft font-bold">Team / Club</span></th>
              <th className="px-3 py-3 text-right"><SortHeader field="points" label="Pts" /></th>
              <th className="px-3 py-3 text-right hidden md:table-cell"><SortHeader field="finalScore" label="Score" /></th>
              <th className="px-3 py-3 text-right hidden md:table-cell"><SortHeader field="wins" label="W" /></th>
              <th className="px-3 py-3 text-right hidden lg:table-cell"><SortHeader field="winRate" label="WR%" /></th>
              <th className="px-3 py-3 text-right hidden lg:table-cell"><SortHeader field="gd" label="GD" /></th>
              <th className="px-3 py-3 text-right"><SortHeader field="streak" label="Form" /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const s = r.user.playerStats;
              const winRate = s && s.matchesPlayed > 0 ? ((s.wins / s.matchesPlayed) * 100).toFixed(0) : "0";
              const gd = (s?.goalsScored ?? 0) - (s?.goalsConceded ?? 0);
              const formHistory = s?.formHistory || "";
              const formArray = formHistory ? formHistory.split("").slice(-5) : [];

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedPlayer(r)}
                  className={`border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors ${getRowGlow(r.rankPosition)}`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${getTierColor(r.rankPosition)}`}>
                        {r.rankPosition <= 3 ? ["🥇", "🥈", "🥉"][r.rankPosition - 1] : `#${r.rankPosition}`}
                      </span>
                      <RankChange change={r.rankChange} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: "rgba(0,255,133,0.10)", border: "1px solid rgba(0,255,133,0.15)" }}
                      >
                        {(r.user.displayName || r.user.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate max-w-[140px]">
                          {r.user.displayName || r.user.fullName || r.user.username}
                        </div>
                        <div className="text-[10px] text-muted-faint truncate max-w-[120px]">
                          @{r.user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="text-xs text-muted-soft">
                      {r.user.fantasyTeam?.teamName || `${r.user.username} FC`}
                    </div>
                    {r.user.favoriteClub && (
                      <div className="text-[9px] text-muted-faint">{r.user.favoriteClub}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-black text-ink">{s?.points ?? 0}</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <span className="text-xs text-muted-soft">{r.finalScore.toFixed(0)}</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <span className="text-xs text-muted-soft">{s?.wins ?? 0}</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell">
                    <span className={`text-xs font-bold ${getWinRateClass(Number(winRate))}`}>{winRate}%</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell">
                    <span className={`text-xs ${gd >= 0 ? "text-accent" : "text-negative"}`}>
                      {gd >= 0 ? "+" : ""}{gd}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {formArray.length > 0 ? (
                        formArray.map((f, i) => (
                          <span
                            key={i}
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              f === "W" ? "bg-accent" : f === "L" ? "bg-negative" : "bg-muted-faint"
                            }`}
                          />
                        ))
                      ) : (
                        <span className="text-[9px] text-muted-faint">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded-[8px] border border-white/[0.06] text-muted-soft hover:text-ink hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-[10px] text-muted-faint px-2">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs rounded-[8px] border border-white/[0.06] text-muted-soft hover:text-ink hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {page === 0 && total > 50 && (
        <div className="text-center mt-4">
          <p className="text-[9px] text-muted-faint">
            Showing top {limit}. Search for specific managers or navigate pages.
          </p>
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetailOverlay
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

function PlayerDetailOverlay({
  player,
  onClose,
}: {
  player: PlayerRanking;
  onClose: () => void;
}) {
  const s = player.user.playerStats;
  const winRate = s && s.matchesPlayed > 0 ? ((s.wins / s.matchesPlayed) * 100).toFixed(1) : "0";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,12,0.82)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[24px]"
        style={{
          background: "rgba(18,20,24,0.95)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="p-6 text-center">
          <div
            className="h-16 w-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-black"
            style={{ background: "rgba(0,255,133,0.10)", border: "2px solid rgba(0,255,133,0.20)" }}
          >
            {(player.user.displayName || player.user.username || "?").charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-black text-ink">{player.user.displayName || player.user.username}</h3>
          <p className="text-xs text-muted-soft">@{player.user.username}</p>
          {player.user.fantasyTeam && (
            <p className="text-xs text-accent mt-1">{player.user.fantasyTeam.teamName}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          <StatBox label="Rank" value={`#${player.rankPosition}`} color={getTierColorStatic(player.rankPosition)} />
          <StatBox label="Points" value={String(s?.points ?? 0)} />
          <StatBox label="Score" value={player.finalScore.toFixed(0)} />
          <StatBox label="W-L-D" value={`${s?.wins ?? 0}-${s?.losses ?? 0}-${s?.draws ?? 0}`} />
          <StatBox label="Win Rate" value={`${winRate}%`} />
          <StatBox label="Streak" value={s?.winStreak ? `🔥 ${s.winStreak}` : "—"} />
          <StatBox label="Goals" value={`${s?.goalsScored ?? 0} / ${s?.goalsConceded ?? 0}`} />
          <StatBox label="MVP" value={String(s?.mvpCount ?? 0)} />
          <StatBox label="Rating" value={(s?.skillRating ?? 1000).toFixed(0)} />
        </div>

        {player.user.favoriteClub && (
          <div className="px-6 pb-4 text-center">
            <span className="text-[10px] text-muted-faint">Favorite Club</span>
            <p className="text-xs text-ink">{player.user.favoriteClub}</p>
          </div>
        )}

        {player.user.playerAchievements.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-[10px] text-muted-faint text-center mb-2">Achievements</p>
            <div className="flex justify-center gap-2">
              {player.user.playerAchievements.map((a, i) => (
                <span key={i} className="text-lg" title={a.title}>{a.icon}</span>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/[0.04]">
          <button
            onClick={onClose}
            className="w-full text-xs text-muted-soft hover:text-ink transition-colors py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="rounded-[12px] p-3 text-center"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <p className="text-[9px] uppercase tracking-wider text-muted-faint mb-1">{label}</p>
      <p className={`text-sm font-black ${color || "text-ink"}`}>{value}</p>
    </div>
  );
}

function getTierColorStatic(rank: number): string {
  if (rank === 1) return "text-[#ffb800]";
  if (rank <= 3) return "text-[#E8E8F0]";
  if (rank <= 10) return "text-[#22d3ee]";
  return "text-accent";
}
