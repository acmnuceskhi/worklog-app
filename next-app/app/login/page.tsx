"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sacramento } from "next/font/google";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const sacramento = Sacramento({ weight: "400", subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (email && password) router.push("/home");
    else alert("Please enter email and password");
  };

  const handleGoogleLogin = () => alert("Google login clicked!");
  const handleGithubLogin = () => alert("GitHub login clicked!");

  return (
    <div style={styles.container}>
      {/* Gradient Blobs */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      <div style={styles.innerContainer}>
        <div className="overlay" />
        {/* LEFT SIDE */}
        <div style={styles.left}>
          <div className={`${sacramento.className} worklog`} style={styles.worklog}>
              Worklog<span className="caret">_</span>
          </div>
          <div style={styles.tagline}>Track ur progress</div> 
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
              <FcGoogle size={20} /> <span style={{ marginLeft: 8 }}>Google</span>
            </button>
            <button style={styles.socialButton} onClick={handleGithubLogin}>
              <FaGithub size={20} /> <span style={{ marginLeft: 8 }}>GitHub</span>
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .overlay { position:absolute; inset:0; pointer-events:none; background-image: linear-gradient(rgba(96,165,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.02) 1px, transparent 1px); background-size:24px 24px,24px 24px; mix-blend-mode:overlay; }
        .worklog { display:inline-block; position:relative; }
        .caret { color: #60a5fa; margin-left:6px; opacity:0.95; animation: blink 1s steps(2,start) infinite }
        @keyframes blink { 50% { opacity: 0 } }
        @media (max-width:900px) { .overlay { background-size: 16px 16px, 16px 16px } }
      `}</style>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "0 20px",
    backgroundColor: "#0A173B", // darker blue
  },

  // Gradient blobs
  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, #00FFF0 0%, transparent 70%)",
    top: "-20%",
    left: "-15%",
    filter: "blur(180px)",
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
    filter: "blur(200px)",
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
    flex: '0 0 45%',
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingTop: "18px",
    position: "relative",
  },

  worklog: {
    fontSize: "4.8rem",
    color: "#fff",
    textShadow: "0 0 26px rgba(96,165,250,0.14)",
  },

  tagline: {
    marginTop: 8, 
    marginLeft: 0, 
    fontSize: "1.25rem", 
    color: "#00FFF0", 
    fontWeight: 500, 
    letterSpacing: "0.02em", 
  },

  card: {
    flex: '1 1 55%',
    padding: 40,
    borderRadius: 20,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    boxShadow: "0 12px 48px rgba(37,99,235,0.12)",
  },

  input: {
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    outline: "none",
    fontSize: "1rem",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
  },

  loginButton: {
    padding: "14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #00FFF0, #FF6ECF)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "1rem",
    transition: "all 0.25s ease",
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
    background: "rgba(255,255,255,0.3)",
  },

  dividerText: {
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.9rem",
  },

  socialContainer: {
    display: "flex",
    gap: 10,
    marginTop: 5,
  },

  socialButton: {
    flex: 1,
    padding: "12px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontWeight: 500,
    fontSize: "0.95rem",
    transition: "all 0.25s ease",
  },
};
