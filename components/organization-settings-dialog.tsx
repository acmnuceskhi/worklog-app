// components/organization-settings-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Settings,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
  Users,
  ClipboardList,
} from "lucide-react";
import {
  useUpdateOrganization,
  useDeleteOrganization,
} from "@/lib/hooks/use-organizations";
import { cn } from "@/lib/utils";

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
  teams?: unknown[];
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
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutateAsync: updateOrganization } = useUpdateOrganization(
    organization.id,
  );
  const { mutateAsync: deleteOrganization } = useDeleteOrganization();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isValid, isSubmitting },
    setError,
    clearErrors,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationUpdateSchema),
    mode: "onChange",
    defaultValues: {
      name: organization.name,
      description: organization.description || "",
    },
  });

  const descriptionValue = useWatch({ control, name: "description" }) || "";

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

  const handleDialogClose = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        reset();
        clearErrors();
        setShowDeleteDialog(false);
      }
      onOpenChange(newOpen);
    },
    [reset, clearErrors, onOpenChange],
  );

  const onSubmit = useCallback(
    async (data: OrganizationFormData) => {
      if (isUpdating || isSubmitting) return;

      const updateProcess = async () => {
        setIsUpdating(true);
        clearErrors();

        const cleanedData = {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
        };

        const validation = organizationUpdateSchema.safeParse(cleanedData);
        if (!validation.success) {
          validation.error.issues.forEach((issue) => {
            setError(issue.path[0] as keyof OrganizationFormData, {
              message: issue.message,
            });
          });
          throw new Error("Validation failed");
        }

        return await updateOrganization(cleanedData);
      };

      toast.promise(updateProcess(), {
        loading: "Updating organization...",
        success: () => {
          onSuccess();
          onOpenChange(false);
          setIsUpdating(false);
          return "Organization updated successfully";
        },
        error: (err) => {
          setIsUpdating(false);
          return err instanceof Error
            ? err.message
            : "Failed to update organization";
        },
      });
    },
    [
      isUpdating,
      isSubmitting,
      clearErrors,
      setError,
      updateOrganization,
      onSuccess,
      onOpenChange,
    ],
  );

  // Ctrl/Cmd+Enter to submit
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape" && !isUpdating) {
        handleDialogClose(false);
      }
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
    handleSubmit,
    onSubmit,
    handleDialogClose,
  ]);

  const handleDelete = async () => {
    toast.promise(deleteOrganization(organization.id), {
      loading: "Deleting organization...",
      success: () => {
        onSuccess();
        handleDialogClose(false);
        setShowDeleteDialog(false);
        // Redirect to organizations list after successful deletion
        router.push("/teams/organisations");
        return "Organization deleted successfully";
      },
      error: (err) => {
        return err instanceof Error
          ? err.message
          : "Failed to delete organization";
      },
    });
  };

  const isBusy = isUpdating || isSubmitting;

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Settings className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="dark:text-white text-gray-900">
                  Organization Settings
                </DialogTitle>
                <DialogDescription className="dark:text-white/50 text-gray-400 text-sm">
                  Update details or manage this organization
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 mt-2"
            noValidate
          >
            {/* ── Organization Name ───────────────────────────── */}
            <div className="space-y-1.5">
              <Label
                htmlFor="org-name"
                className="dark:text-white/70 text-gray-600 text-sm"
              >
                Name <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="org-name"
                  {...register("name")}
                  placeholder="Enter organization name"
                  className={cn(
                    "dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-white/30 placeholder:text-gray-300 pr-8",
                    "focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400",
                    errors.name && "border-red-400/60 focus:border-red-400",
                    isDirty &&
                      !errors.name &&
                      "border-green-400/40 focus:border-green-400",
                  )}
                  disabled={isBusy}
                  autoFocus
                  aria-describedby={errors.name ? "org-name-error" : undefined}
                  aria-invalid={!!errors.name}
                />
                {isDirty && !errors.name && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-400" />
                )}
              </div>
              {errors.name && (
                <p
                  id="org-name-error"
                  className="text-xs text-red-400"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* ── Description ─────────────────────────────────── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="org-description"
                  className="dark:text-white/70 text-gray-600 text-sm"
                >
                  Description
                </Label>
                <span className="text-[11px] dark:text-white/30 text-gray-300 tabular-nums">
                  {descriptionValue?.length || 0}/500
                </span>
              </div>
              <Textarea
                id="org-description"
                {...register("description")}
                placeholder="What does this organization do? (optional)"
                className={cn(
                  "dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-white/30 placeholder:text-gray-300 resize-none",
                  "focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400",
                  errors.description &&
                    "border-red-400/60 focus:border-red-400",
                )}
                rows={3}
                disabled={isBusy}
                aria-describedby={
                  errors.description ? "org-desc-error" : undefined
                }
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p
                  id="org-desc-error"
                  className="text-xs text-red-400"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* ── Stats (read-only) ───────────────────────────── */}
            {organization.stats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-100 px-3 py-2.5">
                  <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold dark:text-white text-gray-900 tabular-nums leading-none">
                      {organization.stats.totalTeams}
                    </p>
                    <p className="text-[11px] dark:text-white/40 text-gray-400 mt-0.5">
                      Teams
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-100 px-3 py-2.5">
                  <Users className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold dark:text-white text-gray-900 tabular-nums leading-none">
                      {organization.stats.totalMembers}
                    </p>
                    <p className="text-[11px] dark:text-white/40 text-gray-400 mt-0.5">
                      Members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-100 px-3 py-2.5">
                  <ClipboardList className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold dark:text-white text-gray-900 tabular-nums leading-none">
                      {organization.stats.totalWorklogs}
                    </p>
                    <p className="text-[11px] dark:text-white/40 text-gray-400 mt-0.5">
                      Worklogs
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Danger Zone ─────────────────────────────────── */}
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h4 className="text-sm font-medium dark:text-red-300 text-red-600">
                  Danger Zone
                </h4>
              </div>
              <p className="text-xs dark:text-white/50 text-gray-400 leading-relaxed">
                Deleting this organization is permanent. Associated teams will
                become read-only.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 dark:hover:text-red-300 hover:text-red-500"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isBusy}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Organization
              </Button>
            </div>

            {/* ── Footer ──────────────────────────────────────── */}
            <DialogFooter className="gap-2 pt-2 border-t dark:border-white/5 border-gray-100">
              <Button
                type="button"
                variant="ghost"
                className="dark:text-white/60 text-gray-500 dark:hover:text-white hover:text-gray-900"
                onClick={() => handleDialogClose(false)}
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isDirty || !isValid || isBusy}
                aria-label="Save changes"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-red-500/30 bg-[var(--panel-strong)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white/70 text-gray-600 space-y-2">
              <span>
                Are you sure you want to delete{" "}
                <strong className="dark:text-white text-gray-900">
                  {organization.name}
                </strong>
                ? This action cannot be undone.
              </span>
              <span className="block text-amber-400/90 text-sm font-medium">
                Associated teams will become read-only but will not be deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-white/10 border-gray-200 dark:text-white/60 text-gray-500 dark:hover:bg-white/5 hover:bg-gray-100 dark:hover:text-white hover:text-gray-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
