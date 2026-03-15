"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { UserPlus, Send, X, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useOwnedTeams } from "@/lib/hooks";
import { useSession } from "next-auth/react";
import {
  validateTeamMemberEmail,
  getAllowedDomains,
} from "@/lib/validations/email-domain-validation";

/* ──────────────────────────────────────────────────────────────────
 * TeamLeaderInvitationsPanel
 * ──────────────────────────────────────────────────────────────────
 * A distinctive sidebar panel for team leaders to send invitations
 * to potential team members. Features bulk email input, team selection,
 * and elegant animations.
 *
 * Design Philosophy:
 * - Clean, minimal aesthetic with subtle gradients
 * - Intuitive bulk invitation interface
 * - Clear visual feedback for all actions
 * - Responsive design that works on different screen sizes
 * - Accessibility-first with proper ARIA labels
 *
 * Usage:
 *   <TeamLeaderInvitationsPanel />
 * ────────────────────────────────────────────────────────────────── */

interface TeamLeaderInvitationsPanelProps {
  className?: string;
}

export function TeamLeaderInvitationsPanel({
  className = "",
}: TeamLeaderInvitationsPanelProps) {
  const { data: session } = useSession();
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Get teams where user is a leader
  const { data: paginatedTeams, isLoading: teamsLoading } = useOwnedTeams();
  const ownedTeams = paginatedTeams?.items ?? [];

  const addEmailField = () => {
    setInviteEmails([...inviteEmails, ""]);
  };

  const removeEmailField = (index: number) => {
    if (inviteEmails.length > 1) {
      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, email: string) => {
    const updated = [...inviteEmails];
    updated[index] = email;
    setInviteEmails(updated);
  };

  const handleSendInvitations = async () => {
    if (!selectedTeamId) {
      toast.error("Missing Selection", {
        description: "Please select a team to send invitations to.",
        duration: 2500,
      });
      return;
    }

    const validEmails = inviteEmails.filter((email) => email.trim() !== "");
    if (validEmails.length === 0) {
      toast.error("No Email Provided", {
        description: "Please enter at least one email address.",
        duration: 2500,
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(
      (email) => !emailRegex.test(email),
    );
    if (invalidEmails.length > 0) {
      toast.error("Invalid Email Format", {
        description: invalidEmails.join(", "),
        duration: 2500,
      });
      return;
    }

    // Domain validation — only university emails allowed
    const invalidDomainEmails = validEmails.filter(
      (email) => !validateTeamMemberEmail(email),
    );
    if (invalidDomainEmails.length > 0) {
      const allowed = getAllowedDomains().join(" or ");
      toast.error("Invalid Email Domain", {
        description: `Only ${allowed} emails are allowed. Invalid: ${invalidDomainEmails.join(", ")}`,
        duration: 4500,
      });
      return;
    }

    // Check for self-invitation
    if (session?.user.email) {
      const selfInvites = validEmails.filter(
        (email) => email.toLowerCase() === session.user.email?.toLowerCase(),
      );
      if (selfInvites.length > 0) {
        toast.error("Cannot Invite Yourself", {
          description:
            "You are already the team owner. No need to invite yourself.",
          duration: 3000,
        });
        return;
      }
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeamId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: validEmails,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMsg =
          error.error || error.message || "Failed to send invitations";
        const details =
          error.invalidEmails?.length > 0
            ? ` (${error.invalidEmails.join(", ")})`
            : "";
        throw new Error(errorMsg + details);
      }

      const result = await response.json();

      const sentCount = result.results?.length ?? validEmails.length;
      const failedCount = result.errors?.length ?? 0;

      if (failedCount > 0 && sentCount === 0) {
        toast.error("Invitations Failed", {
          description: `Failed to send all ${failedCount} invitation(s). Check console for details.`,
          duration: 4000,
        });
      } else if (failedCount > 0) {
        toast.warning("Partial Success", {
          description: `${sentCount} invitation(s) sent, ${failedCount} failed.`,
          duration: 4000,
        });
      } else {
        toast.success("Invitations Sent", {
          description: `Successfully invited ${sentCount} member(s).`,
          duration: 3000,
        });
      }

      // Reset form
      setInviteEmails([""]);
      setSelectedTeamId("");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to send invitations. Please try again.";

      // Domain validation errors (4xx) are expected — show toast only, no console.error
      if (
        errorMsg.includes("university domain") ||
        errorMsg.includes("@nu.edu.pk") ||
        errorMsg.includes("@isb.nu.edu.pk")
      ) {
        toast.error("Invalid Email Domain", {
          description: errorMsg,
          duration: 4500,
        });
      } else {
        // Unexpected errors (5xx, network) — log for debugging
        console.error("Failed to send invitations:", error);
        toast.error("Invitation Failed", {
          description: errorMsg,
          duration: 3500,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const selectedTeam = ownedTeams?.find((team) => team.id === selectedTeamId);

  return (
    <m.aside
      className={`w-[300px] p-4 rounded-xl flex-shrink-0 bg-[var(--nav-bg)] dark:text-yellow-300 text-yellow-600 max-[960px]:w-full ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Team leader invitations panel"
    >
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="dark:text-yellow-400 text-yellow-600" />
        <h3 className="font-semibold text-sm uppercase tracking-wide dark:text-white/70 text-gray-600">
          Invite Team Members
        </h3>
      </div>

      <div className="space-y-4">
        {/* Team Selection */}
        <Card className="dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="text-blue-400" />
              Select Team
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {teamsLoading ? (
              <div className="text-xs dark:text-white/60 text-gray-500">
                Loading teams...
              </div>
            ) : ownedTeams && ownedTeams.length > 0 ? (
              <div className="space-y-2">
                {ownedTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedTeamId === team.id
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "dark:hover:bg-white/5 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-sm dark:text-white text-gray-900">
                      {team.name}
                    </div>
                    {team.description && (
                      <div className="text-xs dark:text-white/60 text-gray-500 mt-1">
                        {team.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="mr-1" />
                        {team._count?.members || 0} members
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-xs dark:text-white/60 text-gray-500">
                  No teams found
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Input */}
        {selectedTeamId && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="text-green-400" />
                  Invite Members to {selectedTeam?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="text-xs dark:text-white/60 text-gray-500">
                  Enter email addresses of potential team members:
                </div>

                <AnimatePresence>
                  {inviteEmails.map((email, index) => (
                    <m.div
                      key={index}
                      className="flex gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        type="email"
                        placeholder="member@nu.edu.pk"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        className="flex-1 dark:bg-white/10 bg-gray-100 dark:border-white/20 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400"
                        aria-label={`Team member email ${index + 1}`}
                        autoComplete="email"
                      />
                      {inviteEmails.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEmailField(index)}
                          className="dark:text-red-400 text-red-600 dark:hover:text-red-300 hover:text-red-500 hover:bg-red-500/20"
                          aria-label={`Remove email field ${index + 1}`}
                        >
                          <X aria-hidden="true" />
                        </Button>
                      )}
                    </m.div>
                  ))}
                </AnimatePresence>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addEmailField}
                    className="flex-1"
                  >
                    <UserPlus className="mr-2" />
                    Add Another
                  </Button>
                </div>

                <Separator className="dark:bg-white/10 bg-gray-100" />

                <Button
                  onClick={handleSendInvitations}
                  disabled={isSending}
                  isLoading={isSending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Send className="mr-2" />
                  Send Invitations (
                  {inviteEmails.filter((e) => e.trim()).length})
                </Button>
              </CardContent>
            </Card>
          </m.div>
        )}
      </div>
    </m.aside>
  );
}
