import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuditLogClient } from "./AuditLogClient";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  CLUB_UPDATE: "Club Update",
  MEMBER_APPROVE: "Member Approved",
  MEMBER_REJECT: "Member Rejected",
  MEMBER_PROMOTE: "Member Promoted",
  MEMBER_REMOVE: "Member Removed",
  RANKING_REORDER: "Ranking Reordered",
  MEDIA_UPLOAD: "Media Uploaded",
  MEDIA_DELETE: "Media Deleted",
  RANK_RECOMPUTE: "Rankings Recalculated",
  MATCH_CONFIRM: "Match Confirmed",
  MATCH_APPROVE: "Match Approved",
  MATCH_DISPUTE: "Match Dispute",
  MATCH_REQUEST_ACCEPT: "Match Request Accepted",
  MATCH_REQUEST_DECLINE: "Match Request Declined",
  MATCH_REQUEST_CANCEL: "Match Request Cancelled",
};

const ACTION_COLORS: Record<string, string> = {
  CLUB_UPDATE: "text-cyan border-cyan/20 bg-cyan/8",
  MEMBER_APPROVE: "text-accent border-accent/20 bg-accent/8",
  MEMBER_REJECT: "text-negative border-negative/20 bg-negative/8",
  MEMBER_PROMOTE: "text-gold border-gold/20 bg-gold/8",
  MEMBER_REMOVE: "text-negative border-negative/20 bg-negative/8",
  RANKING_REORDER: "text-purple border-purple/20 bg-purple/8",
  MEDIA_UPLOAD: "text-cyan border-cyan/20 bg-cyan/8",
  MEDIA_DELETE: "text-negative border-negative/20 bg-negative/8",
  RANK_RECOMPUTE: "text-gold border-gold/20 bg-gold/8",
  MATCH_CONFIRM: "text-accent border-accent/20 bg-accent/8",
  MATCH_APPROVE: "text-accent border-accent/20 bg-accent/8",
  MATCH_DISPUTE: "text-negative border-negative/20 bg-negative/8",
  MATCH_REQUEST_ACCEPT: "text-accent border-accent/20 bg-accent/8",
  MATCH_REQUEST_DECLINE: "text-negative border-negative/20 bg-negative/8",
  MATCH_REQUEST_CANCEL: "text-muted-soft border-border-faint bg-bg-highlight/40",
};

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/audit");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-soft">
          Admin
        </p>
        <h1 className="bc-headline text-3xl text-ink">Audit Log</h1>
        <p className="text-sm text-muted-soft mt-1">
          Track all admin actions across the platform
        </p>
      </header>

      <AuditLogClient actionLabels={ACTION_LABELS} actionColors={ACTION_COLORS} />
    </div>
  );
}
