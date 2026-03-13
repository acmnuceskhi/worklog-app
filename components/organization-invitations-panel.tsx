"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { UserPlus, Send, X, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/lib/hooks";
import { ManageOwnersSection } from "@/components/organizations/ManageOwnersSection";
import {
  validateOrganizationOwnerEmail,
  getAllowedDomains,
} from "@/lib/validations/email-domain-validation";

/* ──────────────────────────────────────────────────────────────────
 * OrganizationInvitationsPanel
 * ──────────────────────────────────────────────────────────────────
 * A distinctive sidebar panel for organization owners to send invitations
 * to potential team leaders. Features bulk email input, organization selection,
 * and elegant animations.
 *
 * Design Philosophy:
 * - Clean, minimal aesthetic with subtle gradients
 * - Intuitive bulk invitation interface for team leaders
 * - Clear visual feedback for all actions
 * - Responsive design that works on different screen sizes
 * - Accessibility-first with proper ARIA labels
 *
 * Usage:
 *   <OrganizationInvitationsPanel />
 * ────────────────────────────────────────────────────────────────── */

interface OrganizationInvitationsPanelProps {
  className?: string;
}

export function OrganizationInvitationsPanel({
  className = "",
}: OrganizationInvitationsPanelProps) {
  const router = useRouter();
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Get organizations where user is owner
  const { data: paginatedOrgs, isLoading: orgsLoading } = useOrganizations();
  const ownedOrganizations = paginatedOrgs?.items ?? [];

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
    if (!selectedOrgId) {
      toast.error("Missing Selection", {
        description: "Please select an organization to send invitations to.",
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
      (email) => !validateOrganizationOwnerEmail(email),
    );
    if (invalidDomainEmails.length > 0) {
      const allowed = getAllowedDomains().join(" or ");
      toast.error("Invalid Email Domain", {
        description: `Only ${allowed} emails are allowed. Invalid: ${invalidDomainEmails.join(", ")}`,
        duration: 4500,
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/organizations/${selectedOrgId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emails: validEmails,
          }),
        },
      );

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

      const sentCount =
        result.results?.filter((r: { status: string }) => r.status === "sent")
          .length ?? 0;
      const skippedCount =
        result.results?.filter(
          (r: { status: string }) => r.status === "skipped",
        ).length ?? 0;
      const failedCount =
        result.results?.filter((r: { status: string }) => r.status === "failed")
          .length ?? 0;

      if (sentCount > 0 && failedCount === 0) {
        toast.success("Invitations Sent", {
          description:
            skippedCount > 0
              ? `${sentCount} invitation(s) sent. ${skippedCount} already accepted (skipped).`
              : `Successfully invited ${sentCount} team leader(s).`,
          duration: 3000,
        });
        // Reset form
        setInviteEmails([""]);
        setSelectedOrgId("");
      } else if (sentCount > 0 && failedCount > 0) {
        toast.warning("Partial Success", {
          description: `${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped.`,
          duration: 4000,
        });
        setInviteEmails([""]);
        setSelectedOrgId("");
      } else if (skippedCount > 0 && sentCount === 0) {
        toast.info("Already Invited", {
          description: `All ${skippedCount} email(s) are already co-owners or have accepted invitations.`,
          duration: 3500,
        });
      } else {
        toast.error("Invitations Failed", {
          description: result.message || "Failed to send invitations.",
          duration: 4000,
        });
      }
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

  const selectedOrg = ownedOrganizations?.find(
    (org) => org.id === selectedOrgId,
  );

  return (
    <m.aside
      className={`w-[300px] p-4 rounded-xl flex-shrink-0 bg-[var(--nav-bg)] text-yellow-300 max-[960px]:w-full ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Organization invitations panel"
    >
      <div className="flex items-center gap-2 mb-4">
        <Crown className="text-purple-400" />
        <h3 className="font-semibold text-sm uppercase tracking-wide text-white/70">
          Invite Org Members
        </h3>
      </div>

      <div className="space-y-4">
        {/* Organization Selection */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="text-purple-400" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {orgsLoading ? (
              <div className="text-xs text-white/60">
                Loading organizations...
              </div>
            ) : ownedOrganizations && ownedOrganizations.length > 0 ? (
              <div className="space-y-2">
                {ownedOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedOrgId === org.id
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="font-medium text-sm text-white">
                      {org.name}
                    </div>
                    {org.description && (
                      <div className="text-xs text-white/60 mt-1">
                        {org.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Building2 className="mr-1" />
                        {org._count?.teams || 0} teams
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-xs text-white/60 mb-2">
                  No organizations found
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/teams/organisations")}
                  className="text-xs"
                >
                  Create Organization
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Input */}
        {selectedOrgId && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="text-green-400" />
                  Invite Leaders to {selectedOrg?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="text-xs text-white/60">
                  Enter email addresses of potential team leaders:
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
                        placeholder="leader@nu.edu.pk"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        aria-label={`Team leader email ${index + 1}`}
                        autoComplete="email"
                      />
                      {inviteEmails.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEmailField(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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

                <Separator className="bg-white/10" />

                <div className="space-y-2">
                  <Button
                    onClick={handleSendInvitations}
                    disabled={isSending}
                    isLoading={isSending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Send className="mr-2" />
                    Send Invitations (
                    {inviteEmails.filter((e) => e.trim()).length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </m.div>
        )}

        {/* Invite Co-Owners */}
        {selectedOrgId && selectedOrg && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="text-amber-400" />
                  Invite Co-Owners to {selectedOrg.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ManageOwnersSection organizationId={selectedOrgId} />
              </CardContent>
            </Card>
          </m.div>
        )}
      </div>
    </m.aside>
  );
}
