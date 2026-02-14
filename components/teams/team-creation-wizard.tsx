"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MultiStepWizard } from "@/components/wizard/multi-step-wizard";
import type { WizardStep } from "@/components/wizard/multi-step-wizard";
import {
  TeamBasicInfoStep,
  TeamOrganizationStep,
  TeamMemberInvitationStep,
  TeamReviewStep,
} from "@/components/teams/team-creation-steps";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaUsers } from "react-icons/fa";
import { ErrorState } from "@/components/states/error-state";

interface TeamFormData {
  name: string;
  description?: string;
  project?: string;
  organizationId?: string;
  inviteEmails?: string[];
}

interface TeamCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (teamId: string) => void;
}

export const TeamCreationWizard: React.FC<TeamCreationWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const wizardSteps: WizardStep[] = [
    {
      id: "basic-info",
      title: "Basic Info",
      description: "Team details",
      component: TeamBasicInfoStep,
      validate: async () => {
        // Access the validate function from window object
        if (typeof window !== "undefined") {
          const validateFn = (
            window as typeof window & { teamBasicInfoValidate?: () => boolean }
          ).teamBasicInfoValidate;
          if (validateFn) {
            return validateFn();
          }
        }
        return true;
      },
    },
    {
      id: "organization",
      title: "Organization",
      description: "Optional linking",
      component: TeamOrganizationStep,
    },
    {
      id: "invite-members",
      title: "Invite Members",
      description: "Add team members",
      component: TeamMemberInvitationStep,
    },
    {
      id: "review",
      title: "Review",
      description: "Confirm details",
      component: TeamReviewStep,
    },
  ];

  const handleComplete = async (formData: Record<string, unknown>) => {
    setError(null);

    try {
      const formValues = formData as unknown as TeamFormData;
      // Step 1: Create the team
      const teamResponse = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formValues.name,
          description: formValues.description || undefined,
          project: formValues.project || undefined,
          organizationId: formValues.organizationId || undefined,
        }),
      });

      if (!teamResponse.ok) {
        const errorData = await teamResponse.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const teamResult = await teamResponse.json();
      const teamId = teamResult.data.id;

      // Step 2: Send invitations if there are emails
      if (formValues.inviteEmails && formValues.inviteEmails.length > 0) {
        const inviteResponse = await fetch(`/api/teams/${teamId}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emails: formValues.inviteEmails,
          }),
        });

        if (!inviteResponse.ok) {
          // Don't fail the whole process if invitations fail
          console.warn("Failed to send some invitations");
        }
      }

      // Success! Redirect to the team page
      if (onSuccess) {
        onSuccess(teamId);
      } else {
        router.push(`/teams/lead/${teamId}`);
      }

      onClose();
    } catch (err) {
      const error = err as Error;
      console.error("Team creation error:", err);
      setError(error.message || "Failed to create team. Please try again.");
      throw err; // Re-throw to keep the wizard open
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FaUsers className="text-blue-600" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        {error && <ErrorState message={error} className="py-4 mb-4" />}

        <MultiStepWizard
          steps={wizardSteps}
          onComplete={handleComplete}
          onCancel={handleCancel}
          persistKey="team-creation-wizard"
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};
