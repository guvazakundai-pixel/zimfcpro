"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referralXp: number;
  referralCount: number;
  referralRank: number;
  recruits: Array<{ id: string; username: string; displayName: string | null; joinedAt: string }>;
}

export function ReferralPanel() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.referralLink) {
          QRCode.toDataURL(d.referralLink, {
            width: 200,
            margin: 1,
            color: { dark: "#EDEDED", light: "rgba(0,0,0,0)" },
          }).then(setQrDataUrl).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyLink = useCallback(() => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.referralLink]);

  const shareWhatsApp = useCallback(() => {
    if (!data?.referralLink) return;
    const text = encodeURIComponent(`Join me on ZimFC Pro — the official competitive FC ecosystem of Zimbabwe! 🏆\n\nUse my referral link: ${data.referralLink}\n\nCode: ${data.referralCode}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setNotify("WhatsApp opened");
    setTimeout(() => setNotify(null), 2000);
  }, [data?.referralLink, data?.referralCode]);

  if (loading) {
    return (
      <div className="frosted-card rounded-[24px] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft mb-3">Referral</p>
        <div className="h-20 rounded-[12px]" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="frosted-card rounded-[24px] overflow-hidden">
      {notify && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-[14px] text-sm font-bold"
          style={{ background: "rgba(0,255,133,0.12)", border: "1px solid rgba(0,255,133,0.20)", backdropFilter: "blur(12px)" }}
        >
          {notify}
        </motion.div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft">
            Referral Program
          </p>
          {data.referralRank > 0 && (
            <span className="text-[10px] text-gold font-bold">
              Rank #{data.referralRank}
            </span>
          )}
        </div>

        <div
          className="rounded-[16px] p-4 mb-4 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,184,0,0.06), rgba(255,184,0,0.02))",
            border: "1px solid rgba(255,184,0,0.10)",
          }}
        >
          <p className="text-2xl font-black text-gold tracking-widest font-mono">
            {data.referralCode}
          </p>
          <p className="text-[9px] text-muted-faint mt-1 uppercase tracking-wider">
            Your referral code
          </p>
        </div>

        {qrDataUrl && (
          <div className="flex justify-center mb-4">
            <div
              className="p-2 rounded-[12px]"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <img src={qrDataUrl} alt="Referral QR" className="w-24 h-24" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-[12px] p-3 text-center" style={{ background: "rgba(0,255,133,0.04)", border: "1px solid rgba(0,255,133,0.08)" }}>
            <p className="text-lg font-black text-accent tabular-nums">{data.referralCount}</p>
            <p className="text-[8px] text-muted-faint uppercase tracking-wider">Recruited</p>
          </div>
          <div className="rounded-[12px] p-3 text-center" style={{ background: "rgba(255,184,0,0.04)", border: "1px solid rgba(255,184,0,0.08)" }}>
            <p className="text-lg font-black text-gold tabular-nums">+{data.referralXp}</p>
            <p className="text-[8px] text-muted-faint uppercase tracking-wider">XP Earned</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: copied ? "rgba(0,255,133,0.12)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: copied ? "var(--accent)" : "var(--ink)",
            }}
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(37,211,102,0.10)",
              border: "1px solid rgba(37,211,102,0.15)",
              color: "#25D366",
            }}
          >
            WhatsApp
          </button>
        </div>

        {data.recruits.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-4 py-2 text-[10px] text-muted-soft uppercase tracking-wider hover:text-accent transition-colors"
            >
              {expanded ? "Hide" : "Show"} recruited players ({data.recruits.length})
            </button>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="space-y-1.5 mt-2"
              >
                {data.recruits.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 px-3 rounded-[10px]" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="text-xs text-ink">@{r.username}</span>
                    <span className="text-[9px] text-muted-faint">{timeAgo(r.joinedAt)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
