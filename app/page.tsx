"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share_Tech_Mono } from "next/font/google"; // Techy font
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn, useSession } from "next-auth/react";
import styles from "./page.module.css";

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
      <div className={styles.redirectContainer}>
        <p className={styles.redirectText}>Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Gradient Blobs */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <div className={styles.innerContainer}>
        {/* LEFT SIDE */}
        <div className={styles.left}>
          <div className={`${shareTechMono.className} ${styles.worklog}`}>
            WORKLOG<span className="caret">_</span>
          </div>
          <div className={styles.tagline}>Track your projects like a pro</div>
        </div>

        {/* RIGHT SIDE: LOGIN CARD */}
        <div className={styles.card}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button onClick={handleLogin} className={styles.loginButton}>
            Login
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine}></div>
          </div>

          <div className={styles.socialContainer}>
            <button onClick={handleGoogleLogin} className={styles.socialButton}>
              <FcGoogle size={20} />
              Google
            </button>
            <button onClick={handleGithubLogin} className={styles.socialButton}>
              <FaGithub size={20} />
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
