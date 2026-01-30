import * as React from "react";

interface TeamInvitationEmailProps {
  teamName: string;
  inviterName: string;
  acceptUrl: string;
  rejectUrl: string;
}

export function TeamInvitationEmail({
  teamName,
  inviterName,
  acceptUrl,
  rejectUrl,
}: TeamInvitationEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#333", textAlign: "center" }}>Team Invitation</h1>

      <p>Hello!</p>

      <p>
        <strong>{inviterName}</strong> has invited you to join the team{" "}
        <strong>&quot;{teamName}&quot;</strong> on Worklog App.
      </p>

      <p>
        Worklog App helps teams track and manage member contributions
        efficiently.
      </p>

      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <a
          href={acceptUrl}
          style={{
            backgroundColor: "#10B981",
            color: "white",
            padding: "12px 24px",
            textDecoration: "none",
            borderRadius: "6px",
            display: "inline-block",
            marginRight: "10px",
            fontWeight: "bold",
          }}
        >
          Accept Invitation
        </a>

        <a
          href={rejectUrl}
          style={{
            backgroundColor: "#EF4444",
            color: "white",
            padding: "12px 24px",
            textDecoration: "none",
            borderRadius: "6px",
            display: "inline-block",
            fontWeight: "bold",
          }}
        >
          Decline Invitation
        </a>
      </div>

      <p style={{ color: "#666", fontSize: "14px" }}>
        If you have any questions, please contact the team administrator.
      </p>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #eee",
          margin: "20px 0",
        }}
      />

      <p style={{ color: "#999", fontSize: "12px", textAlign: "center" }}>
        This invitation will expire in 7 days.
      </p>
    </div>
  );
}
