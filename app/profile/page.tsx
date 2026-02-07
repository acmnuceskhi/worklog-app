"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import {
  FaArrowLeft,
  FaSignOutAlt,
  FaEnvelope,
  FaCalendar,
  FaShieldAlt,
} from "react-icons/fa";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mounted = typeof window !== "undefined";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (!mounted || status === "loading") {
    return (
      <div style={styles.loadingContainer}>
        <p style={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div style={styles.container}>
      {/* Header */}
      <nav style={styles.navbar}>
        <button style={styles.backButton} onClick={() => router.push("/home")}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 style={styles.navTitle}>Profile</h1>
        <button
          style={styles.signOutButton}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <FaSignOutAlt /> Sign Out
        </button>
      </nav>

      {/* Profile Card */}
      <div style={styles.profileCard}>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.avatarContainer}>
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={120}
                height={120}
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
            )}
          </div>
          <h2 style={styles.userName}>{user?.name || "Anonymous User"}</h2>
          <p style={styles.userEmail}>{user?.email || "No email provided"}</p>
        </div>

        {/* Profile Details */}
        <div style={styles.detailsSection}>
          <h3 style={styles.sectionTitle}>Account Information</h3>

          <div style={styles.detailItem}>
            <div style={styles.detailIcon}>
              <FaEnvelope />
            </div>
            <div>
              <p style={styles.detailLabel}>Email</p>
              <p style={styles.detailValue}>{user?.email || "Not provided"}</p>
            </div>
          </div>

          <div style={styles.detailItem}>
            <div style={styles.detailIcon}>
              <FaShieldAlt />
            </div>
            <div>
              <p style={styles.detailLabel}>Name</p>
              <p style={styles.detailValue}>{user?.name || "Not set"}</p>
            </div>
          </div>

          <div style={styles.detailItem}>
            <div style={styles.detailIcon}>
              <FaCalendar />
            </div>
            <div>
              <p style={styles.detailLabel}>Account Status</p>
              <p style={styles.detailValue}>
                <span style={styles.statusBadge}>Active</span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actionsSection}>
          <button
            style={styles.actionButton}
            onClick={() => router.push("/home")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0A173B",
    padding: "20px",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A173B",
  },
  loadingText: {
    color: "white",
    fontSize: "1.2rem",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 0",
    marginBottom: "30px",
  },
  navTitle: {
    color: "white",
    fontSize: "1.5rem",
    margin: 0,
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background 0.3s",
  },
  signOutButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background 0.3s",
  },
  profileCard: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "40px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  profileHeader: {
    textAlign: "center",
    marginBottom: "40px",
    paddingBottom: "30px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  avatarContainer: {
    marginBottom: "20px",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "4px solid rgba(96, 165, 250, 0.5)",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor: "rgba(96, 165, 250, 0.3)",
    border: "4px solid rgba(96, 165, 250, 0.5)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    fontWeight: "700",
    color: "white",
  },
  userName: {
    color: "white",
    fontSize: "2rem",
    margin: "10px 0 5px",
    fontWeight: "700",
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "1rem",
    margin: 0,
  },
  detailsSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    color: "white",
    fontSize: "1.2rem",
    marginBottom: "20px",
    fontWeight: "600",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    marginBottom: "10px",
  },
  detailIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#60a5fa",
    fontSize: "1.2rem",
  },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "0.9rem",
    margin: "0 0 5px 0",
  },
  detailValue: {
    color: "white",
    fontSize: "1rem",
    margin: 0,
    fontWeight: "500",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  actionsSection: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  actionButton: {
    padding: "12px 30px",
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    color: "#60a5fa",
    border: "1px solid rgba(96, 165, 250, 0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s",
  },
};
