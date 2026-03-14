"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/states/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkEmailInput } from "@/components/forms/bulk-email-input";
import { Info, Users, Mail, CheckCircle2 } from "lucide-react";
import type { WizardStepProps } from "@/components/wizard/multi-step-wizard";
import { useOrganizations } from "@/lib/hooks/use-organizations";
import { useEmailDomainValidator } from "@/lib/hooks/use-email-validation";

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface TeamFormData {
  name?: string;
  description?: string;
  project?: string;
  organizationId?: string | null;
  inviteEmails?: string[];
}

// Step 1: Basic Team Information
export const TeamBasicInfoStep: React.FC<WizardStepProps> = ({
  data,
  updateData,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const teamData = data as TeamFormData;

  const handleChange = (field: string, value: string) => {
    updateData({ [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!teamData.name?.trim()) {
      newErrors.name = "Team name is required";
    } else if (teamData.name && teamData.name.length > 100) {
      newErrors.name = "Team name must be at most 100 characters";
    }

    if (teamData.description && teamData.description.length > 500) {
      newErrors.description = "Description must be at most 500 characters";
    }

    if (teamData.project && teamData.project.length > 100) {
      newErrors.project = "Project name must be at most 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Store validate function on component for wizard access
  useEffect(() => {
    if (typeof window !== "undefined") {
      (
        window as typeof window & { teamBasicInfoValidate?: () => boolean }
      ).teamBasicInfoValidate = validate;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamData]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <Info className="dark:text-blue-400 text-blue-600 mt-1 flex-shrink-0" />
        <div className="text-sm dark:text-blue-300 text-blue-600">
          <p className="font-medium mb-1">Let&apos;s create your team</p>
          <p className="dark:text-blue-300/80 text-blue-500">
            Start by providing basic information about your team. You can always
            update these details later.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <FormField
          label="Team Name"
          required
          htmlFor="team-name"
          error={errors.name}
        >
          <Input
            id="team-name"
            type="text"
            value={teamData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Frontend Development Team"
            className={errors.name ? "border-red-500" : ""}
            aria-invalid={!!errors.name}
            autoFocus
          />
        </FormField>

        <FormField
          label="Project Name (Optional)"
          htmlFor="team-project"
          error={errors.project}
          helpText="What project is this team working on?"
        >
          <Input
            id="team-project"
            type="text"
            value={teamData.project || ""}
            onChange={(e) => handleChange("project", e.target.value)}
            placeholder="e.g., Company Website Redesign"
            className={errors.project ? "border-red-500" : ""}
            aria-invalid={!!errors.project}
          />
        </FormField>

        <FormField
          label="Description (Optional)"
          htmlFor="team-description"
          error={errors.description}
        >
          <Textarea
            id="team-description"
            value={teamData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe the team's purpose, goals, or responsibilities..."
            rows={4}
            className={errors.description ? "border-red-500" : ""}
            aria-invalid={!!errors.description}
          />
          <div className="flex justify-between text-xs dark:text-white/50 text-gray-400 mt-1">
            <span>Provide details about your team</span>
            <span>{teamData.description?.length || 0}/500</span>
          </div>
        </FormField>
      </div>
    </div>
  );
};

// Add this line removed to avoid any type errors

// Step 2: Organization Selection
export const TeamOrganizationStep: React.FC<WizardStepProps> = ({
  data,
  updateData,
}) => {
  const teamData = data as TeamFormData;

  // Use React Query to fetch organizations — automatically refetches when cache invalidates
  const {
    data: paginatedOrgs,
    isLoading: loading,
    error: queryError,
  } = useOrganizations();
  const organizations = (paginatedOrgs?.items ?? []) as Organization[];
  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? "Failed to load organizations"
        : null;

  const handleOrganizationChange = (value: string) => {
    updateData({ organizationId: value === "none" ? null : value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <Info className="dark:text-amber-400 text-amber-600 mt-1 flex-shrink-0" />
        <div className="text-sm dark:text-amber-300 text-amber-700">
          <p className="font-medium mb-1">Organization (Optional)</p>
          <p className="dark:text-amber-300/80 text-amber-600">
            You can associate this team with an organization you own. This is
            completely optional - teams can exist independently.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <LoadingState text="Loading organizations..." />
        ) : error ? (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm dark:text-yellow-400 text-yellow-600">
            {error}
          </div>
        ) : (
          <div>
            <Label htmlFor="organization-select">Select Organization</Label>
            <Select
              value={teamData.organizationId || "none"}
              onValueChange={handleOrganizationChange}
            >
              <SelectTrigger id="organization-select" className="w-full">
                <SelectValue placeholder="No organization (standalone team)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  No organization (standalone team)
                </SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs dark:text-white/50 text-gray-400 mt-1">
              {organizations.length === 0
                ? "You don't own any organizations yet. You can create one later."
                : `Choose from ${organizations.length} organization${organizations.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}

        {teamData.organizationId && organizations.length > 0 && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm dark:text-green-400 text-green-700">
              <strong>Selected:</strong>{" "}
              {organizations.find((org) => org.id === teamData.organizationId)
                ?.name || "Unknown"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Step 3: Member Invitation
export const TeamMemberInvitationStep: React.FC<WizardStepProps> = ({
  data,
  updateData,
}) => {
  const { data: session } = useSession();
  const teamData = data as TeamFormData;
  const { validateTeamEmail, allowedDomains } = useEmailDomainValidator();

  const handleEmailsChange = (emails: string[]) => {
    updateData({ inviteEmails: emails });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <Mail className="dark:text-purple-400 text-purple-700 mt-1 flex-shrink-0" />
        <div className="text-sm dark:text-purple-300 text-purple-700">
          <p className="font-medium mb-1">Invite Team Members</p>
          <p className="dark:text-purple-300/80 text-purple-600">
            Add email addresses of people you want to invite to your team. They
            will receive an invitation email. You can also invite members later.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <BulkEmailInput
          emails={teamData.inviteEmails || []}
          onChange={handleEmailsChange}
          label="Member Email Addresses"
          placeholder="Enter email addresses to invite team members..."
          validateEmail={validateTeamEmail}
          allowedDomains={allowedDomains}
          blockedEmails={
            session?.user.email ? [session.user.email.toLowerCase()] : []
          }
          maxEmails={50}
        />

        <div className="p-4 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium dark:text-white text-gray-900 mb-2 flex items-center gap-2">
            <Users className="dark:text-white/60 text-gray-500" />
            What happens next?
          </h4>
          <ul className="text-sm dark:text-white/70 text-gray-600 space-y-1 list-disc list-inside">
            <li>
              Invited members will receive an email with an invitation link
            </li>
            <li>They can accept or decline the invitation</li>
            <li>
              Once accepted, they&apos;ll have access to the team workspace
            </li>
            <li>You can manage members and send more invitations anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Step 4: Review and Confirm
export const TeamReviewStep: React.FC<WizardStepProps> = ({ data }) => {
  const teamData = data as TeamFormData;

  // Resolve the selected organization name from the React Query cache —
  // the same data the OrganizationStep already fetched, so no extra network
  // request is ever made here.
  const { data: paginatedOrgs } = useOrganizations();
  const organizations = (paginatedOrgs?.items ?? []) as Organization[];
  const selectedOrg = teamData.organizationId
    ? organizations.find((org) => org.id === teamData.organizationId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <CheckCircle2 className="dark:text-green-400 text-green-700 mt-1 flex-shrink-0" />
        <div className="text-sm dark:text-green-300 text-green-700">
          <p className="font-medium mb-1">Review Your Team</p>
          <p className="dark:text-green-300/80 text-green-600">
            Please review the information below. You can go back to make changes
            or click &quot;Complete&quot; to create your team.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Team Information */}
        <div className="p-5 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
            Team Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium dark:text-white/60 text-gray-500">
                Team Name
              </dt>
              <dd className="text-base dark:text-white text-gray-900 mt-1">
                {teamData.name || "Not provided"}
              </dd>
            </div>
            {teamData.project && (
              <div>
                <dt className="text-sm font-medium dark:text-white/60 text-gray-500">
                  Project
                </dt>
                <dd className="text-base dark:text-white text-gray-900 mt-1">
                  {teamData.project}
                </dd>
              </div>
            )}
            {teamData.description && (
              <div>
                <dt className="text-sm font-medium dark:text-white/60 text-gray-500">
                  Description
                </dt>
                <dd className="text-base dark:text-white text-gray-900 mt-1 whitespace-pre-wrap">
                  {teamData.description}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium dark:text-white/60 text-gray-500">
                Organization
              </dt>
              <dd className="text-base dark:text-white text-gray-900 mt-1">
                {selectedOrg ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 dark:text-blue-300 text-blue-700 border border-blue-500/30">
                    <span aria-hidden="true">🏢</span>
                    {selectedOrg.name}
                  </span>
                ) : teamData.organizationId ? (
                  // organizationId set but orgs not yet loaded — show a safe fallback
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 dark:text-blue-300 text-blue-700">
                    Assigned to organization
                  </span>
                ) : (
                  <span className="dark:text-white/50 text-gray-400">
                    Standalone team
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Member Invitations */}
        {teamData.inviteEmails && teamData.inviteEmails.length > 0 && (
          <div className="p-5 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
              Member Invitations ({teamData.inviteEmails.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {teamData.inviteEmails.map((email: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-500/20 dark:text-purple-300 text-purple-700 border border-purple-500/30"
                >
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}

        {(!teamData.inviteEmails || teamData.inviteEmails.length === 0) && (
          <div className="p-4 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-lg text-sm dark:text-white/60 text-gray-500">
            No member invitations. You can invite members after creating the
            team.
          </div>
        )}
      </div>
    </div>
  );
};
