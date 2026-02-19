"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { organizationCreateSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";
import { ErrorState } from "@/components/states/error-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaBuilding, FaArrowLeft, FaUsers, FaUserTie } from "react-icons/fa";
import { useCreateOrganization } from "@/lib/hooks";

type OrganizationFormData = z.infer<typeof organizationCreateSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
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
    createOrganization.mutate(data, {
      onSuccess: () => {
        // Navigate to organizations list on success
        router.push("/teams/organisations");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Worklog</h1>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Button
              variant="ghost"
              onClick={() => router.push("/teams/member")}
              className="flex items-center gap-1 px-3 py-1 text-sm text-white/70"
            >
              <FaUsers className="h-4 w-4" />
              My Teams
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/teams/lead")}
              className="flex items-center gap-1 px-3 py-1 text-sm text-white/70"
            >
              <FaUserTie className="h-4 w-4" />
              Teams I Lead
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/teams/organisations")}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-white/10 text-white"
            >
              <FaBuilding className="h-4 w-4" />
              My Organizations
            </Button>
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/home")}>
          Back to Dashboard
        </Button>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-lg border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <FaBuilding className="h-6 w-6 text-white" />
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
            <CardContent className="space-y-6">
              {/* Server Error Display */}
              {createOrganization.error && (
                <ErrorState
                  title="Failed to create organization"
                  message={
                    createOrganization.error instanceof Error
                      ? createOrganization.error.message
                      : "Failed to create organization"
                  }
                  className="py-2"
                />
              )}

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

            <CardFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => router.back()}
                disabled={createOrganization.isPending}
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrganization.isPending}
                variant="primary"
                className="flex-1"
              >
                {createOrganization.isPending ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
