"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { m, AnimatePresence } from "framer-motion";
import { UserPlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useInviteOrganizationOwner } from "@/lib/hooks/use-organizations";
import { toast } from "sonner";
import {
  validateOrganizationOwnerEmail,
  getAllowedDomains,
} from "@/lib/validations/email-domain-validation";

interface ManageOwnersSectionProps {
  organizationId: string;
}

export function ManageOwnersSection({
  organizationId,
}: ManageOwnersSectionProps) {
  const { data: session } = useSession();
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);

  const { mutateAsync: inviteOwner, isPending: isSending } =
    useInviteOrganizationOwner(organizationId);

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

  const handleSendInvitations = useCallback(async () => {
    const validEmails = inviteEmails.filter((email) => email.trim() !== "");
    if (validEmails.length === 0) {
      toast.error("No Email Provided", {
        description: "Please enter at least one email address.",
        duration: 2500,
      });
      return;
    }

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

    // Prevent self-invitation
    if (session?.user.email) {
      const selfInvites = validEmails.filter(
        (email) => email.toLowerCase() === session.user.email?.toLowerCase(),
      );
      if (selfInvites.length > 0) {
        toast.error("Cannot Invite Yourself", {
          description:
            "You are already the organization owner. No need to invite yourself.",
          duration: 3000,
        });
        return;
      }
    }

    toast.promise(inviteOwner(validEmails), {
      loading: `Sending ${validEmails.length} invitation${validEmails.length !== 1 ? "s" : ""}...`,
      success: (result) => {
        setInviteEmails([""]);
        const sentCount =
          result.results?.filter((r: { status: string }) => r.status === "sent")
            .length ?? validEmails.length;
        return `${sentCount} invitation${sentCount !== 1 ? "s" : ""} sent successfully`;
      },
      error: (err) =>
        err instanceof Error ? err.message : "Failed to send invitations",
    });
  }, [inviteEmails, inviteOwner, session]);

  return (
    <div className="space-y-3">
      {/* Email Inputs — matches team-leader invite pattern */}
      <div className="text-xs dark:text-white/60 text-gray-500">
        Enter email addresses to invite as co-owners:
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
              placeholder="co-owner@nu.edu.pk"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              className="flex-1 dark:bg-white/10 bg-gray-100 dark:border-white/20 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400"
              aria-label={`Co-owner email ${index + 1}`}
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

      <Separator className="dark:bg-white/10 bg-gray-100" />

      <Button
        onClick={handleSendInvitations}
        disabled={isSending}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isSending ? (
          "Sending..."
        ) : (
          <>
            <Send className="mr-2" />
            Send Invitations ({inviteEmails.filter((e) => e.trim()).length})
          </>
        )}
      </Button>
    </div>
  );
}
