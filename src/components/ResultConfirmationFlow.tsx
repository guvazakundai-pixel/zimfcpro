"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ConfirmationStep = "waiting" | "submitted" | "confirmed" | "disputed" | "complete";

type ResultConfirmationFlowProps = {
  show: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
  initialScore1?: number;
  initialScore2?: number;
  isPlayer1: boolean;
  mySubmittedScore: { score1: number; score2: number } | null;
  opponentSubmittedScore: { score1: number; score2: number } | null;
  onConfirm: (score1: number, score2: number) => void;
  onDispute: (reason: string) => void;
  onClose: () => void;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 6L6 18" /><path d="M6 6l12 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function ResultConfirmationFlow({
  show,
  matchId,
  player1Name,
  player2Name,
  initialScore1,
  initialScore2,
  isPlayer1,
  mySubmittedScore,
  opponentSubmittedScore,
  onConfirm,
  onDispute,
  onClose,
}: ResultConfirmationFlowProps) {
  const [step, setStep] = useState<ConfirmationStep>("waiting");
  const [score1, setScore1] = useState(initialScore1 || 0);
  const [score2, setScore2] = useState(initialScore2 || 0);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const myName = isPlayer1 ? player1Name : player2Name;
  const opponentName = isPlayer1 ? player2Name : player1Name;
  const myScore = isPlayer1 ? score1 : score2;
  const opponentScore = isPlayer1 ? score2 : score1;

  const bothSubmitted = mySubmittedScore && opponentSubmittedScore;
  const scoresMatch = bothSubmitted &&
    mySubmittedScore.score1 === opponentSubmittedScore.score1 &&
    mySubmittedScore.score2 === opponentSubmittedScore.score2;

  const handleSubmit = () => {
    onConfirm(score1, score2);
    setStep("submitted");
  };

  const handleDispute = () => {
    if (!disputeReason.trim()) return;
    onDispute(disputeReason);
    setStep("disputed");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative w-full max-w-sm rounded-[24px] p-6 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(18,20,24,0.95), rgba(14,16,18,0.9))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Step: Enter Score */}
            {step === "waiting" && !mySubmittedScore && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Result Confirmation</p>
                </div>
                <p className="text-center text-sm text-muted-soft">
                  Enter the score for <span className="text-ink font-bold">{myName}</span> vs <span className="text-ink font-bold">{opponentName}</span>
                </p>

                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 text-center">
                    <p className="text-[11px] font-bold text-muted-soft mb-2 truncate">{myName}</p>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={score1}
                      onChange={(e) => setScore1(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full h-14 rounded-[14px] bg-white/5 border border-white/10 text-center text-3xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40"
                      autoFocus
                    />
                  </div>
                  <span className="text-2xl text-muted-faint font-bold">:</span>
                  <div className="flex-1 text-center">
                    <p className="text-[11px] font-bold text-muted-soft mb-2 truncate">{opponentName}</p>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={score2}
                      onChange={(e) => setScore2(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full h-14 rounded-[14px] bg-white/5 border border-white/10 text-center text-3xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full h-12 rounded-[14px] cta-primary text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
                >
                  Confirm Score
                </button>
              </div>
            )}

            {/* Step: Waiting for opponent */}
            {step === "submitted" && !bothSubmitted && (
              <div className="text-center py-6 space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mx-auto h-16 w-16 rounded-[20px] flex items-center justify-center"
                  style={{ background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)", color: "var(--accent)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </motion.div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint">Waiting for Opponent</p>
                <p className="text-sm text-muted-soft">
                  Waiting for <span className="text-ink font-bold">{opponentName}</span> to submit their score
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}

            {/* Step: Both submitted - compare scores */}
            {step === "submitted" && bothSubmitted && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint mb-1">Both Scores Submitted</p>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-soft">{myName}</p>
                      <p className="text-2xl font-bold font-mono text-ink">{mySubmittedScore.score1}</p>
                    </div>
                    <span className="text-muted-faint text-lg">:</span>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-soft">{opponentName}</p>
                      <p className="text-2xl font-bold font-mono text-ink">{mySubmittedScore.score2}</p>
                    </div>
                  </div>
                </div>

                {scoresMatch ? (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(0,255,133,0.12)", color: "var(--accent)" }}>
                      <CheckIcon />
                    </div>
                    <p className="text-sm text-accent font-bold">Scores Match!</p>
                    <p className="text-[10px] text-muted-soft mt-1">Result confirmed automatically</p>
                    <button
                      onClick={onClose}
                      className="mt-4 h-10 px-6 rounded-[12px] cta-primary text-[9px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
                    >
                      Continue
                    </button>
                  </motion.div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,77,77,0.12)", color: "var(--negative)" }}>
                      <XIcon />
                    </div>
                    <p className="text-sm text-negative font-bold">Scores Don&apos;t Match!</p>
                    <p className="text-[10px] text-muted-soft">
                      You entered {mySubmittedScore.score1}-{mySubmittedScore.score2}<br />
                      {opponentName} entered {opponentSubmittedScore.score1}-{opponentSubmittedScore.score2}
                    </p>
                    <p className="text-[9px] text-muted-faint uppercase tracking-wider">This match will be flagged for review</p>
                    {!showDisputeForm ? (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setShowDisputeForm(true)}
                          className="flex-1 h-11 rounded-[12px] text-[9px] font-bold uppercase tracking-wider border border-negative/30 text-negative hover:bg-negative/10 transition-all"
                        >
                          <AlertIcon />
                          Report Issue
                        </button>
                        <button
                          onClick={onClose}
                          className="flex-1 h-11 rounded-[12px] text-[9px] font-bold uppercase tracking-wider bg-white/5 text-muted-soft hover:text-ink transition-all"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <textarea
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="Describe what happened..."
                          className="w-full h-20 rounded-[12px] bg-white/5 border border-white/10 text-sm text-ink p-3 resize-none focus:outline-none focus:border-accent/40"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDisputeForm(false)}
                            className="flex-1 h-10 rounded-[10px] text-[9px] font-bold uppercase tracking-wider border border-white/10 text-muted-soft hover:text-ink transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDispute}
                            disabled={!disputeReason.trim()}
                            className="flex-1 h-10 rounded-[10px] text-[9px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
                            style={{ background: "var(--negative)" }}
                          >
                            Submit Report
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step: Disputed */}
            {step === "disputed" && (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto h-14 w-14 rounded-[20px] flex items-center justify-center" style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)", color: "var(--negative)" }}>
                  <AlertIcon />
                </div>
                <p className="text-sm text-negative font-bold">Match Disputed</p>
                <p className="text-[10px] text-muted-soft">
                  An admin will review this match and resolve the dispute.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 h-10 px-6 rounded-[12px] text-[9px] font-bold uppercase tracking-wider border border-white/10 text-muted-soft hover:text-ink transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
