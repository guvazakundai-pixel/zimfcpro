"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useAuthModal } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAuthStore, type WelcomeData } from "@/store/auth-store";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";

type Tab = "signin" | "join";

const PLATFORMS = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC (EA App)" },
] as const;

export function AuthModal() {
  const { open, tab: initialTab, closeAuth } = useAuthModal();
  const [tab, setTab] = useState<Tab>(initialTab);
  const backdropRef = useRef<HTMLDivElement>(null);
  const welcomeData = useAuthStore((s) => s.welcomeData);
  const setWelcomeData = useAuthStore((s) => s.setWelcomeData);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuth();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeAuth]);

  if (welcomeData) {
    return <WelcomeOverlay data={welcomeData} onDismiss={() => { setWelcomeData(null); closeAuth(); }} />;
  }

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) closeAuth();
      }}
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4 overflow-y-auto"
      style={{ background: "rgba(10,10,12,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md overflow-hidden bc-slide-fade"
        style={{
          borderRadius: "24px",
          background: "rgba(18,20,24,0.88)",
          backdropFilter: "blur(32px) saturate(1.5)",
          WebkitBackdropFilter: "blur(32px) saturate(1.5)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.50), 0 0 0 0.5px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        <div className="flex border-b border-white/[0.04]">
          <TabButton active={tab === "signin"} onClick={() => setTab("signin")} label="Sign In" />
          <TabButton active={tab === "join"} onClick={() => setTab("join")} label="Join" />
          <button
            onClick={closeAuth}
            className="ml-auto px-5 text-[#6B6D78] hover:text-[#EDEDED] transition-colors duration-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {tab === "signin" ? <SignInForm onClose={closeAuth} /> : <JoinForm onClose={closeAuth} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 py-3.5 text-xs font-bold uppercase tracking-[0.22em] transition-all duration-250 " +
        (active
          ? "text-accent border-b-2 border-accent"
          : "text-[#6B6D78] hover:text-[#BFC3C9]")
      }
      style={active ? { background: "rgba(0,255,133,0.04)" } : undefined}
    >
      {label}
    </button>
  );
}

function SignInForm({ onClose }: { onClose: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Login failed");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    startTransition(() => {
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">ZIM FCPRO</p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Welcome back</h2>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput label="Username or email" value={identifier} onChange={setIdentifier} autoComplete="username" required />
      <FieldInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      <button type="submit" disabled={pending} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

function JoinForm({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState("PS5");
  const [region, setRegion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setWelcomeData = useAuthStore((s) => s.setWelcomeData);

  useEffect(() => {
    if (username.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.available);
        }
      } catch {} finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, platform, region }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Registration failed");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    if (data.welcome) {
      setWelcomeData(data.welcome as WelcomeData);
    }
    startTransition(() => {
      onClose();
      router.refresh();
    });
  }

  const suggestions = usernameAvailable === false && username.length >= 3
    ? [`${username}FC`, `${username}Pro`, `${username}01`, `${username}_zw`]
    : [];

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">ZIM FCPRO</p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Create your football identity</h2>
      </div>
      {error && <ErrorBox message={error} />}

      <div>
        <FieldInput
          label="Username" value={username} onChange={setUsername}
          hint="3-20 chars, letters/numbers/underscores — this is your football identity"
          minLength={3} maxLength={20} required
          suffix={
            checkingUsername ? (
              <span className="text-muted-faint text-xs animate-pulse">checking…</span>
            ) : usernameAvailable === true ? (
              <span className="text-accent text-xs">✓ available</span>
            ) : usernameAvailable === false ? (
              <span className="text-negative text-xs">✕ taken</span>
            ) : null
          }
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setUsername(s)}
                className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-muted-soft hover:text-accent hover:border-accent/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <FieldInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
      <FieldInput label="Password" type="password" value={password} onChange={setPassword} hint="8+ characters" minLength={8} autoComplete="new-password" required />

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1">Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
          {PLATFORMS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
        </select>
      </div>

      <FieldInput label="Region (optional)" value={region} onChange={setRegion} hint="e.g. Harare, Bulawayo — for local rankings" />

      <button type="submit" disabled={pending} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}

function FieldInput({ label, type = "text", value, onChange, hint, suffix, ...rest }: { label: string; type?: string; value: string; onChange: (v: string) => void; hint?: string; suffix?: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value">) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">{label}</span>
      <div className="relative">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm" {...rest} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
      {hint && <span className="block text-[10px] text-muted-faint mt-1">{hint}</span>}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] border border-negative/25 px-3 py-2.5 text-sm text-negative/90" style={{ background: "rgba(255,77,77,0.06)" }}>
      {message}
    </div>
  );
}
