"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";

type ChartProps = {
  className?: string;
};

function SkillRatingSparkline({
  data,
  minRating,
  maxRating,
  width = 300,
  height = 80,
}: {
  data: { label: string; value: number }[];
  minRating: number;
  maxRating: number;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-[10px] text-muted-faint">
        Not enough data yet
      </div>
    );
  }

  const range = maxRating - minRating || 1;
  const padX = 4;
  const padY = 8;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + chartH - ((d.value - minRating) / range) * chartH,
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = pathD + ` L ${points.at(-1)!.x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="sr-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={padX}
          y1={padY + chartH * (1 - frac)}
          x2={width - padX}
          y2={padY + chartH * (1 - frac)}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={0.5}
        />
      ))}

      {/* Area fill */}
      <motion.path
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        d={areaD}
        fill="url(#sr-gradient)"
      />

      {/* Line */}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        d={pathD}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          initial={{ r: 0 }}
          animate={{ r: i === points.length - 1 ? 3.5 : 2 }}
          transition={{ delay: 0.8 + i * 0.02, duration: 0.3 }}
          cx={p.x}
          cy={p.y}
          fill={i === points.length - 1 ? "var(--accent)" : "rgba(0,255,133,0.5)"}
          stroke={i === points.length - 1 ? "var(--surface)" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

function FormHistoryChart({
  formHistory,
}: {
  formHistory: string;
}) {
  const results = formHistory.slice(-20).split("");
  if (results.length === 0) return null;

  const colorMap: Record<string, string> = {
    W: "var(--accent)",
    D: "var(--gold)",
    L: "var(--negative)",
  };

  const wins = results.filter((r) => r === "W").length;
  const draws = results.filter((r) => r === "D").length;
  const losses = results.filter((r) => r === "L").length;
  const total = results.length;

  const segW = (wins / total) * 100;
  const segD = (draws / total) * 100;
  const segL = (losses / total) * 100;

  return (
    <div className="space-y-3">
      {/* Bars */}
      <div className="flex items-end gap-[3px] h-[60px]">
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: r === "W" ? 60 : r === "D" ? 28 : 16 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-t-[3px] min-w-[4px]"
            style={{ background: colorMap[r] || "rgba(255,255,255,0.1)" }}
          />
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        {segW > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${segW}%` }}
            className="bg-accent"
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        )}
        {segD > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${segD}%` }}
            className="bg-gold"
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        )}
        {segL > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${segL}%` }}
            className="bg-negative/70"
            transition={{ duration: 0.6, delay: 0.4 }}
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-5 text-[10px] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-accent">{wins}W</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold" />
          <span className="text-gold">{draws}D</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-negative/70" />
          <span className="text-negative/80">{losses}L</span>
        </span>
      </div>
    </div>
  );
}

