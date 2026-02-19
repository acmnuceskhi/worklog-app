"use client";

import React from "react";
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
import { toast } from "sonner";
import { useCreateTeam, useInviteTeamMember } from "@/lib/hooks/use-teams";

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
  initialData?: Partial<TeamFormData>;
}

export const TeamCreationWizard: React.FC<TeamCreationWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = {},
}) => {
  const router = useRouter();

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

  const { mutateAsync: createTeam } = useCreateTeam();
  const { mutateAsync: inviteMember } = useInviteTeamMember();

  const handleComplete = async (formData: Record<string, unknown>) => {
    const createTeamProcess = async () => {
      const formValues = formData as unknown as TeamFormData;

      // Step 1: Create the team using the hook
      const teamResult = await createTeam({
        name: formValues.name,
        description: formValues.description || undefined,
        project: formValues.project || undefined,
        organizationId: formValues.organizationId || undefined,
      });

      const teamId = teamResult.id;

      // Step 2: Send invitations if there are emails
      if (formValues.inviteEmails && formValues.inviteEmails.length > 0) {
        // Invite members concurrently
        const invitePromises = formValues.inviteEmails.map((email) =>
          inviteMember({ teamId, email }).catch((err) => {
            console.warn(`Failed to send invitation to ${email}:`, err);
            return null;
          }),
        );
        await Promise.all(invitePromises);
      }

      return { teamId };
    };

    toast.promise(createTeamProcess(), {
      loading: "Creating team and sending invitations...",
      success: (data) => {
        if (onSuccess) {
          onSuccess(data.teamId);
        } else {
          router.push(`/teams/lead/${data.teamId}`);
        }
        onClose();
        return "Team created successfully!";
      },
      error: (err) =>
        err instanceof Error ? err.message : "Failed to create team",
    });
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
            Create Team
          </DialogTitle>
        </DialogHeader>

        <MultiStepWizard
          steps={wizardSteps}
          onComplete={handleComplete}
          onCancel={handleCancel}
          initialData={initialData}
          persistKey="team-creation-wizard"
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};
