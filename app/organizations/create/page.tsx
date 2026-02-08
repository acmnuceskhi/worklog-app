"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { organizationCreateSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FaBuilding,
  FaSpinner,
  FaArrowLeft,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";

type OrganizationFormData = z.infer<typeof organizationCreateSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    try {
      setIsSubmitting(true);
      setServerError(null);

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create organization");
      }

      // Success - redirect to organizations list
      router.push("/teams/organisations");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Worklog</h1>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              onClick={() => router.push("/teams/member")}
              className="flex items-center gap-1 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              <FaUsers className="h-4 w-4" />
              Member Teams
            </button>
            <button
              onClick={() => router.push("/teams/lead")}
              className="flex items-center gap-1 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              <FaUserTie className="h-4 w-4" />
              Lead Teams
            </button>
            <button
              onClick={() => router.push("/teams/organisations")}
              className="flex items-center gap-1 px-3 py-1 rounded bg-slate-700 text-white"
            >
              <FaBuilding className="h-4 w-4" />
              My Organisations
            </button>
          </div>
        </div>
        <button
          onClick={() => router.push("/home")}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          Back to Dashboard
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-lg border-slate-700 bg-slate-800/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <FaBuilding className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Create Organization
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Set up a new organization to manage your teams
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Server Error Display */}
              {serverError && (
                <div
                  role="alert"
                  className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400"
                >
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              )}

              {/* Organization Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-200"
                >
                  Organization Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter organization name"
                  aria-describedby={errors.name ? "name-error" : undefined}
                  aria-invalid={!!errors.name}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  {...register("name")}
                />
                {errors.name && (
                  <p
                    id="name-error"
                    className="text-sm text-red-400"
                    role="alert"
                  >
                    {errors.name.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">Maximum 100 characters</p>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-200"
                >
                  Description <span className="text-slate-500">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this organization is about..."
                  rows={4}
                  aria-describedby={
                    errors.description ? "description-error" : undefined
                  }
                  aria-invalid={!!errors.description}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                  {...register("description")}
                />
                {errors.description && (
                  <p
                    id="description-error"
                    className="text-sm text-red-400"
                    role="alert"
                  >
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">Maximum 500 characters</p>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
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
