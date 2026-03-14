// components/team-settings-dialog.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Settings, Trash2, AlertTriangle, Loader2, Check } from "lucide-react";
import { useUpdateTeam, useDeleteTeam, type Team } from "@/lib/hooks/use-teams";
import { useOrganizations } from "@/lib/hooks/use-organizations";
import { cn } from "@/lib/utils";

// Zod schema for team settings
const teamSettingsSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  description: z.string().max(500).optional(),
  project: z.string().max(100).optional(),
  organizationId: z.string().optional().nullable(),
});

type TeamSettingsFormData = z.infer<typeof teamSettingsSchema>;

interface TeamSettingsDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TeamSettingsDialog({
  team,
  open,
  onOpenChange,
  onSuccess,
}: TeamSettingsDialogProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutateAsync: updateTeam } = useUpdateTeam(team.id);
  const { mutateAsync: deleteTeam } = useDeleteTeam();
  const { data: paginatedOrgs } = useOrganizations();
  const organizations = paginatedOrgs?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isValid, isSubmitting },
    setError,
    clearErrors,
    setValue,
  } = useForm<TeamSettingsFormData>({
    resolver: zodResolver(teamSettingsSchema),
    mode: "onChange",
    defaultValues: {
      name: team.name,
      description: team.description || "",
      project: team.project || "",
      // Prefer the scalar organizationId; fall back to the nested relation id
      // for list endpoints that return organization.id but not organizationId.
      organizationId: team.organizationId ?? team.organization?.id ?? null,
    },
  });

  const descriptionValue = useWatch({ control, name: "description" }) || "";
  // useWatch is reactive; control._formValues is NOT — always watch org separately
  const organizationIdValue = useWatch({ control, name: "organizationId" });

  useEffect(() => {
    if (open) {
      reset({
        name: team.name,
        description: team.description || "",
        project: team.project || "",
        organizationId: team.organizationId ?? team.organization?.id ?? null,
      });
      clearErrors();
    }
  }, [
    open,
    team.name,
    team.description,
    team.project,
    team.organizationId,
    team.organization?.id,
    reset,
    clearErrors,
  ]);

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
    async (data: TeamSettingsFormData) => {
      if (isUpdating || isSubmitting) return;

      const updateProcess = async () => {
        setIsUpdating(true);
        clearErrors();

        const cleanedData = {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          project: data.project?.trim() || undefined,
          // null = remove org link; string = set org; undefined should not occur here
          organizationId: data.organizationId ?? null,
        };

        const validation = teamSettingsSchema.safeParse(cleanedData);
        if (!validation.success) {
          validation.error.issues.forEach((issue) => {
            setError(issue.path[0] as keyof TeamSettingsFormData, {
              message: issue.message,
            });
          });
          throw new Error("Validation failed");
        }

        return await updateTeam(cleanedData);
      };

      toast.promise(updateProcess(), {
        loading: "Updating team...",
        success: () => {
          onSuccess();
          onOpenChange(false);
          setIsUpdating(false);
          return "Team updated successfully";
        },
        error: (err) => {
          setIsUpdating(false);
          return err instanceof Error ? err.message : "Failed to update team";
        },
      });
    },
    [
      isUpdating,
      isSubmitting,
      clearErrors,
      setError,
      updateTeam,
      onSuccess,
      onOpenChange,
    ],
  );

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
    toast.promise(deleteTeam(team.id), {
      loading: "Deleting team...",
      success: () => {
        onSuccess();
        handleDialogClose(false);
        setShowDeleteDialog(false);
        router.push("/teams/lead");
        return "Team deleted successfully";
      },
      error: (err) => {
        return err instanceof Error ? err.message : "Failed to delete team";
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
                  Team Settings
                </DialogTitle>
                <DialogDescription className="dark:text-white/50 text-gray-500 text-sm">
                  Update team details or manage configuration
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Team Name */}
            <div className="space-y-2">
              <Label
                htmlFor="team-name"
                className="dark:text-white text-gray-900"
              >
                Team Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="team-name"
                placeholder="e.g., Frontend Development Team"
                className={cn(
                  "dark:bg-white/5 bg-white dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/40 placeholder:text-gray-400 dark:focus:border-white/30 focus:border-blue-400",
                  errors.name && "border-red-500",
                )}
                disabled={isBusy}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label
                htmlFor="team-project"
                className="dark:text-white text-gray-900"
              >
                Project Name{" "}
                <span className="dark:text-white/40 text-gray-400 text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                id="team-project"
                placeholder="e.g., Company Website Redesign"
                className={cn(
                  "dark:bg-white/5 bg-white dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/40 placeholder:text-gray-400 dark:focus:border-white/30 focus:border-blue-400",
                  errors.project && "border-red-500",
                )}
                disabled={isBusy}
                {...register("project")}
              />
              {errors.project && (
                <p className="text-sm text-red-400">{errors.project.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="team-description"
                className="dark:text-white text-gray-900"
              >
                Description{" "}
                <span className="dark:text-white/40 text-gray-400 text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="team-description"
                placeholder="Describe the team's purpose, goals, or responsibilities..."
                rows={4}
                className={cn(
                  "dark:bg-white/5 bg-white dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/40 placeholder:text-gray-400 dark:focus:border-white/30 focus:border-blue-400 resize-none",
                  errors.description && "border-red-500",
                )}
                disabled={isBusy}
                {...register("description")}
              />
              <div className="flex justify-between text-xs dark:text-white/50 text-gray-400">
                <span>Provide details about your team</span>
                <span>{descriptionValue.length}/500</span>
              </div>
              {errors.description && (
                <p className="text-sm text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label
                htmlFor="team-organization"
                className="dark:text-white text-gray-900"
              >
                Organization{" "}
                <span className="dark:text-white/40 text-gray-400 text-xs">
                  (Optional)
                </span>
              </Label>
              <Select
                value={organizationIdValue ?? "none"}
                onValueChange={(value) =>
                  setValue(
                    "organizationId",
                    // null signals the backend to remove the org link
                    value === "none" ? null : value,
                    { shouldDirty: true },
                  )
                }
                disabled={isBusy}
              >
                <SelectTrigger
                  id="team-organization"
                  className="dark:bg-white/5 bg-white dark:border-white/10 border-gray-300 dark:text-white text-gray-900"
                >
                  <SelectValue placeholder="Select an organization..." />
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
              <p className="text-xs dark:text-white/50 text-gray-400">
                Associate this team with an organization you own
              </p>
            </div>

            {/* Save Section */}
            <DialogFooter className="gap-2 flex-row justify-between pt-4 border-t dark:border-white/10 border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isBusy}
                className="dark:border-white/20 border-gray-300"
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isBusy}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || !isValid || isBusy}
                  className="gap-2"
                >
                  {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isDirty && isValid && !isBusy && (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Team
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white/70 text-gray-600">
              Are you sure you want to delete <strong>{team.name}</strong>? This
              action cannot be undone. All associated worklogs will remain but
              will be unlinked from this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-white/20 border-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
