"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { organizationCreateSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Building2 } from "lucide-react";
import { useCreateOrganization } from "@/lib/hooks";

type OrganizationFormData = z.infer<typeof organizationCreateSchema>;

interface OrganizationCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrganizationCreationDialog: React.FC<
  OrganizationCreationDialogProps
> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const createOrganization = useCreateOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationCreateSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    toast.promise(createOrganization.mutateAsync(data), {
      loading: "Creating organization...",
      success: (result) => {
        reset();
        onClose();
        router.push(`/organizations/${result.id}`);
        return "Organization created successfully";
      },
      error: (err: unknown) =>
        err instanceof Error ? err.message : "Failed to create organization",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg dark:border-white/10 border-gray-200 dark:bg-[var(--card-dark)] bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="dark:text-white text-gray-900">
                Create Organization
              </DialogTitle>
              <DialogDescription className="dark:text-white/60 text-gray-500">
                Set up a new organization to manage your teams
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset
            disabled={createOrganization.isPending}
            className="space-y-6 py-4"
          >
            <FormField
              label="Organization Name"
              required
              htmlFor="org-name"
              error={errors.name?.message}
              helpText="Maximum 100 characters"
            >
              <Input
                id="org-name"
                type="text"
                placeholder="Enter organization name"
                aria-invalid={!!errors.name}
                className="dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400 dark:focus:border-white/30 focus:border-gray-400 dark:focus:ring-white/10 focus:ring-gray-200"
                {...register("name")}
              />
            </FormField>

            <FormField
              label="Description"
              htmlFor="org-description"
              error={errors.description?.message}
              helpText="Maximum 500 characters"
            >
              <Textarea
                id="org-description"
                placeholder="Describe what this organization is about..."
                rows={4}
                aria-invalid={!!errors.description}
                className="dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400 dark:focus:border-white/30 focus:border-gray-400 dark:focus:ring-white/10 focus:ring-gray-200 resize-none"
                {...register("description")}
              />
            </FormField>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 dark:border-white/20 border-gray-300 dark:text-white/70 text-gray-600 dark:hover:bg-white/10 hover:bg-gray-200"
              onClick={() => handleOpenChange(false)}
              disabled={createOrganization.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createOrganization.isPending}
              isLoading={createOrganization.isPending}
            >
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
