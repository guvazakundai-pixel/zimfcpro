import { db } from "@/lib/db";

export default async function HomePage() {
  let playerCount = 0, clubCount = 0, matchCount = 0, totalGoals = 0;
  let topPlayers: any[] = [];

  try {
    const r = await db.execute(
      "SELECT COALESCE(SUM(matches_played),0) as tm, COALESCE(SUM(goals_scored),0) as tg, count(*) as pc, (SELECT count(*) FROM clubs) as cc FROM player_stats"
    );
    const row = r.rows[0] as any;
    matchCount = Number(row?.tm ?? 0);
    totalGoals = Number(row?.tg ?? 0);
    playerCount = Number(row?.pc ?? 0);
    clubCount = Number(row?.cc ?? 0);
  } catch {}

  try {
    const r = await db.execute({
      sql: `SELECT u.username, u.display_name, u.country, pr.rank_position, pr.points,
                   ps.skill_rating, ps.wins, ps.losses
            FROM player_rankings pr JOIN users u ON u.id = pr.user_id
            LEFT JOIN player_stats ps ON ps.user_id = u.id
            ORDER BY pr.rank_position ASC LIMIT 10`,
      args: [],
    });
    topPlayers = (r.rows as any[]).map(row => ({
      username: row.username,
      displayName: row.display_name ?? row.username,
      country: row.country,
      rank: Number(row.rank_position ?? 0),
      points: Number(row.points ?? 0),
      skillRating: Number(row.skill_rating ?? 1000),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
    }));
  } catch {}

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#111", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
          ZIM FCPRO
        </h1>
        <p style={{ fontSize: "1rem", color: "#666", margin: 0 }}>
          Zimbabwe&apos;s #1 EA Sports FC Competitive Platform
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 40 }}>
        <StatCard label="Players" value={playerCount} color="#00b85c" />
        <StatCard label="Clubs" value={clubCount} color="#a855f7" />
        <StatCard label="Matches" value={matchCount} color="#3b82f6" />
        <StatCard label="Goals" value={totalGoals} color="#f97316" />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111", margin: "0 0 16px 0" }}>Top Players</h2>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", color: "#999", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>#</th>
                <th style={{ padding: "12px 16px", color: "#999", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>Player</th>
                <th style={{ padding: "12px 16px", color: "#999", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>SR</th>
                <th style={{ padding: "12px 16px", color: "#999", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>W/L</th>
                <th style={{ padding: "12px 16px", color: "#999", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {topPlayers.map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#00b85c" }}>{p.rank}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#111" }}>{p.displayName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#999" }}>@{p.username} · {p.country}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.skillRating}</td>
                  <td style={{ padding: "12px 16px", color: "#666" }}>{p.wins}W / {p.losses}L</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#00b85c" }}>{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <NavCard href="/rankings" label="Full Rankings" desc="See all players and divisions" />
        <NavCard href="/leagues" label="Leagues" desc="Active and upcoming leagues" />
        <NavCard href="/matches" label="Matches" desc="Challenge players and view history" />
        <NavCard href="/clubs" label="Clubs" desc="Join or manage a club" />
        <NavCard href="/tournaments" label="Tournaments" desc="Compete and win prizes" />
        <NavCard href="/dashboard" label="Dashboard" desc="Your profile, stats, and settings" />
      </div>

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid #eee", fontSize: "0.75rem", color: "#bbb", textAlign: "center" }}>
        ZIM FCPRO · Season 1 · FC26 · Zimbabwe
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e5e5e5", textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1.2 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: "0.7rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function NavCard({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a href={href} style={{ display: "block", background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e5e5e5", textDecoration: "none", color: "inherit" }}>
      <div style={{ fontWeight: 700, color: "#111", fontSize: "0.95rem", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "0.8rem", color: "#999" }}>{desc}</div>
    </a>
  );
}
