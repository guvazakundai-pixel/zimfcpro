import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let playerCount = 0;
  let clubCount = 0;
  let matchCount = 0;

  try {
    const r = await db.execute("SELECT count(*) as c FROM users");
    playerCount = Number((r.rows[0] as any)?.c ?? 0);
  } catch {}

  try {
    const r = await db.execute("SELECT count(*) as c FROM clubs");
    clubCount = Number((r.rows[0] as any)?.c ?? 0);
  } catch {}

  try {
    const r = await db.execute("SELECT count(*) as c FROM match_reports");
    matchCount = Number((r.rows[0] as any)?.c ?? 0);
  } catch {}

  return (
    <main style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto", fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#111", marginBottom: 8 }}>
        ZIM FCPRO
      </h1>
      <p style={{ fontSize: "1rem", color: "#555", marginBottom: 32 }}>
        Zimbabwe&apos;s #1 EA Sports FC Competitive Platform
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Players" value={playerCount} />
        <StatBox label="Clubs" value={clubCount} />
        <StatBox label="Matches" value={matchCount} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <a href="/rankings" style={linkStyle}>View Rankings →</a>
        <a href="/leagues" style={linkStyle}>View Leagues →</a>
        <a href="/matches" style={linkStyle}>View Matches →</a>
        <a href="/clubs" style={linkStyle}>View Clubs →</a>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: "#00b85c" }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px 24px",
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  textDecoration: "none",
  color: "#111",
  fontWeight: 600,
  fontSize: "0.95rem",
};