function AttributeSpider({
  stats,
}: {
  stats: {
    goalsScored: number;
    goalsConceded: number;
    wins: number;
    matchesPlayed: number;
    skillRating: number;
    winStreak: number;
  };
}) {
  const maxRating = 1200;
  const total = stats.matchesPlayed || 1;

  const attributes = [
    { label: "Attack", value: Math.min(1, (stats.goalsScored / Math.max(total, 1)) / 5) },
    { label: "Defense", value: Math.max(0, 1 - (stats.goalsConceded / Math.max(total, 1)) / 5) },
    { label: "Win Rate", value: total > 0 ? stats.wins / total : 0 },
    { label: "Skill", value: stats.skillRating / maxRating },
    { label: "Form", value: Math.min(1, stats.winStreak / 10) },
    { label: "Activity", value: Math.min(1, total / 50) },
  ];

  const cx = 100;
  const cy = 100;
  const radius = 70;
  const angleSlice = (2 * Math.PI) / attributes.length;

  const getPoint = (value: number, i: number) => ({
    x: cx + radius * value * Math.cos(angleSlice * i - Math.PI / 2),
    y: cy + radius * value * Math.sin(angleSlice * i - Math.PI / 2),
  });

  const dataPoints = attributes.map((a, i) => getPoint(a.value, i));
  const ringPoints = attributes.map((_, i) => getPoint(1, i));

  const dataD = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const ringD = ringPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid rings */}
      {[0.33, 0.66, 1].map((frac) => (
        <polygon
          key={frac}
          points={attributes
            .map((_, i) => {
              const p = getPoint(frac, i);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={frac === 1 ? 1 : 0.5}
        />
      ))}

      {/* Axes */}
      {attributes.map((_, i) => {
        const p = getPoint(1, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data */}
      <motion.path
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        d={dataD}
        fill="var(--accent)"
        fillOpacity={0.12}
        stroke="var(--accent)"
        strokeWidth={2}
      />

      {/* Dots */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          initial={{ r: 0 }}
          animate={{ r: 3 }}
          transition={{ delay: 0.6 + i * 0.05 }}
          cx={p.x}
          cy={p.y}
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      {attributes.map((a, i) => {
        const p = getPoint(1.18, i);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-soft"
            style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.12em" }}
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

export function StatCharts({
  stats,
  skillRatingHistory,
  formHistory,
  className = "",
}: {
  stats: {
    goalsScored: number;
    goalsConceded: number;
    wins: number;
    losses: number;
    draws: number;
    matchesPlayed: number;
    skillRating: number;
    winStreak: number;
    formScore: number;
  } | null;
  skillRatingHistory?: { label: string; value: number }[];
  formHistory?: string;
  className?: string;
}) {
  const [chartView, setChartView] = useState<"trend" | "form" | "spider">("trend");

  if (!stats) {
    return (
      <div className={`frosted-card-sm p-6 text-center rounded-[20px] ${className}`}>
        <p className="text-sm text-muted-soft">No stats available yet</p>
      </div>
    );
  }

  return (
    <div className={`frosted-card-sm rounded-[20px] p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint">
          Performance Charts
        </p>
        <div className="flex gap-1 p-0.5 rounded-[8px] bg-white/[0.03] border border-white/[0.04]">
          {(["trend", "form", "spider"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setChartView(v)}
              className={`px-2.5 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider transition-all ${
                chartView === v ? "bg-accent/15 text-accent" : "text-muted-soft hover:text-ink"
              }`}
            >
              {v === "trend" ? "Trend" : v === "form" ? "Form" : "Radar"}
            </button>
          ))}
        </div>
      </div>

      {chartView === "trend" && (
        <motion.div
          key="trend"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {(skillRatingHistory && skillRatingHistory.length >= 2) ? (
            <SkillRatingSparkline
              data={skillRatingHistory}
              minRating={900}
              maxRating={1400}
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-[10px] text-muted-faint">
              Play more matches to see your rating trend
            </div>
          )}
          <p className="text-[8px] font-mono text-muted-faint text-center">
            Skill Rating Trend
          </p>
        </motion.div>
      )}

      {chartView === "form" && (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {formHistory && formHistory.length > 0 ? (
            <FormHistoryChart formHistory={formHistory} />
          ) : (
            <div className="flex items-center justify-center h-20 text-[10px] text-muted-faint">
              Play matches to see your form history
            </div>
          )}
        </motion.div>
      )}

      {chartView === "spider" && (
        <motion.div
          key="spider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AttributeSpider stats={stats} />
        </motion.div>
      )}
    </div>
  );
}

/** Mini sparkline for inline use (rankings list, match cards, etc.) */
export function MiniSparkline({
  data,
  width = 60,
  height = 20,
  accent = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  accent?: boolean;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padX = 1;
  const padY = 2;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const pathD = data
    .map((v, i) => {
      const x = padX + (i / Math.max(data.length - 1, 1)) * w;
      const y = padY + h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="inline-block h-4 w-auto" preserveAspectRatio="xMidYMid meet">
      <path d={pathD} fill="none" stroke={accent ? "var(--accent)" : "var(--muted-soft)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
