"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaPaperPlane, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useInviteOrganizationOwner } from "@/lib/hooks/use-organizations";
import { toast } from "sonner";

interface ManageOwnersSectionProps {
  organizationId: string;
}

export function ManageOwnersSection({
  organizationId,
}: ManageOwnersSectionProps) {
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
  }, [inviteEmails, inviteOwner]);

  return (
    <div className="space-y-3">
      {/* Email Inputs — matches team-leader invite pattern */}
      <div className="text-xs text-white/60">
        Enter email addresses to invite as co-owners:
      </div>

      <AnimatePresence>
        {inviteEmails.map((email, index) => (
          <motion.div
            key={index}
            className="flex gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              type="email"
              placeholder="co-owner@email.com"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            {inviteEmails.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeEmailField(index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <FaTimes />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={addEmailField}
          className="flex-1"
        >
          <FaUserPlus className="mr-2" />
          Add Another
        </Button>
      </div>

      <Separator className="bg-white/10" />

      <Button
        onClick={handleSendInvitations}
        disabled={isSending}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isSending ? (
          "Sending..."
        ) : (
          <>
            <FaPaperPlane className="mr-2" />
            Send Invitations ({inviteEmails.filter((e) => e.trim()).length})
          </>
        )}
      </Button>
    </div>
  );
}
