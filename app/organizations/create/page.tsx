"use client";

import { useRouter } from "next/navigation";
import { useSafeBack } from "@/lib/hooks";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, ArrowLeft, Users, UserCog } from "lucide-react";
import { useCreateOrganization } from "@/lib/hooks";
import { PageHeader } from "@/components/ui/page-header";

type OrganizationFormData = z.infer<typeof organizationCreateSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const safeBack = useSafeBack("/teams/organisations");
  const createOrganization = useCreateOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationCreateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    toast.promise(createOrganization.mutateAsync(data), {
      loading: "Creating organization...",
      success: (result) => {
        router.push(`/organizations/${result.id}`);
        return "Organization created successfully";
      },
      error: (err: unknown) =>
        err instanceof Error ? err.message : "Failed to create organization",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      {/* Top Navigation */}
      <PageHeader
        title="Worklog"
        navItems={[
          {
            label: "My Teams",
            href: "/teams/member",
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Teams I Lead",
            href: "/teams/lead",
            icon: <UserCog className="h-4 w-4" />,
          },
          {
            label: "My Organizations",
            href: "/teams/organisations",
            isActive: true,
            icon: <Building2 className="h-4 w-4" />,
          },
        ]}
        rightAction={
          <Button variant="ghost" onClick={() => router.push("/home")}>
            Back to Dashboard
          </Button>
        }
      />

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-lg border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Create Organization
                </CardTitle>
                <CardDescription className="text-muted">
                  Set up a new organization to manage your teams
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* fieldset disabled locks all inputs inside during submission */}
            <fieldset disabled={createOrganization.isPending}>
              <CardContent className="space-y-6">
                {/* Organization Name Field */}
                <FormField
                  label="Organization Name"
                  required
                  htmlFor="name"
                  error={errors.name?.message}
                  helpText="Maximum 100 characters"
                >
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter organization name"
                    aria-invalid={!!errors.name}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-white/30 focus:ring-white/10"
                    {...register("name")}
                  />
                </FormField>

                {/* Description Field */}
                <FormField
                  label="Description"
                  htmlFor="description"
                  error={errors.description?.message}
                  helpText="Maximum 500 characters"
                >
                  <Textarea
                    id="description"
                    placeholder="Describe what this organization is about..."
                    rows={4}
                    aria-invalid={!!errors.description}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-white/30 focus:ring-white/10 resize-none"
                    {...register("description")}
                  />
                </FormField>
              </CardContent>
            </fieldset>

            <CardFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={safeBack}
                disabled={createOrganization.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
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
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
