"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

const PLATFORMS = [
  { value: "CROSSPLAY", label: "Crossplay" },
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC (EA App)" },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("Zimbabwe");
  const [platform, setPlatform] = useState("CROSSPLAY");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const { user } = await res.json();
           setDisplayName(user.displayName || "");
           setUsername(user.username || "");
           setBio(user.bio || "");
           setCountry(user.country || "Zimbabwe");
           setPlatform(user.platform || "CROSSPLAY");
           setAvatarUrl(user.avatarUrl || "");
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setUploading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 400, useWebWorker: true });
      const formData = new FormData();
      formData.append("avatar", compressed, compressed.name);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (cloudName) {
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
        const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
        if (upRes.ok) { const upData = await upRes.json(); setAvatarUrl(upData.secure_url); toast.success("Avatar uploaded!"); }
        else { toast.error("Upload failed"); }
      } else {
        const upRes = await fetch("/api/auth/update-profile", { method: "PATCH", body: formData });
        if (upRes.ok) { const d = await upRes.json(); setAvatarUrl(d.avatarUrl || ""); toast.success("Avatar uploaded!"); }
        else { toast.error("Upload failed"); }
      }
    } catch { toast.error("Upload failed"); } finally { setUploading(false); }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, country, platform }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Update failed");
      return;
    }
    setSuccess(true);
    startTransition(() => {
      router.refresh();
    });
  }

  if (loading) {
    return (
      <div className="broadcast-theme min-h-screen bc-noise">
        <div className="mx-auto max-w-xl px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-soft">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-ink transition-colors duration-200 mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </button>
        <h1 className="bc-headline text-3xl text-ink mb-6">Edit Profile</h1>

        {error && (
          <div className="rounded-[12px] border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative/90 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-[12px] border border-accent/30 bg-accent/8 px-3 py-2 text-sm text-accent mb-4">
            Profile updated!
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Avatar
            </span>
            <div className="flex items-center gap-3 mb-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover border border-border" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xl font-bold">
                  {(displayName || username || "?")[0].toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-ghost rounded-[12px] px-4 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50">
                {uploading ? "Uploading..." : "Change Avatar"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Display Name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={3}
              maxLength={30}
              required
              className="w-full apple-input px-3 py-2.5 text-ink text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              EA FC Username <span className="text-muted-faint">(cannot be changed)</span>
            </span>
            <input
              disabled
              value={username ? `@${username}` : ""}
              className="w-full rounded-[14px] border border-border-faint bg-bg-elevated/60 px-3 py-2.5 text-muted-faint text-sm cursor-not-allowed"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full apple-input px-3 py-2.5 text-ink text-sm resize-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Country
            </span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full apple-input px-3 py-2.5 text-ink text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Platform
            </span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[14px] cta-primary py-2.5 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none"
          >
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}