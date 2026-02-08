"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
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
import { toast } from "sonner";
import { worklogCreateSchema } from "@/lib/validations";
import {
  formatLocalDate,
  getDeadlineStatus,
  toUtcIso,
} from "@/lib/deadline-utils";

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
const AUTO_SAVE_DELAY_MS = 700;

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
  const { teamId } = use(params);
  const team = memberTeamDetails[teamId] || {
    name: "Unknown Team",
    leader: "N/A",
  };

  const [editorValue, setEditorValue] = useState("<p></p>");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [recentWorklogs, setRecentWorklogs] = useState<WorklogPreview[]>([]);
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

  useEffect(() => {
    setValue("teamId", teamId);
  }, [setValue, teamId]);

  useEffect(() => {
    setValue("description", editorValue, { shouldValidate: false });
  }, [editorValue, setValue]);

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
    let isActive = true;
    const loadWorklogs = async () => {
      try {
        const response = await fetch("/api/worklogs");
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        const worklogs = (payload.data || []) as Array<{
          id: string;
          title: string;
          description: string;
          createdAt: string;
          deadline?: string | null;
          progressStatus?: string | null;
        }>;

        if (isActive) {
          setRecentWorklogs(
            worklogs.slice(0, 5).map((worklog) => ({
              id: worklog.id,
              title: worklog.title,
              description: stripHtml(worklog.description),
              createdAt: new Date(worklog.createdAt).toLocaleString(),
              deadline: worklog.deadline ?? null,
              progressStatus: worklog.progressStatus ?? null,
            })),
          );
        }
      } catch {
        if (isActive) {
          setRecentWorklogs([]);
        }
      }
    };

    loadWorklogs();
    return () => {
      isActive = false;
    };
  }, []);

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

      const data = await response.json();
      const worklog = data.data as {
        id: string;
        title: string;
        description: string;
        createdAt: string;
        deadline?: string | null;
        progressStatus?: string | null;
      };

      setRecentWorklogs((prev) => [
        {
          id: worklog.id,
          title: worklog.title,
          description: stripHtml(worklog.description),
          createdAt: new Date(worklog.createdAt).toLocaleString(),
          deadline: worklog.deadline ?? null,
          progressStatus: worklog.progressStatus ?? null,
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

      setRecentWorklogs((prev) =>
        prev.map((worklog) =>
          worklog.id === updated.id
            ? { ...worklog, deadline: updated.deadline ?? null }
            : worklog,
        ),
      );
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

  useEffect(() => {
    recentWorklogs.forEach((worklog) => {
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
  }, [recentWorklogs]);

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

              {canSetDeadline && (
                <div className="flex flex-col gap-2">
                  <Label className="text-amber-500">
                    Deadline (leaders only)
                  </Label>
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
                  {errors.deadline && (
                    <p className="text-xs text-red-400">
                      {errors.deadline.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="files" className="text-amber-500">
                  Upload Evidence
                </Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`rounded-md border border-dashed px-4 py-5 text-sm transition-colors ${
                    isDragging
                      ? "border-amber-400 bg-amber-500/10 text-amber-200"
                      : "border-amber-500/30 bg-blue-950/60 text-amber-200/70"
                  }`}
                >
                  <p className="text-center">
                    Drag and drop files here, or{" "}
                    <button
                      type="button"
                      className="ml-1 text-amber-400 underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-center text-xs text-amber-200/60 mt-1">
                    Images and PDFs only. Drafts do not include attachments.
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
              {draftNotice && (
                <p className="text-xs text-amber-200/70">{draftNotice}</p>
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-amber-500 text-sm font-semibold">
                          {worklog.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
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
                    <p className="text-sm text-gray-200 mt-2">
                      {worklog.description}
                    </p>
                    {canSetDeadline && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
                          onClick={() =>
                            setEditingWorklog({
                              ...worklog,
                              deadline: worklog.deadline ?? null,
                            })
                          }
                        >
                          Edit deadline
                        </Button>
                      </div>
                    )}
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

      <Dialog
        open={Boolean(editingWorklog)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingWorklog(null);
          }
        }}
      >
        <DialogContent className="bg-blue-950 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-amber-500">Edit deadline</DialogTitle>
          </DialogHeader>
          {editingWorklog && (
            <div className="space-y-4">
              <div>
                <Label className="text-amber-500">Worklog</Label>
                <p className="text-sm text-amber-100">{editingWorklog.title}</p>
              </div>
              <div>
                <Label className="text-amber-500">Deadline</Label>
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
                  className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
                  onClick={() => setEditingWorklog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
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
