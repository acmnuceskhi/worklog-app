"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkEmailInput } from "@/components/forms/bulk-email-input";
import {
  FaInfoCircle,
  FaUsers,
  FaEnvelope,
  FaCheckCircle,
} from "react-icons/fa";
import type { WizardStepProps } from "@/components/wizard/multi-step-wizard";

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
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <FaInfoCircle className="text-blue-600 mt-1 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Let&apos;s create your team</p>
          <p className="text-blue-700">
            Start by providing basic information about your team. You can always
            update these details later.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="team-name" className="required">
            Team Name
          </Label>
          <Input
            id="team-name"
            type="text"
            value={teamData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Frontend Development Team"
            className={errors.name ? "border-red-500" : ""}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "team-name-error" : undefined}
            autoFocus
          />
          {errors.name && (
            <p
              id="team-name-error"
              className="text-sm text-red-600 mt-1"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="team-project">Project Name (Optional)</Label>
          <Input
            id="team-project"
            type="text"
            value={teamData.project || ""}
            onChange={(e) => handleChange("project", e.target.value)}
            placeholder="e.g., Company Website Redesign"
            className={errors.project ? "border-red-500" : ""}
            aria-invalid={!!errors.project}
            aria-describedby={errors.project ? "team-project-error" : undefined}
          />
          {errors.project && (
            <p
              id="team-project-error"
              className="text-sm text-red-600 mt-1"
              role="alert"
            >
              {errors.project}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            What project is this team working on?
          </p>
        </div>

        <div>
          <Label htmlFor="team-description">Description (Optional)</Label>
          <Textarea
            id="team-description"
            value={teamData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe the team's purpose, goals, or responsibilities..."
            rows={4}
            className={errors.description ? "border-red-500" : ""}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "team-description-error" : undefined
            }
          />
          {errors.description && (
            <p
              id="team-description-error"
              className="text-sm text-red-600 mt-1"
              role="alert"
            >
              {errors.description}
            </p>
          )}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Provide details about your team</span>
            <span>{teamData.description?.length || 0}/500</span>
          </div>
        </div>
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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const teamData = data as TeamFormData;

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/organizations");
        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError(
          "Failed to load organizations. You can continue without selecting one.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrganizationChange = (value: string) => {
    updateData({ organizationId: value === "none" ? null : value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <FaInfoCircle className="text-amber-600 mt-1 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Organization (Optional)</p>
          <p className="text-amber-700">
            You can associate this team with an organization you own. This is
            completely optional - teams can exist independently.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Loading organizations...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
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
            <p className="text-xs text-gray-500 mt-1">
              {organizations.length === 0
                ? "You don't own any organizations yet. You can create one later."
                : `Choose from ${organizations.length} organization${organizations.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}

        {teamData.organizationId && organizations.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
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
  const teamData = data as TeamFormData;
  const handleEmailsChange = (emails: string[]) => {
    updateData({ inviteEmails: emails });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <FaEnvelope className="text-purple-600 mt-1 flex-shrink-0" />
        <div className="text-sm text-purple-800">
          <p className="font-medium mb-1">Invite Team Members</p>
          <p className="text-purple-700">
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
          maxEmails={50}
        />

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <FaUsers className="text-gray-600" />
            What happens next?
          </h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
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
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
        <div className="text-sm text-green-800">
          <p className="font-medium mb-1">Review Your Team</p>
          <p className="text-green-700">
            Please review the information below. You can go back to make changes
            or click &quot;Complete&quot; to create your team.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Team Information */}
        <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Team Name</dt>
              <dd className="text-base text-gray-900 mt-1">
                {teamData.name || "Not provided"}
              </dd>
            </div>
            {teamData.project && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Project</dt>
                <dd className="text-base text-gray-900 mt-1">
                  {teamData.project}
                </dd>
              </div>
            )}
            {teamData.description && (
              <div>
                <dt className="text-sm font-medium text-gray-600">
                  Description
                </dt>
                <dd className="text-base text-gray-900 mt-1 whitespace-pre-wrap">
                  {teamData.description}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-600">
                Organization
              </dt>
              <dd className="text-base text-gray-900 mt-1">
                {teamData.organizationId ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Assigned to organization
                  </span>
                ) : (
                  <span className="text-gray-500">Standalone team</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Member Invitations */}
        {teamData.inviteEmails && teamData.inviteEmails.length > 0 && (
          <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Member Invitations ({teamData.inviteEmails.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {teamData.inviteEmails.map((email: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                >
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}

        {(!teamData.inviteEmails || teamData.inviteEmails.length === 0) && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            No member invitations. You can invite members after creating the
            team.
          </div>
        )}
      </div>
    </div>
  );
};
