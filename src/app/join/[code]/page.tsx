import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JoinReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const codeUpper = code.toUpperCase();

  const row = await db.execute({
    sql: "SELECT id, username, referral_count FROM users WHERE referral_code = ? LIMIT 1",
    args: [codeUpper],
  });

  const referrer = row.rows[0] as Record<string, unknown> | undefined;
  if (!referrer) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse at center, rgba(0,255,133,0.03) 0%, rgba(10,10,12,0.98) 70%)",
      }}
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="h-20 w-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,133,0.15), rgba(34,211,238,0.10))",
              border: "2px solid rgba(0,255,133,0.20)",
            }}
          >
            <span className="text-3xl">🤝</span>
          </div>
          <h1 className="text-2xl font-black text-ink">Join ZimFC Pro</h1>
          <p className="text-muted-soft text-sm mt-2">
            You were invited by <span className="text-accent font-bold">{referrer.username as string}</span>
          </p>
          <p className="text-[10px] text-muted-faint mt-1 uppercase tracking-wider">
            {Number(referrer.referral_count ?? 0) > 0
              ? `${referrer.username as string} has recruited ${referrer.referral_count as number} player(s)`
              : "New to the platform"}
          </p>
        </div>

        <div
          className="rounded-[24px] p-6 mb-6 text-left"
          style={{
            background: "rgba(18,20,24,0.60)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft mb-4 text-center">What you get</p>
          <div className="space-y-3">
            {["Auto-ranked in Global Standings", "Starter Division: Bronze III", "Personal Referral Code", "Onboarding Missions", "Competitive Matchmaking"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-accent text-sm">✓</span>
                <span className="text-sm text-ink">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/?auth=join"
          className="block w-full py-4 rounded-[16px] font-bold text-base uppercase tracking-wider text-center"
          style={{
            background: "var(--accent)",
            color: "#000",
            boxShadow: "0 0 40px rgba(0,255,133,0.15)",
          }}
        >
          Create Your Account
        </Link>

        <p className="text-[10px] text-muted-faint mt-4">
          Already a member? <Link href="/?auth=signin" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
