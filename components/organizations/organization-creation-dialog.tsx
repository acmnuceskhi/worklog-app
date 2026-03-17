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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Info } from "lucide-react";
import { useCreateOrganization } from "@/lib/hooks";
import { m } from "framer-motion";

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
      <DialogContent className="sm:max-w-lg dark:border-white/10 border-gray-200 dark:bg-[var(--card-dark)] bg-white max-h-screen overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl dark:text-white text-gray-900">
            <Building2 className="h-6 w-6 text-blue-600" />
            Create Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization to manage teams and members.
          </DialogDescription>
        </DialogHeader>

        {/* Guidance Section */}
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/20 border-blue-200 border p-3 flex gap-3"
        >
          <Info className="h-5 w-5 dark:text-blue-400 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm dark:text-blue-300 text-blue-700 font-medium">
              Set up your organization
            </p>
            <p className="text-xs dark:text-blue-300/70 text-blue-700/70 mt-1">
              Create an organization to manage teams and invite team leaders
            </p>
          </div>
        </m.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <fieldset
            disabled={createOrganization.isPending}
            className="space-y-5"
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
                placeholder="e.g., Tech Innovation Labs"
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
                placeholder="Describe your organization's mission and purpose..."
                rows={4}
                aria-invalid={!!errors.description}
                className="dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400 dark:focus:border-white/30 focus:border-gray-400 dark:focus:ring-white/10 focus:ring-gray-200 resize-none"
                {...register("description")}
              />
            </FormField>
          </fieldset>

          <div className="flex gap-3 pt-4 border-t dark:border-white/10 border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createOrganization.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createOrganization.isPending}
              isLoading={createOrganization.isPending}
              className="flex-1"
            >
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
