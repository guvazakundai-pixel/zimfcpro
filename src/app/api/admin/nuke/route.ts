import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const NUKE_SECRET = process.env.NUKE_SECRET || "confirm-nuke-s1-reset";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${NUKE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    await db.execute({ sql: "DELETE FROM match_disputes", args: [] });
    await db.execute({ sql: "DELETE FROM match_screenshots", args: [] });
    await db.execute({ sql: "DELETE FROM match_mvp_votes", args: [] });
    await db.execute({ sql: "DELETE FROM match_reports", args: [] });
    await db.execute({ sql: "DELETE FROM match_requests", args: [] });
    await db.execute({ sql: "DELETE FROM challenge_tokens", args: [] });
    await db.execute({ sql: "DELETE FROM points_log", args: [] });
    await db.execute({ sql: "DELETE FROM login_attempts", args: [] });
    await db.execute({ sql: "DELETE FROM audit_logs", args: [] });
    await db.execute({ sql: "DELETE FROM notifications_v2", args: [] });
    await db.execute({ sql: "DELETE FROM notifications", args: [] });
    await db.execute({ sql: "DELETE FROM user_activities", args: [] });
    await db.execute({ sql: "DELETE FROM player_achievements", args: [] });
    await db.execute({ sql: "DELETE FROM weekly_points", args: [] });
    await db.execute({ sql: "DELETE FROM player_stats", args: [] });
    await db.execute({ sql: "DELETE FROM player_rankings", args: [] });
    await db.execute({ sql: "DELETE FROM fantasy_teams", args: [] });
    await db.execute({ sql: "DELETE FROM club_members", args: [] });
    await db.execute({ sql: "DELETE FROM club_rankings", args: [] });
    await db.execute({ sql: "DELETE FROM club_join_requests", args: [] });
    await db.execute({ sql: "DELETE FROM club_invite_codes", args: [] });
    await db.execute({ sql: "DELETE FROM club_posts", args: [] });
    await db.execute({ sql: "DELETE FROM global_club_rankings", args: [] });
    await db.execute({ sql: "DELETE FROM clubs", args: [] });
    await db.execute({ sql: "DELETE FROM friends", args: [] });
    await db.execute({ sql: "DELETE FROM league_participants", args: [] });
    await db.execute({ sql: "DELETE FROM league_standings", args: [] });
    await db.execute({ sql: "DELETE FROM league_fixtures", args: [] });
    await db.execute({ sql: "DELETE FROM league_playoff_matches", args: [] });
    await db.execute({ sql: "DELETE FROM league_seasons", args: [] });
    await db.execute({ sql: "DELETE FROM league_invite_codes", args: [] });
    await db.execute({ sql: "DELETE FROM leagues", args: [] });
    await db.execute({ sql: "DELETE FROM tournament_participants", args: [] });
    await db.execute({ sql: "DELETE FROM tournament_matches", args: [] });
    await db.execute({ sql: "DELETE FROM tournament_groups", args: [] });
    await db.execute({ sql: "DELETE FROM tournament_group_standings", args: [] });
    await db.execute({ sql: "DELETE FROM tournament_invite_codes", args: [] });
    await db.execute({ sql: "DELETE FROM tournaments", args: [] });
    await db.execute({ sql: "DELETE FROM wagers", args: [] });
    await db.execute({ sql: "DELETE FROM chat_messages", args: [] });
    await db.execute({ sql: "DELETE FROM chat_members", args: [] });
    await db.execute({ sql: "DELETE FROM chat_rooms", args: [] });
    await db.execute({ sql: "DELETE FROM post_likes", args: [] });
    await db.execute({ sql: "DELETE FROM post_comments", args: [] });
    await db.execute({ sql: "DELETE FROM post_reactions", args: [] });
    await db.execute({ sql: "DELETE FROM follows", args: [] });
    await db.execute({ sql: "DELETE FROM ranking_history", args: [] });
    await db.execute({ sql: "DELETE FROM club_activities", args: [] });
    await db.execute({ sql: "DELETE FROM club_achievements", args: [] });
    await db.execute({ sql: "DELETE FROM rivalries", args: [] });
    await db.execute({ sql: "DELETE FROM reports", args: [] });
    await db.execute({ sql: "DELETE FROM disputes", args: [] });
    await db.execute({ sql: "DELETE FROM media", args: [] });
    await db.execute({ sql: "DELETE FROM manager_applications", args: [] });
    await db.execute({ sql: "DELETE FROM activity_logs", args: [] });
    await db.execute({ sql: "DELETE FROM system_health", args: [] });
    await db.execute({ sql: "DELETE FROM users", args: [] });

    return NextResponse.json({ success: true, message: "All data nuked — Season 1 starts fresh" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Nuke failed" }, { status: 500 });
  }
}