"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#060608", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ fontSize: "0.9rem", color: "#999", margin: "0 0 24px", maxWidth: 400 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#060608",
              border: "none",
              padding: "12px 28px",
              borderRadius: "14px",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
