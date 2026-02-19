"use client";

import React, {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";
import { FormField } from "@/components/forms/form-field";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/worklog/rich-text-editor";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { worklogCreateSchema } from "@/lib/validations";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTeam, useWorklogs, useUpdateWorklogStatus } from "@/lib/hooks";
import { queryKeys } from "@/lib/query-keys";
import {
  formatLocalDate,
  getDeadlineStatus,
  toUtcIso,
} from "@/lib/deadline-utils";

const AUTO_SAVE_DELAY_MS = 2000;
const githubPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?$/;

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
  deadline?: string | null;
  progressStatus?: string | null;
}

function TeamMemberLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border border-white/10 rounded">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface WorklogDraft {
  title: string;
  description: string;
  githubLink?: string;
  progressStatus?: "STARTED" | "HALF_DONE" | "COMPLETED";
  deadline?: string;
  updatedAt: number;
}

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
  return (
    <ErrorBoundary>
      <ContributionFlashcardPageContent params={params} />
    </ErrorBoundary>
  );
}

function ContributionFlashcardPageContent({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const queryClient = useQueryClient();

  // Use custom hooks for data fetching
  const { data: team, isLoading, error, refetch } = useTeam(teamId);
  const { data: worklogsData = [], isLoading: worklogsLoading } = useWorklogs();
  const statusUpdateMutation = useUpdateWorklogStatus();

  // Initialize all hooks at the top
  const [editorValue, setEditorValue] = useState("<p></p>");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [canSetDeadline, setCanSetDeadline] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [editingWorklog, setEditingWorklog] = useState<WorklogPreview | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skipAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineNotifiedRef = useRef<Set<string>>(new Set());

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
      deadline: undefined,
      progressStatus: "STARTED",
      teamId,
    },
  });

  // Compute recent worklogs with proper formatting
  const recentWorklogs = useMemo(() => {
    return (worklogsData || []).slice(0, 5).map((worklog) => ({
      id: worklog.id,
      title: worklog.title,
      description: stripHtml(worklog.description || ""),
      createdAt: new Date(worklog.createdAt).toLocaleString(),
      deadline: worklog.deadline ?? null,
      progressStatus: worklog.progressStatus ?? null,
    }));
  }, [worklogsData]);

  // Memoized helper function to get valid status transitions
  const getValidStatusTransitions = useMemo(
    () =>
      (
        currentStatus: string | null | undefined,
      ): Array<{ value: string; label: string }> => {
        const status = currentStatus || "STARTED";
        const transitions: Record<
          string,
          Array<{ value: string; label: string }>
        > = {
          STARTED: [{ value: "HALF_DONE", label: "Halfway Done" }],
          HALF_DONE: [{ value: "COMPLETED", label: "Completed" }],
          COMPLETED: [],
        };
        return transitions[status] || [];
      },
    [],
  );

  // Memoized handler for status updates
  const handleStatusUpdate = useCallback(
    async (worklogId: string, newStatus: string) => {
      try {
        await statusUpdateMutation.mutateAsync({
          worklogId,
          newStatus: newStatus as "STARTED" | "HALF_DONE" | "COMPLETED",
        });
      } catch {
        // Error handling is done in the mutation's onError callback
        // No need for additional error handling here
      }
    },
    [statusUpdateMutation],
  );

  useEffect(() => {
    let isActive = true;
    const loadPermissions = async () => {
      try {
        const [ownedTeamsRes, ownedOrgsRes] = await Promise.all([
          fetch("/api/teams/owned"),
          fetch("/api/organizations"),
        ]);

        const ownedTeamsPayload = ownedTeamsRes.ok
          ? await ownedTeamsRes.json()
          : { data: [] };
        const ownedOrgsPayload = ownedOrgsRes.ok
          ? await ownedOrgsRes.json()
          : { data: [] };

        const ownsTeam = (ownedTeamsPayload.data || []).some(
          (ownedTeam: { id: string }) => ownedTeam.id === teamId,
        );

        const ownsOrgTeam = (ownedOrgsPayload.data || []).some(
          (org: { teams?: Array<{ id: string }> }) =>
            (org.teams || []).some((orgTeam) => orgTeam.id === teamId),
        );

        if (isActive) {
          setCanSetDeadline(Boolean(ownsTeam || ownsOrgTeam));
        }
      } catch {
        if (isActive) {
          setCanSetDeadline(false);
        }
      }
    };

    loadPermissions();
    return () => {
      isActive = false;
    };
  }, [teamId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = `worklog-draft-${teamId}`;
    const saved = window.localStorage.getItem(key);
    if (!saved) {
      skipAutosaveRef.current = false;
      return;
    }

    try {
      const parsed = JSON.parse(saved) as WorklogDraft;
      if (parsed?.title) {
        setValue("title", parsed.title, { shouldValidate: false });
      }
      if (parsed?.description) {
        setEditorValue(parsed.description);
      }
      if (parsed?.githubLink !== undefined) {
        setValue("githubLink", parsed.githubLink, { shouldValidate: false });
      }
      if (parsed?.progressStatus) {
        setValue("progressStatus", parsed.progressStatus, {
          shouldValidate: false,
        });
      }
      if (parsed?.deadline) {
        setValue("deadline", parsed.deadline, { shouldValidate: false });
      }
      setDraftNotice("Draft restored from autosave.");
    } catch {
      window.localStorage.removeItem(key);
    } finally {
      skipAutosaveRef.current = false;
    }
  }, [setValue, teamId]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (skipAutosaveRef.current) {
        return;
      }
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        if (typeof window === "undefined") {
          return;
        }

        const payload: WorklogDraft = {
          title: values.title || "",
          description: editorValue,
          githubLink: values.githubLink || "",
          progressStatus: values.progressStatus || "STARTED",
          deadline: values.deadline ? String(values.deadline) : undefined,
          updatedAt: Date.now(),
        };

        window.localStorage.setItem(
          `worklog-draft-${teamId}`,
          JSON.stringify(payload),
        );
        setDraftNotice("Draft saved.");
      }, AUTO_SAVE_DELAY_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [editorValue, teamId, watch]);

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

  useEffect(() => {
    if (!worklogsData) return;

    worklogsData.forEach((worklog) => {
      if (!worklog.deadline || deadlineNotifiedRef.current.has(worklog.id)) {
        return;
      }
      const info = getDeadlineStatus({
        deadline: worklog.deadline,
        status: worklog.progressStatus,
      });
      if (info.status === "overdue" || info.status === "due_soon") {
        deadlineNotifiedRef.current.add(worklog.id);
        if (info.status === "overdue") {
          toast.error(
            `Deadline ${formatLocalDate(new Date(worklog.deadline))}`,
            {
              description: `${worklog.title} is ${info.label.toLowerCase()}`,
            },
          );
        } else {
          toast.warning(
            `Deadline ${formatLocalDate(new Date(worklog.deadline))}`,
            {
              description: `${worklog.title} is ${info.label.toLowerCase()}`,
            },
          );
        }
      }
    });
  }, [worklogsData]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="p-6">
        <TeamMemberLoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "An error occurred"}
        onRetry={() => refetch()}
      />
    );
  }

  // No team found
  if (!team) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Team Not Found</h2>
          <p>The requested team could not be found.</p>
        </div>
      </div>
    );
  }

  // Continue with existing component logic but use real team data

  const appendFiles = (files: File[]) => {
    const filtered = files.filter(
      (file) =>
        file.type.startsWith("image/") || file.type === "application/pdf",
    );
    if (filtered.length === 0) {
      return;
    }
    setPendingFiles((prev) => [...prev, ...filtered]);
    setUploadedFiles([]);
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    appendFiles(Array.from(event.target.files));
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!event.dataTransfer.files?.length) {
      return;
    }
    appendFiles(Array.from(event.dataTransfer.files));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
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
    setDraftNotice(null);

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
        deadline: canSetDeadline ? values.deadline : undefined,
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

      await response.json();

      // Invalidate worklogs query to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });

      setSubmitSuccess("Worklog created successfully.");
      setEditorValue("<p></p>");
      setPendingFiles([]);
      setUploadedFiles([]);
      reset({
        title: "",
        description: "",
        githubLink: "",
        deadline: undefined,
        progressStatus: "STARTED",
        teamId,
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(`worklog-draft-${teamId}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create worklog";
      setSubmitError(message);
    }
  };

  const handleDeadlineUpdate = async () => {
    if (!editingWorklog) {
      return;
    }
    try {
      const response = await fetch(`/api/worklogs/${editingWorklog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline: editingWorklog.deadline || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to update deadline");
      }

      const payload = await response.json();
      const updated = payload.data as {
        id: string;
        deadline?: string | null;
      };

      // Invalidate worklogs query to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });
      toast.success(
        updated.deadline
          ? `New deadline ${formatLocalDate(new Date(updated.deadline))}`
          : "Deadline cleared",
        {
          description: "Deadline updated",
        },
      );
      setEditingWorklog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please try again", {
        description: "Deadline update failed",
      });
    }
  };

  const handleDeleteWorklog = async (
    worklogId: string,
    worklogTitle: string,
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${worklogTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/worklogs/${worklogId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to delete worklog");
      }

      // Invalidate worklogs query to refetch data
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      toast.success(`"${worklogTitle}" deleted successfully`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete worklog",
        {
          description: "Please try again",
        },
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{team.name}</h1>
          <p className="text-muted">
            Led by {team.owner.name || team.owner.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
            {recentWorklogs.length} recent worklogs
          </span>
          {canSetDeadline && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200">
              Deadline control enabled
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-white text-xl">
              Create Worklog
            </CardTitle>
            <CardDescription className="text-center text-muted mt-2">
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
              <FormField
                label="Title"
                htmlFor="title"
                error={errors.title?.message}
              >
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Short summary of your work"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </FormField>

              <FormField
                label="Description"
                error={errors.description?.message}
              >
                <RichTextEditor
                  value={editorValue}
                  onChange={setEditorValue}
                  placeholder="Describe your work and any outcomes."
                  id="worklog-description"
                />
              </FormField>

              <FormField
                label="GitHub Link"
                htmlFor="githubLink"
                error={errors.githubLink?.message}
              >
                <Input
                  id="githubLink"
                  {...register("githubLink")}
                  placeholder="https://github.com/owner/repo/pull/123 (optional)"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </FormField>

              <FormField label="Current Progress">
                <Select
                  value={watch("progressStatus") || "STARTED"}
                  onValueChange={(value) =>
                    setValue(
                      "progressStatus",
                      value as "STARTED" | "HALF_DONE" | "COMPLETED",
                    )
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select your progress" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--panel-strong)] border-white/10">
                    <SelectItem value="STARTED" className="text-white/80">
                      Just Started
                    </SelectItem>
                    <SelectItem value="HALF_DONE" className="text-white/80">
                      Halfway Done
                    </SelectItem>
                    <SelectItem value="COMPLETED" className="text-white/80">
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {canSetDeadline && (
                <FormField
                  label="Deadline (leaders only)"
                  error={errors.deadline?.message}
                >
                  <DatePicker
                    value={
                      watch("deadline")
                        ? new Date(String(watch("deadline")))
                        : undefined
                    }
                    onChange={(date) =>
                      setValue("deadline", date ? toUtcIso(date) : undefined, {
                        shouldValidate: true,
                      })
                    }
                    placeholder="Select deadline"
                  />
                  {watch("deadline") && (
                    <div className="flex flex-wrap items-center gap-2">
                      <DeadlineStatusBadge
                        deadline={String(watch("deadline"))}
                      />
                      <DeadlineCountdown deadline={String(watch("deadline"))} />
                    </div>
                  )}
                </FormField>
              )}

              <FormField label="Attach Files" htmlFor="files">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`rounded-md border border-dashed px-4 py-5 text-sm transition-colors ${
                    isDragging
                      ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                      : "border-white/20 bg-white/5 text-white/70"
                  }`}
                >
                  <p className="text-center">
                    Drag and drop files here, or{" "}
                    <button
                      type="button"
                      className="ml-1 text-amber-200 underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-center text-xs text-white/60 mt-1">
                    Add images or PDFs to support your worklog.
                  </p>
                  <Input
                    ref={fileInputRef}
                    id="files"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                </div>
                {pendingFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {previews.map((preview) => (
                      <div
                        key={preview.file.name}
                        className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
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
                            <div className="h-10 w-10 rounded bg-white/10 flex items-center justify-center text-xs text-white/70">
                              File
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-white">
                              {preview.file.name}
                            </p>
                            <p className="text-xs text-white/60">
                              {(preview.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="text-xs text-white/70">
                    {uploadedFiles.length} file(s) ready to attach.
                  </p>
                )}
              </FormField>

              {submitError && (
                <p className="text-sm text-red-400">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="text-sm text-emerald-400">{submitSuccess}</p>
              )}
              {draftNotice && (
                <p className="text-xs text-white/60">{draftNotice}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold"
              >
                {isSubmitting || isUploading
                  ? "Submitting..."
                  : "Submit Worklog"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Worklogs</CardTitle>
          </CardHeader>
          <CardContent>
            {worklogsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 animate-pulse"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-white/10 rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-white/20 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-white/10 rounded w-full mt-2"></div>
                    <div className="h-8 bg-white/10 rounded w-32 mt-3"></div>
                  </div>
                ))}
              </div>
            ) : recentWorklogs.length > 0 ? (
              <div className="space-y-3">
                {recentWorklogs.map((worklog) => (
                  <div
                    key={worklog.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-white text-sm font-semibold">
                          {worklog.title}
                        </h4>
                        <p className="text-xs text-white/60 mt-1">
                          {worklog.createdAt}
                        </p>
                      </div>
                      {worklog.deadline && (
                        <div className="flex flex-col items-end gap-1">
                          <DeadlineStatusBadge
                            deadline={worklog.deadline}
                            status={worklog.progressStatus}
                          />
                          <DeadlineCountdown deadline={worklog.deadline} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-2">
                      {worklog.description}
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">Status:</span>
                        <Select
                          value={worklog.progressStatus || "STARTED"}
                          onValueChange={(value) =>
                            handleStatusUpdate(worklog.id, value)
                          }
                          disabled={
                            (statusUpdateMutation.isPending &&
                              statusUpdateMutation.variables?.worklogId ===
                                worklog.id) ||
                            worklog.progressStatus === "COMPLETED"
                          }
                        >
                          <SelectTrigger
                            className="w-32 h-8 text-xs bg-white/5 border-white/20 text-white"
                            aria-label={`Update status for ${worklog.title}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--panel-strong)] border-white/10">
                            <SelectItem
                              value={worklog.progressStatus || "STARTED"}
                              className="text-white/80"
                            >
                              {worklog.progressStatus === "STARTED" &&
                                "Started"}
                              {worklog.progressStatus === "HALF_DONE" &&
                                "Halfway Done"}
                              {worklog.progressStatus === "COMPLETED" &&
                                "Completed"}
                              {!worklog.progressStatus && "Started"}
                            </SelectItem>
                            {getValidStatusTransitions(
                              worklog.progressStatus,
                            ).map((transition) => (
                              <SelectItem
                                key={transition.value}
                                value={transition.value}
                                className="text-white/80"
                              >
                                {transition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {statusUpdateMutation.isPending &&
                          statusUpdateMutation.variables?.worklogId ===
                            worklog.id && (
                            <div className="text-xs text-amber-400 animate-pulse">
                              Updating...
                            </div>
                          )}
                      </div>
                      {canSetDeadline && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white/80 hover:bg-white/10 h-8 text-xs"
                          onClick={() =>
                            setEditingWorklog({
                              ...worklog,
                              deadline: worklog.deadline ?? null,
                            })
                          }
                        >
                          Edit deadline
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-400/30 text-red-300 hover:bg-red-500/20 h-8 text-xs ml-auto"
                        onClick={() =>
                          handleDeleteWorklog(worklog.id, worklog.title)
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Submit your first worklog to see it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(editingWorklog)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingWorklog(null);
          }
        }}
      >
        <DialogContent className="bg-[var(--panel-strong)] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit deadline</DialogTitle>
          </DialogHeader>
          {editingWorklog && (
            <div className="space-y-4">
              <div>
                <Label className="text-white/80">Worklog</Label>
                <p className="text-sm text-white/70">{editingWorklog.title}</p>
              </div>
              <div>
                <Label className="text-white/80">Deadline</Label>
                <DatePicker
                  value={
                    editingWorklog.deadline
                      ? new Date(editingWorklog.deadline)
                      : undefined
                  }
                  onChange={(date) =>
                    setEditingWorklog((prev) =>
                      prev
                        ? {
                            ...prev,
                            deadline: date ? toUtcIso(date) : null,
                          }
                        : prev,
                    )
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DeadlineStatusBadge deadline={editingWorklog.deadline} />
                  <DeadlineCountdown deadline={editingWorklog.deadline} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => setEditingWorklog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                  onClick={handleDeadlineUpdate}
                >
                  Save deadline
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
