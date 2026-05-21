"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: string;
  completed: boolean;
}

export function OnboardingMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((data) => setMissions(data.missions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="frosted-card rounded-[24px] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft mb-3">Getting Started</p>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-[12px]" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (missions.length === 0) return null;

  return (
    <div className="frosted-card rounded-[24px] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft">
          Getting Started
        </p>
        <span className="text-[10px] text-accent font-bold">
          {missions.filter((m) => m.completed).length}/{missions.length}
        </span>
      </div>
      <div className="space-y-2">
        {missions.map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-[14px] transition-colors"
            style={{
              background: mission.completed ? "rgba(0,255,133,0.04)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${mission.completed ? "rgba(0,255,133,0.10)" : "rgba(255,255,255,0.03)"}`,
              opacity: mission.completed ? 0.6 : 1,
            }}
          >
            <div
              className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0"
              style={{
                background: mission.completed
                  ? "rgba(0,255,133,0.12)"
                  : "rgba(255,255,255,0.04)",
              }}
            >
              {mission.completed ? (
                <span className="text-accent text-sm">✓</span>
              ) : (
                <span className="text-muted-faint text-xs">●</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink truncate">{mission.title}</p>
              <p className="text-[10px] text-muted-faint truncate">{mission.description}</p>
            </div>
            <span className="text-[10px] font-bold text-gold whitespace-nowrap">
              +{mission.xpReward} XP
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
