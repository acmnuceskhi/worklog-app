"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Share_Tech_Mono } from "next/font/google"; // Techy font
import { GoogleIcon } from "@/components/ui/brand-icons";
// GitHub OAuth removed per requirements - Using Google OAuth (@nu.edu.pk only) instead
// import { GithubIcon } from "@/components/ui/brand-icons";
import { signIn } from "next-auth/react";
import { useSharedSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import styles from "./page.module.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSharedSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Handle OAuth errors
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam && isMounted) {
      const errorMessages: Record<
        string,
        { title: string; description: string }
      > = {
        AccessDenied: {
          title: "Access Denied",
          description:
            "Only users with @nu.edu.pk or @isb.nu.edu.pk email addresses can sign in.",
        },
        OAuthAccountNotLinked: {
          title: "Account Linking Error",
          description:
            "An account with this email already exists. Please sign in with the same method you used originally.",
        },
        OAuthSignin: {
          title: "OAuth Error",
          description: "Could not initiate authentication. Please try again.",
        },
        OAuthCallback: {
          title: "OAuth Error",
          description:
            "Authentication failed. Please make sure you're using the correct university email.",
        },
        EmailSignInError: {
          title: "Sign In Failed",
          description: "Could not sign in with the provided credentials.",
        },
        CredentialsSignin: {
          title: "Invalid Credentials",
          description: "Email or password is incorrect.",
        },
        default: {
          title: "Authentication Error",
          description: "An error occurred during sign in. Please try again.",
        },
      };

      const error = errorMessages[errorParam] || errorMessages.default;
      toast.error(error.title, {
        description: error.description,
        duration: 5000,
      });
    }
  }, [searchParams, isMounted]);

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
    setIsLoggingIn(true);
    router.push("/home");
  };

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    signIn("google", { callbackUrl: "/home" });
  };

  // GitHub OAuth removed per requirements
  // const handleGithubLogin = () => {
  //   signIn("github", { callbackUrl: "/home" });
  // };

  // Prevent hydration mismatch by waiting for client mount
  if (!isMounted) {
    return (
      <div className={styles.container}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>
    );
  }

  // Handle loading state - show during login OR authentication
  if (status === "loading" || isLoggingIn) {
    return (
      <div className={styles.redirectContainer}>
        <div className={`${shareTechMono.className} ${styles.redirectBrand}`}>
          WORKLOG<span className="caret">_</span>
        </div>
        <div className={styles.redirectSpinner} />
        <p className={styles.redirectText}>Signing in...</p>
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (status === "authenticated") {
    return (
      <div className={styles.redirectContainer}>
        <div className={`${shareTechMono.className} ${styles.redirectBrand}`}>
          WORKLOG<span className="caret">_</span>
        </div>
        <div className={styles.redirectSpinner} />
        <p className={styles.redirectText}>Redirecting...</p>
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
            id="login-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            aria-label="Email"
            autoComplete="email"
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            aria-label="Password"
            autoComplete="current-password"
          />
          <Button
            onClick={handleLogin}
            className={styles.loginButton}
            disabled={isLoggingIn}
            isLoading={isLoggingIn}
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
              disabled={isLoggingIn}
              isLoading={isLoggingIn}
              aria-label="Sign in with Google"
            >
              <GoogleIcon size={20} />
              Google
            </Button>
          </div>
          <p className={styles.domainHint}>
            Requires @nu.edu.pk or @isb.nu.edu.pk
          </p>
          {/* GitHub OAuth removed per requirements - Using Google OAuth (@nu.edu.pk only) instead */}
          {/* <Button
              onClick={handleGithubLogin}
              className={styles.socialButton}
              aria-label="Sign in with GitHub"
            >
              <GithubIcon size={20} />
              GitHub
            </Button> */}
        </div>
      </div>
    </div>
  );
}
