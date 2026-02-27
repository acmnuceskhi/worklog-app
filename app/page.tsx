"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share_Tech_Mono } from "next/font/google"; // Techy font
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { useSharedSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import styles from "./page.module.css";

const shareTechMono = Share_Tech_Mono({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSharedSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Redirect to home if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/home");
    }
  }, [status, session, router]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Missing Credentials", {
        description: "Please enter both email and password to login.",
        duration: 2500,
      });
      return;
    }
    router.push("/home");
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/home" });
  };

  const handleGithubLogin = () => {
    signIn("github", { callbackUrl: "/home" });
  };

  // Prevent hydration mismatch by waiting for client mount
  if (!isMounted) {
    return (
      <div className={styles.container}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>
    );
  }

  // Handle loading state
  if (status === "loading") {
    return (
      <div className={styles.redirectContainer}>
        <p className={styles.redirectText}>Initializing...</p>
      </div>
    );
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
          <Button
            onClick={handleLogin}
            className={styles.loginButton}
            aria-label="Login to account"
          >
            Login
          </Button>

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine}></div>
          </div>

          <div className={styles.socialContainer}>
            <Button
              onClick={handleGoogleLogin}
              className={styles.socialButton}
              aria-label="Sign in with Google"
            >
              <FcGoogle size={20} />
              Google
            </Button>
            <Button
              onClick={handleGithubLogin}
              className={styles.socialButton}
              aria-label="Sign in with GitHub"
            >
              <FaGithub size={20} />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
