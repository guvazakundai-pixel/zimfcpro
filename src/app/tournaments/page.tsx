import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import Link from "next/link";
import { TournamentListClient } from "@/components/tournaments/TournamentListClient";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export default async function TournamentsPage() {
  const session = await getSession();

  async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn(); } catch (e) { console.error("[Tournaments] Query failed:", e); return fallback; }
  }

  const tournaments = await safeQuery(async () => {
    const result = await db.execute({
      sql: `SELECT t.id, t.name, t.type, t.status, t.city, t.prize_pool AS prizePool, t.entry_fee AS entryFee,
                   t.max_players AS maxPlayers, t.start_at AS startAt, t.created_at AS createdAt,
                   u.username AS organizerName,
                   (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id AND tp.status != 'WITHDRAWN') AS playerCount
            FROM tournaments t
            LEFT JOIN users u ON u.id = t.organizer_id
            WHERE t.visibility = 'PUBLIC' OR t.visibility IS NULL
            ORDER BY t.status = 'LIVE' DESC, t.status = 'REGISTRATION' DESC, t.created_at DESC
            LIMIT 50`,
      args: [],
    });
    return (result.rows as Row[]).map((r: Row) => ({
      id: r.id as string,
      name: r.name as string,
      type: (r.type as string) || "KNOCKOUT",
      status: (r.status as string) || "DRAFT",
      city: r.city as string | null,
      prizePool: (r.prizePool as number) || 0,
      entryFee: (r.entryFee as number) || 0,
      maxPlayers: (r.maxPlayers as number) || 0,
      playerCount: (r.playerCount as number) || 0,
      startAt: r.startAt as string | null,
      createdAt: r.createdAt as string,
      organizerName: (r.organizerName as string) || "ZIM FCPRO",
    }));
  }, []);

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">Competitions</span>
            </div>
            <h1 className="cinematic-heading text-4xl sm:text-6xl text-ink leading-[0.88]">
              <span className="text-gradient-accent">Tournaments</span>
            </h1>
            <p className="mt-2 text-sm text-muted-soft">Compete, climb, conquer — ZW tournament circuit.</p>
          </div>
          {session && (
            <Link
              href="/tournaments/create"
              className="shrink-0 h-11 px-5 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase cta-primary text-[#0D0D0F] flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
            </Link>
          )}
        </div>
        <TournamentListClient tournaments={tournaments} />
      </div>
    </div>
  );
}
