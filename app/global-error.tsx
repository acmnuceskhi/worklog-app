"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#0f172a", color: "#fff" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "rgba(239,68,68,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                marginBottom: 24,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#fbbf24",
                color: "#000",
                fontWeight: 600,
                border: "none",
                borderRadius: 6,
                padding: "10px 24px",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
