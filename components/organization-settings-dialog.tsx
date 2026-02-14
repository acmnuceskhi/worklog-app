// components/organization-settings-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { organizationUpdateSchema } from "@/lib/validations";
import { toast } from "sonner";
import { FaEdit, FaTrash, FaExclamationTriangle } from "react-icons/fa";

type OrganizationFormData = z.infer<typeof organizationUpdateSchema>;

interface Organization {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  teams?: unknown[]; // For future use
  stats?: {
    totalTeams: number;
    totalMembers: number;
    totalWorklogs: number;
  };
}

interface OrganizationSettingsDialogProps {
  organization: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OrganizationSettingsDialog({
  organization,
  open,
  onOpenChange,
  onSuccess,
}: OrganizationSettingsDialogProps) {
  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid, isSubmitting },
    setError,
    clearErrors,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationUpdateSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: organization.name,
      description: organization.description || "",
    },
  });

  // Watch description field for character count
  const descriptionValue = watch("description", "");

  // Reset form when dialog opens or organization changes
  useEffect(() => {
    if (open) {
      reset({
        name: organization.name,
        description: organization.description || "",
      });
      clearErrors();
    }
  }, [open, organization.name, organization.description, reset, clearErrors]);

  // Handle dialog close with form reset
  const handleDialogClose = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset form state when closing
        reset();
        clearErrors();
        setShowDeleteDialog(false);
      }
      onOpenChange(newOpen);
    },
    [reset, clearErrors, onOpenChange],
  );

  // Handle form submission
  const onSubmit = useCallback(
    async (data: OrganizationFormData) => {
      // Prevent double submission
      if (isUpdating || isSubmitting) return;

      try {
        setIsUpdating(true);
        clearErrors();

        // Trim whitespace from inputs
        const cleanedData = {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
        };

        // Validate cleaned data again
        const validation = organizationUpdateSchema.safeParse(cleanedData);
        if (!validation.success) {
          validation.error.issues.forEach((issue) => {
            setError(issue.path[0] as keyof OrganizationFormData, {
              message: issue.message,
            });
          });
          return;
        }

        const response = await fetch(`/api/organizations/${organization.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.error && typeof result.error === "string") {
            // Handle server validation errors by setting field errors
            const errorMessage = result.error.toLowerCase();
            if (errorMessage.includes("name")) {
              setError("name", { message: result.error });
              return;
            } else if (errorMessage.includes("description")) {
              setError("description", { message: result.error });
              return;
            }
          }
          // For other server errors, throw to be handled by catch block
          throw new Error(result.error || `Server error: ${response.status}`);
        }

        toast.success("Organization updated successfully");
        onSuccess();
        onOpenChange(false);
      } catch (error) {
        console.error("Error updating organization:", error);

        // Handle network errors specifically
        if (error instanceof TypeError && error.message.includes("fetch")) {
          toast.error(
            "Network error. Please check your connection and try again.",
          );
        } else {
          toast.error(
            error instanceof Error
              ? error.message
              : "An error occurred while updating the organization",
          );
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [
      organization.id,
      isUpdating,
      isSubmitting,
      clearErrors,
      setError,
      onSuccess,
      onOpenChange,
    ],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      // Close dialog on Escape key
      if (event.key === "Escape" && !isUpdating && !isDeleting) {
        handleDialogClose(false);
      }

      // Submit form on Ctrl/Cmd + Enter
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter" &&
        isDirty &&
        isValid &&
        !isUpdating
      ) {
        event.preventDefault();
        handleSubmit(onSubmit)();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    isDirty,
    isValid,
    isUpdating,
    isDeleting,
    handleSubmit,
    onSubmit,
    handleDialogClose,
  ]);

  // Handle organization deletion
  const handleDelete = async () => {
    // Prevent double deletion
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete organization");
      }

      toast.success(result.message || "Organization deleted successfully");
      onSuccess();
      handleDialogClose(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting organization:", error);

      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(
          "Network error. Please check your connection and try again.",
        );
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the organization",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaEdit className="text-blue-400" />
              Organization Settings
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Form Status Indicator */}
            {isDirty && (
              <div className="flex items-center gap-2 text-sm">
                {isValid ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <span className="text-xs">✓</span>
                    <span>Form is valid and ready to submit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="text-xs">⚠</span>
                    <span>Please fix the errors below</span>
                  </div>
                )}
              </div>
            )}

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-white/80">
                Organization Name *
              </Label>
              <div className="relative">
                <Input
                  id="org-name"
                  {...register("name")}
                  placeholder="Enter organization name"
                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/50 pr-8 ${
                    errors.name
                      ? "border-red-400 focus:border-red-400"
                      : isDirty && !errors.name
                        ? "border-green-400 focus:border-green-400"
                        : ""
                  }`}
                  disabled={isUpdating}
                  autoFocus
                  aria-describedby={errors.name ? "org-name-error" : undefined}
                  aria-invalid={!!errors.name}
                />
                {isDirty && !errors.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                    ✓
                  </div>
                )}
              </div>
              {errors.name && (
                <p
                  id="org-name-error"
                  className="text-sm text-red-400"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Organization Description */}
            <div className="space-y-2">
              <Label htmlFor="org-description" className="text-white/80">
                Description
              </Label>
              <div className="relative">
                <Textarea
                  id="org-description"
                  {...register("description")}
                  placeholder="Enter organization description (optional)"
                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/50 resize-none ${
                    errors.description
                      ? "border-red-400 focus:border-red-400"
                      : isDirty && !errors.description
                        ? "border-green-400 focus:border-green-400"
                        : ""
                  }`}
                  rows={3}
                  disabled={isUpdating}
                  aria-describedby={
                    errors.description
                      ? "org-description-error"
                      : "org-description-help"
                  }
                  aria-invalid={!!errors.description}
                />
                <div className="absolute bottom-2 right-2 text-xs text-white/50">
                  {descriptionValue?.length || 0}/500
                </div>
              </div>
              <p id="org-description-help" className="text-xs text-white/50">
                Optional description to help identify your organization
              </p>
              {errors.description && (
                <p
                  id="org-description-error"
                  className="text-sm text-red-400"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Organization Stats (Read-only) */}
            {organization.stats && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  Current Statistics
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-white/60">
                  <div>
                    <span className="block font-medium">
                      {organization.stats.totalTeams}
                    </span>
                    <span>Teams</span>
                  </div>
                  <div>
                    <span className="block font-medium">
                      {organization.stats.totalMembers}
                    </span>
                    <span>Members</span>
                  </div>
                  <div>
                    <span className="block font-medium">
                      {organization.stats.totalWorklogs}
                    </span>
                    <span>Worklogs</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {/* Keyboard Shortcuts Hint */}
              <div className="w-full text-xs text-white/50 text-center sm:text-left">
                <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">
                  Enter
                </kbd>{" "}
                to submit •{" "}
                <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">
                  Esc
                </kbd>{" "}
                to close
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="outline"
                className="border-red-400/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isUpdating || isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300 mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete Organization
                  </>
                )}
              </Button>

              {/* Cancel and Update Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => handleDialogClose(false)}
                  disabled={isUpdating || isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isDirty || !isValid || isUpdating || isSubmitting}
                  aria-describedby={!isDirty ? "no-changes-hint" : undefined}
                >
                  {isUpdating || isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit className="mr-2" />
                      Update
                    </>
                  )}
                </Button>
                {!isDirty && (
                  <span id="no-changes-hint" className="sr-only">
                    Make changes to enable the update button
                  </span>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-red-500/40 bg-slate-900/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <FaExclamationTriangle />
              Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {organization.name}
              </span>
              ? This action cannot be undone.
              <br />
              <br />
              <strong className="text-yellow-400">
                Associated teams will become read-only but will not be deleted.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <FaTrash className="mr-2" />
                  Delete Organization
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
