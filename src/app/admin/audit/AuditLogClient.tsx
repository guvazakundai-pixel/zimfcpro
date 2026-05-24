"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AuditAdmin = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
};

type AuditEntry = {
  id: string;
  action: string;
  target: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  admin: AuditAdmin;
};

export function AuditLogClient({
  actionLabels,
  actionColors,
}: {
  actionLabels: Record<string, string>;
  actionColors: Record<string, string>;
}) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (actionFilter) params.set("action", actionFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [actionFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  const actionOptions = [
    { value: "", label: `All Actions (${total})` },
    ...uniqueActions.map((a) => ({
      value: a,
      label: `${actionLabels[a] || a} (${logs.filter((l) => l.action === a).length})`,
    })),
  ];

  const allActions = Object.keys(actionLabels);
  const fullActionCounts = allActions.reduce(
    (acc, a) => {
      acc[a] = logs.filter((l) => l.action === a).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-faint"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin or target..."
            className="w-full h-11 rounded-[14px] bg-bg-elevated/60 border border-border-faint pl-10 pr-4 text-sm text-ink placeholder:text-muted-faint outline-none focus:border-accent/30 transition-colors"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-11 rounded-[14px] bg-bg-elevated/60 border border-border-faint px-3 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
        >
          <option value="">All Actions</option>
          {allActions.map((a) => (
            <option key={a} value={a}>
              {actionLabels[a] || a} ({fullActionCounts[a] || 0})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="frosted-card-sm p-5 animate-pulse rounded-[16px]">
              <div className="h-4 w-2/3 rounded bg-bg-highlight/50" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="frosted-card p-12 text-center rounded-[20px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-10 w-10 mx-auto mb-3 text-muted-faint"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-sm text-muted-soft">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {logs.map((entry, idx) => {
              const colorClass = actionColors[entry.action] || "text-muted-soft border-border-faint bg-bg-highlight/40";
              const isExpanded = expanded === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="frosted-card-sm rounded-[16px] overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <span
                      className={`shrink-0 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.16em] border ${colorClass}`}
                    >
                      {actionLabels[entry.action] || entry.action}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">
                        @{entry.admin.displayName || entry.admin.username}
                      </p>
                      <p className="font-mono text-[10px] text-muted-soft truncate">
                        {entry.target}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-mono text-muted-faint tabular-nums">
                        {new Date(entry.createdAt).toLocaleDateString("en-ZW", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[9px] font-mono text-muted-faint tabular-nums">
                        {new Date(entry.createdAt).toLocaleTimeString("en-ZW", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className={`h-3.5 w-3.5 text-muted-faint transition-transform shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isExpanded && entry.details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t border-border-faint"
                    >
                      <div className="px-4 py-3 bg-bg-highlight/20">
                        <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mb-2">
                          Details
                        </p>
                        <pre className="text-[11px] font-mono text-muted-soft leading-relaxed whitespace-pre-wrap break-all">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
