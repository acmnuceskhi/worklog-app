"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share_Tech_Mono } from "next/font/google"; // Techy font
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn, useSession } from "next-auth/react";

const shareTechMono = Share_Tech_Mono({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mounted = typeof window !== "undefined";

  // Redirect to home if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/home");
    }
  }, [status, session, router]);

  const handleLogin = () => {
    if (email && password) router.push("/home");
    else alert("Please enter email and password");
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/home" });
  };

  const handleGithubLogin = () => {
    signIn("github", { callbackUrl: "/home" });
  };

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted || status === "loading") {
    return null;
  }

  // If already authenticated, show loading while redirecting
  if (status === "authenticated") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#0A173B",
        }}
      >
        <p style={{ color: "white", fontSize: "1.2rem" }}>
          Redirecting to home...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Gradient Blobs */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      <div style={styles.innerContainer}>
        {/* LEFT SIDE */}
        <div style={styles.left}>
          <div
            className={`${shareTechMono.className} worklog`}
            style={styles.worklog}
          >
            WORKLOG<span className="caret">_</span>
          </div>
          <div style={styles.tagline}>Track your projects like a pro</div>
        </div>

        {/* RIGHT SIDE: LOGIN CARD */}
        <div style={styles.card}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.loginButton}>
            Login
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>OR</span>
            <span style={styles.dividerLine}></span>
          </div>

          <div style={styles.socialContainer}>
            <button style={styles.socialButton} onClick={handleGoogleLogin}>
              <FcGoogle size={20} />{" "}
              <span style={{ marginLeft: 8 }}>Google</span>
            </button>
            <button style={styles.socialButton} onClick={handleGithubLogin}>
              <FaGithub size={20} />{" "}
              <span style={{ marginLeft: 8 }}>GitHub</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .worklog {
          display: inline-block;
          position: relative;
          letter-spacing: 1px;
          color: #fff; /* white for text */
        }
        .caret {
          color: #a6c1ee; /* subtle pink-blue accent */
          margin-left: 6px;
          animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "0 20px",
    backgroundColor: "#0A173B", // dark blue background
  },

  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, #00FFF0 0%, transparent 70%)",
    top: "-20%",
    left: "-15%",
    filter: "blur(120px)",
    zIndex: 0,
  },
  blob2: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, #FF6ECF 0%, transparent 70%)",
    bottom: "-25%",
    right: "-15%",
    filter: "blur(150px)",
    zIndex: 0,
  },

  innerContainer: {
    display: "flex",
    maxWidth: "1100px",
    width: "100%",
    gap: "48px",
    zIndex: 1,
  },

  left: {
    flex: "0 0 45%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
  },

  worklog: {
    fontSize: "4rem",
    fontWeight: 500,
  },

  tagline: {
    marginTop: 8,
    fontSize: "1.2rem",
    color: "#a6c1ee", // subtle pink-blue
    fontWeight: 500,
    letterSpacing: "0.02em",
  },

  card: {
    flex: "1 1 55%",
    padding: 36,
    borderRadius: 16,
    background: "#111c2b",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    boxShadow: "0 6px 20px rgba(37,99,235,0.12)",
  },

  input: {
    padding: "12px 14px",
    borderRadius: 8,
    border: "none",
    outline: "none",
    fontSize: "1rem",
    background: "#1b2435",
    color: "#fff",
  },

  loginButton: {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #00FFF0, #FF6ECF)",
    color: "#111c2b",
    fontWeight: 600,
    fontSize: "1rem",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    background: "#555",
  },

  dividerText: {
    color: "#fff",
    fontWeight: 500,
    fontSize: "0.9rem",
  },

  socialContainer: {
    display: "flex",
    gap: 10,
    marginTop: 5,
  },

  socialButton: {
    flex: 1,
    padding: "10px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#1b2435",
    color: "#fff",
    fontWeight: 500,
    fontSize: "0.9rem",
  },
};
