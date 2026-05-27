"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ClubError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[ClubsError]", error); }, [error]);
  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,184,0,0.04)", border: "1px solid rgba(255,184,0,0.10)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-gold/60"><path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" /></svg>
        </div>
        <h1 className="bc-headline text-2xl text-ink">Clubs unavailable</h1>
        <p className="text-muted-soft text-sm">Something went wrong loading club data. Please try again.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary rounded-[14px] px-6 h-11 text-sm">Try Again</button>
          <Link href="/" className="btn-ghost rounded-[14px] px-6 h-11 text-sm inline-flex items-center justify-center">Go Home</Link>
        </div>
      </div>
    </div>
  );
}