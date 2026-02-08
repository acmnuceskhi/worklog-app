"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FaCog, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface TeamSettingsFormProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    name: string;
    description?: string;
    project?: string;
    organizationId?: string;
  };
}

export const TeamSettingsForm: React.FC<TeamSettingsFormProps> = ({
  teamId,
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    project: initialData?.project || "",
    organizationId: initialData?.organizationId || "",
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch organizations when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        project: initialData.project || "",
        organizationId: initialData.organizationId || "",
      });
    }
  }, [initialData]);

  const fetchOrganizations = async () => {
    try {
      setFetchingOrgs(true);
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setFetchingOrgs(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
    // Clear messages
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Team name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Team name must be at most 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be at most 500 characters";
    }

    if (formData.project && formData.project.length > 100) {
      newErrors.project = "Project name must be at most 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          project: formData.project || undefined,
          // Note: organizationId changes might require special handling
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team settings");
      }

      setSuccessMessage("Team settings updated successfully!");

      // Call onSuccess callback after a brief delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 1500);
    } catch (err) {
      const error = err as Error;
      console.error("Error updating team settings:", err);
      setErrorMessage(
        error.message || "Failed to update team settings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to initial data
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        project: initialData.project || "",
        organizationId: initialData.organizationId || "",
      });
    }
    setErrors({});
    setSuccessMessage(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FaCog className="text-gray-600" />
            Team Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                role="alert"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                role="alert"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Team Name */}
          <div>
            <Label htmlFor="settings-team-name" className="required">
              Team Name
            </Label>
            <Input
              id="settings-team-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Frontend Development Team"
              className={errors.name ? "border-red-500" : ""}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "settings-name-error" : undefined}
              disabled={loading}
            />
            {errors.name && (
              <p
                id="settings-name-error"
                className="text-sm text-red-600 mt-1"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Project Name */}
          <div>
            <Label htmlFor="settings-team-project">
              Project Name (Optional)
            </Label>
            <Input
              id="settings-team-project"
              type="text"
              value={formData.project}
              onChange={(e) => handleChange("project", e.target.value)}
              placeholder="e.g., Company Website Redesign"
              className={errors.project ? "border-red-500" : ""}
              aria-invalid={!!errors.project}
              aria-describedby={
                errors.project ? "settings-project-error" : undefined
              }
              disabled={loading}
            />
            {errors.project && (
              <p
                id="settings-project-error"
                className="text-sm text-red-600 mt-1"
                role="alert"
              >
                {errors.project}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="settings-team-description">
              Description (Optional)
            </Label>
            <Textarea
              id="settings-team-description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the team's purpose, goals, or responsibilities..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "settings-description-error" : undefined
              }
              disabled={loading}
            />
            {errors.description && (
              <p
                id="settings-description-error"
                className="text-sm text-red-600 mt-1"
                role="alert"
              >
                {errors.description}
              </p>
            )}
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Organization (Display Only - changing org might require backend support) */}
          <div>
            <Label htmlFor="settings-organization">Organization</Label>
            {fetchingOrgs ? (
              <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                <FaSpinner className="animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">
                  Loading organizations...
                </span>
              </div>
            ) : (
              <Select
                value={formData.organizationId || "none"}
                onValueChange={(value) => handleChange("organizationId", value)}
                disabled={loading}
              >
                <SelectTrigger id="settings-organization" className="w-full">
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
            )}
            <p className="text-xs text-gray-500 mt-1">
              Note: Changing organization may require additional permissions
            </p>
          </div>

          {/* Form Actions */}
          <DialogFooter className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
