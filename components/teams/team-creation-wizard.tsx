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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";
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
    const formValues = formData as unknown as TeamFormData;
    const toastId = toast.loading("Creating team and sending invitations...");

    try {
      // Step 1: Create the team — await keeps wizard isSubmitting=true
      const teamResult = await createTeam({
        name: formValues.name,
        description: formValues.description || undefined,
        project: formValues.project || undefined,
        organizationId: formValues.organizationId || undefined,
      });

      const teamId = teamResult.id;

      // Step 2: Send invitations concurrently
      if (formValues.inviteEmails && formValues.inviteEmails.length > 0) {
        const invitePromises = formValues.inviteEmails.map((email) =>
          inviteMember({ teamId, email }).catch((err) => {
            console.warn(`Failed to send invitation to ${email}:`, err);
            return null;
          }),
        );
        await Promise.all(invitePromises);
      }

      toast.success("Team created successfully!", { id: toastId });

      if (onSuccess) {
        onSuccess(teamId);
      } else {
        router.push(`/teams/lead/${teamId}`);
      }
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create team",
        { id: toastId },
      );
      throw err; // Re-throw so wizard keeps isSubmitting=false and shows error state
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-screen sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="text-blue-600" />
            Create Team
          </DialogTitle>
          <DialogDescription>
            Set up a new team with members and organization details.
          </DialogDescription>
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
