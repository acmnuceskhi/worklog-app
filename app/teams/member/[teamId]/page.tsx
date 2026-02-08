"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/worklog/rich-text-editor";
import { worklogCreateSchema } from "@/lib/validations";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface WorklogPreview {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface TeamDetails {
  name: string;
  leader: string;
}

const memberTeamDetails: Record<string, TeamDetails> = {
  "101": { name: "Marketing Team", leader: "alice@example.com" },
  "102": { name: "Design Team", leader: "bob@example.com" },
  "103": { name: "Product Team", leader: "leader@company.com" },
};

const githubPattern = /^https:\/\/(www\.)?github\.com\/.+/;

type WorklogFormValues = z.infer<typeof worklogCreateSchema>;

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ContributionFlashcardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const team = memberTeamDetails[teamId] || {
    name: "Unknown Team",
    leader: "N/A",
  };

  const [editorValue, setEditorValue] = useState("<p></p>");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [recentWorklogs, setRecentWorklogs] = useState<WorklogPreview[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WorklogFormValues>({
    resolver: zodResolver(worklogCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      githubLink: "",
      progressStatus: "STARTED",
      teamId,
    },
  });

  useEffect(() => {
    setValue("teamId", teamId);
  }, [setValue, teamId]);

  useEffect(() => {
    setValue("description", editorValue, { shouldValidate: false });
  }, [editorValue, setValue]);

  const githubLink = watch("githubLink");
  useEffect(() => {
    if (!githubLink) {
      clearErrors("githubLink");
      return;
    }

    const handler = setTimeout(() => {
      if (!githubPattern.test(githubLink)) {
        setError("githubLink", {
          type: "validate",
          message: "Provide a valid GitHub URL",
        });
      } else {
        clearErrors("githubLink");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [githubLink, clearErrors, setError]);

  const previews = useMemo(() => {
    return pendingFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [pendingFiles]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    setPendingFiles(Array.from(event.target.files));
    setUploadedFiles([]);
  };

  const uploadFiles = async () => {
    if (pendingFiles.length === 0) {
      return [] as UploadedFile[];
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      pendingFiles.forEach((file) => formData.append("files", file));
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Upload failed");
      }
      const payload = await response.json();
      const files = (payload.data || []) as UploadedFile[];
      setUploadedFiles(files);
      return files;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: WorklogFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    const cleaned = stripHtml(editorValue);
    if (!cleaned) {
      setError("description", {
        type: "validate",
        message: "Description must not be empty",
      });
      return;
    }

    try {
      const attachments = await uploadFiles();
      const payload = {
        ...values,
        githubLink: values.githubLink || undefined,
        description: editorValue,
        attachments,
      };

      const response = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create worklog");
      }

      const data = await response.json();
      const worklog = data.data as {
        id: string;
        title: string;
        description: string;
        createdAt: string;
      };

      setRecentWorklogs((prev) => [
        {
          id: worklog.id,
          title: worklog.title,
          description: stripHtml(worklog.description),
          createdAt: new Date(worklog.createdAt).toLocaleString(),
        },
        ...prev,
      ]);

      setSubmitSuccess("Worklog created successfully.");
      setEditorValue("<p></p>");
      setPendingFiles([]);
      setUploadedFiles([]);
      reset({
        title: "",
        description: "",
        githubLink: "",
        progressStatus: "STARTED",
        teamId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create worklog";
      setSubmitError(message);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-amber-500 text-xl">
              Create Worklog
            </CardTitle>
            <CardDescription className="text-center text-amber-500 mt-2">
              {team.name} • Led by: {team.leader}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <input type="hidden" {...register("teamId")} />
              <input type="hidden" {...register("description")} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="title" className="text-amber-500">
                  Title
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Short summary of your work"
                  className="bg-blue-900 border-amber-500/30 text-amber-100 placeholder:text-amber-200/50"
                />
                {errors.title && (
                  <p className="text-xs text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-amber-500">Description</Label>
                <RichTextEditor
                  value={editorValue}
                  onChange={setEditorValue}
                  placeholder="Describe your work and any outcomes."
                  id="worklog-description"
                />
                {errors.description && (
                  <p className="text-xs text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="githubLink" className="text-amber-500">
                  GitHub Link (optional)
                </Label>
                <Input
                  id="githubLink"
                  {...register("githubLink")}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="bg-blue-900 border-amber-500/30 text-amber-100 placeholder:text-amber-200/50"
                />
                {errors.githubLink && (
                  <p className="text-xs text-red-400">
                    {errors.githubLink.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-amber-500">Progress Status</Label>
                <Select
                  value={watch("progressStatus") || "STARTED"}
                  onValueChange={(value) =>
                    setValue(
                      "progressStatus",
                      value as "STARTED" | "HALF_DONE" | "COMPLETED",
                    )
                  }
                >
                  <SelectTrigger className="bg-blue-900 border-amber-500/30 text-amber-100">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-950 border-amber-500/30">
                    <SelectItem value="STARTED" className="text-amber-500">
                      Started
                    </SelectItem>
                    <SelectItem value="HALF_DONE" className="text-amber-500">
                      Half done
                    </SelectItem>
                    <SelectItem value="COMPLETED" className="text-amber-500">
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="files" className="text-amber-500">
                  Upload Evidence
                </Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFilesSelected}
                  className="bg-blue-900 border-amber-500/30 text-amber-100 file:text-amber-500 file:bg-blue-900 file:border file:border-amber-500/40"
                />
                {pendingFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {previews.map((preview) => (
                      <div
                        key={preview.file.name}
                        className="flex items-center justify-between rounded-md border border-amber-500/20 bg-blue-950 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          {preview.file.type.startsWith("image/") ? (
                            <Image
                              src={preview.url}
                              alt={preview.file.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-amber-500/10 flex items-center justify-center text-xs text-amber-400">
                              File
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-amber-100">
                              {preview.file.name}
                            </p>
                            <p className="text-xs text-amber-200/60">
                              {(preview.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="text-xs text-amber-200/70">
                    {uploadedFiles.length} file(s) ready to attach.
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-red-400">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="text-sm text-emerald-400">{submitSuccess}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {isSubmitting || isUploading
                  ? "Submitting..."
                  : "Submit Worklog"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-500">Recent Worklogs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorklogs.length > 0 ? (
              <div className="space-y-3">
                {recentWorklogs.map((worklog) => (
                  <div
                    key={worklog.id}
                    className="rounded-lg border border-amber-500/20 bg-blue-950 p-3"
                  >
                    <h4 className="text-amber-500 text-sm font-semibold">
                      {worklog.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {worklog.createdAt}
                    </p>
                    <p className="text-sm text-gray-200 mt-2">
                      {worklog.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Submit your first worklog to see it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
