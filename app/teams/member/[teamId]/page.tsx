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
import { Check, Pencil, X } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DatePicker } from "@/components/ui/date-picker";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () =>
    import("@/components/worklog/rich-text-editor").then(
      (mod) => mod.RichTextEditor,
    ),
  {
    loading: () => (
      <div className="h-48 dark:bg-white/5 bg-gray-50 border dark:border-white/20 border-gray-300 rounded-md animate-pulse" />
    ),
    ssr: false,
  },
);
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

import { worklogCreateSchema } from "@/lib/validations";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { useSharedSession } from "@/components/providers";
import {
  useTeam,
  useTeamMembers,
  useTeamWorklogs,
  useUpdateWorklogStatus,
  useCreateWorklog,
  useUpdateWorklogDeadline,
  useDeleteWorklog,
} from "@/lib/hooks";
import {
  formatLocalDate,
  getDeadlineStatus,
  toLocalDateString,
} from "@/lib/deadline-utils";
import { formatTableDateTime } from "@/lib/tables/table-utils";

const AUTO_SAVE_DELAY_MS = 2000;
const githubPattern = /^https:\/\/(www\.)?github\.com\/.+/;

function parseGithubLinks(value: string) {
  return value
    .split(/[\n,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function hasValidGithubLinks(value?: string) {
  if (!value) return true;
  const links = parseGithubLinks(value);
  return links.length > 0 && links.every((link) => githubPattern.test(link));
}

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
  updatedAt?: string;
  deadline?: string | null;
  progressStatus?: string | null;
}

interface EditableWorklog {
  id: string;
  title: string;
  description: string;
  githubLink: string;
}

function TeamMemberLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 backdrop-blur-md">
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

        <Card className="border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 backdrop-blur-md">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-3 border dark:border-white/10 border-gray-200 rounded"
                >
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

function normalizeRichTextHtml(value: string) {
  return stripHtml(value).length > 0 ? value : "";
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
  const { data: session } = useSharedSession();

  // Use custom hooks for data fetching
  const { data: team, isLoading, error, refetch } = useTeam(teamId);
  const { data: paginatedMembers } = useTeamMembers(teamId);
  const teamMembers = paginatedMembers?.items ?? [];
  const [worklogPage, setWorklogPage] = useState(1);
  const {
    data: paginatedWorklogs,
    isLoading: worklogsLoading,
    refetch: refetchTeamWorklogs,
  } = useTeamWorklogs(teamId, worklogPage, 8);
  const teamWorklogs = useMemo(
    () => paginatedWorklogs?.items ?? [],
    [paginatedWorklogs?.items],
  );
  const statusUpdateMutation = useUpdateWorklogStatus();
  const createWorklogMutation = useCreateWorklog();
  const deadlineUpdateMutation = useUpdateWorklogDeadline();
  const deleteWorklogMutation = useDeleteWorklog(teamId);

  // Initialize all hooks at the top
  const [createEditorSeed, setCreateEditorSeed] = useState("<p></p>");
  const createEditorHtmlRef = useRef("<p></p>");
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
  const [worklogToDelete, setWorklogToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editableWorklog, setEditableWorklog] =
    useState<EditableWorklog | null>(null);
  const [editEditorSeed, setEditEditorSeed] = useState("<p></p>");
  const editEditorHtmlRef = useRef("<p></p>");
  const [editPendingFiles, setEditPendingFiles] = useState<File[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [clearCreateOpen, setClearCreateOpen] = useState(false);
  const [clearEditOpen, setClearEditOpen] = useState(false);
  const [createFormVersion, setCreateFormVersion] = useState(0);
  const [editFormVersion, setEditFormVersion] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const skipAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineNotifiedRef = useRef<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
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
    return (teamWorklogs || []).map((worklog) => ({
      id: worklog.id,
      userId: worklog.userId,
      title: worklog.title,
      description: stripHtml(worklog.description || ""),
      createdAt: formatTableDateTime(worklog.createdAt),
      updatedAt: formatTableDateTime(worklog.updatedAt),
      deadline: worklog.deadline ?? null,
      progressStatus: worklog.progressStatus ?? null,
    }));
  }, [teamWorklogs]);

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
          REVIEWED: [],
          GRADED: [],
        };
        return transitions[status] || [];
      },
    [],
  );

  // Memoized handler for status updates
  const handleStatusUpdate = useCallback(
    async (worklogId: string, newStatus: string) => {
      toast.promise(
        statusUpdateMutation.mutateAsync({
          worklogId,
          newStatus: newStatus as "STARTED" | "HALF_DONE" | "COMPLETED",
        }),
        {
          loading: "Updating status...",
          success: "Status updated successfully",
          error: (err) =>
            err instanceof Error ? err.message : "Failed to update status",
        },
      );
    },
    [statusUpdateMutation],
  );

  useEffect(() => {
    let isActive = true;

    // In development, derive permission from mock data without network calls
    if (process.env.NODE_ENV === "development") {
      // Only team leads can set deadlines
      const isTeamLeadInMock = session?.user?.id === "mock-org-owner-1";
      setCanSetDeadline(isTeamLeadInMock);
      return;
    }

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
  }, [teamId, session]);

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
        setCreateEditorSeed(parsed.description);
        createEditorHtmlRef.current = parsed.description;
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
          description: createEditorHtmlRef.current,
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
  }, [teamId, watch]);

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
    if (!teamWorklogs.length) return;

    teamWorklogs.forEach((worklog) => {
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
  }, [teamWorklogs]);

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

  // Prefer authenticated user ID; only fall back to mock ID in dev when no
  // session exists. This prevents Access Denied for real owners in dev mode.
  const effectiveUserId =
    session?.user?.id ||
    (process.env.NODE_ENV === "development" ? "mock-org-owner-1" : undefined);

  // Check if user is a member of this team
  const isMember = teamMembers.some(
    (member) =>
      member.userId === effectiveUserId && member.status === "ACCEPTED",
  );
  const isOwner = team.ownerId === effectiveUserId;

  if (!isMember && !isOwner) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>You are not a member of this team.</p>
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

    const processSubmission = async () => {
      const attachments = await uploadFiles();
      const rawDeadline = canSetDeadline ? values.deadline : undefined;
      const payload = {
        title: values.title,
        description: normalizeRichTextHtml(createEditorHtmlRef.current),
        githubLink: values.githubLink || undefined,
        teamId,
        deadline: rawDeadline,
        attachments,
      };

      return await createWorklogMutation.mutateAsync(payload);
    };

    toast.promise(processSubmission(), {
      loading: "Creating worklog...",
      success: () => {
        createEditorHtmlRef.current = "<p></p>";
        setCreateEditorSeed("<p></p>");
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
        return "Worklog created successfully";
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to create worklog";
        setSubmitError(message);
        return message;
      },
    });
  };

  const handleDeadlineUpdate = async () => {
    if (!editingWorklog) {
      return;
    }

    const updateProcess = async () => {
      return await deadlineUpdateMutation.mutateAsync({
        worklogId: editingWorklog.id,
        deadline: editingWorklog.deadline || null,
      });
    };

    toast.promise(updateProcess(), {
      loading: "Updating deadline...",
      success: (updated) => {
        setEditingWorklog(null);
        return updated.deadline
          ? `New deadline: ${formatLocalDate(new Date(updated.deadline))}`
          : "Deadline cleared";
      },
      error: (err: unknown) =>
        err instanceof Error ? err.message : "Failed to update deadline",
    });
  };

  const handleDeleteWorklog = (worklogId: string, worklogTitle: string) => {
    setWorklogToDelete({ id: worklogId, title: worklogTitle });
  };

  const uploadEditFiles = async () => {
    if (editPendingFiles.length === 0) {
      return [] as UploadedFile[];
    }

    setIsEditUploading(true);
    try {
      const formData = new FormData();
      editPendingFiles.forEach((file) => formData.append("files", file));
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Upload failed");
      }
      const payload = await response.json();
      return (payload.data || []) as UploadedFile[];
    } finally {
      setIsEditUploading(false);
    }
  };

  const clearCreateForm = () => {
    createEditorHtmlRef.current = "<p></p>";
    setCreateEditorSeed("<p></p>");
    setCreateFormVersion((v) => v + 1);
    setPendingFiles([]);
    setUploadedFiles([]);
    setSubmitError(null);
    setSubmitSuccess(null);
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
    setDraftNotice("Draft cleared.");
  };

  const clearEditForm = () => {
    if (!editableWorklog) return;
    editEditorHtmlRef.current = "<p></p>";
    setEditEditorSeed("<p></p>");
    setEditPendingFiles([]);
    setEditableWorklog((prev) =>
      prev
        ? {
            ...prev,
            title: "",
            description: "",
            githubLink: "",
          }
        : prev,
    );
    setEditFormVersion((v) => v + 1);
  };

  const handleOpenEditWorklog = (worklogId: string) => {
    const original = teamWorklogs.find((worklog) => worklog.id === worklogId);
    if (!original) {
      return;
    }

    if (
      original.progressStatus === "REVIEWED" ||
      original.progressStatus === "GRADED"
    ) {
      toast.info("Locked Worklog", {
        description: "Reviewed or graded worklogs cannot be edited.",
        duration: 2500,
      });
      return;
    }

    setEditableWorklog({
      id: original.id,
      title: original.title || "",
      description: original.description || "",
      githubLink: original.githubLink || "",
    });
    editEditorHtmlRef.current = original.description || "<p></p>";
    setEditEditorSeed(original.description || "<p></p>");
    setEditPendingFiles([]);
  };

  const handleSaveEditedWorklog = async () => {
    if (!editableWorklog) {
      return;
    }

    if (!editableWorklog.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!hasValidGithubLinks(editableWorklog.githubLink || undefined)) {
      toast.error("Provide valid GitHub URL(s), separated by commas/new lines");
      return;
    }

    const processUpdate = async () => {
      const attachments = await uploadEditFiles();
      const response = await fetch(`/api/worklogs/${editableWorklog.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editableWorklog.title,
          description: normalizeRichTextHtml(editEditorHtmlRef.current),
          githubLink: editableWorklog.githubLink || null,
          attachments,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update worklog");
      }

      return payload;
    };

    toast.promise(processUpdate(), {
      loading: "Updating worklog...",
      success: async () => {
        setEditableWorklog(null);
        editEditorHtmlRef.current = "<p></p>";
        setEditEditorSeed("<p></p>");
        setEditPendingFiles([]);
        await refetchTeamWorklogs();
        return "Worklog updated successfully";
      },
      error: (err: unknown) =>
        err instanceof Error ? err.message : "Failed to update worklog",
    });
  };

  const confirmDeleteWorklog = () => {
    if (!worklogToDelete) return;
    const { id, title } = worklogToDelete;
    setWorklogToDelete(null);
    toast.promise(deleteWorklogMutation.mutateAsync({ worklogId: id, title }), {
      loading: `Deleting "${title}"...`,
      success: () => `"${title}" deleted successfully`,
      error: (err: unknown) =>
        err instanceof Error ? err.message : "Failed to delete worklog",
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white text-gray-900">
            {team.name}
          </h1>
          <p className="text-muted">
            Led by {team.owner.name || team.owner.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
            {paginatedWorklogs?.meta.total ?? 0} total worklogs
          </span>
          {canSetDeadline && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200">
              Deadline control enabled
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 backdrop-blur-md shadow-lg dark:shadow-black/20 shadow-gray-200/50 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-center dark:text-white text-gray-900 text-xl">
              Create Worklog
            </CardTitle>
            <CardDescription className="text-center text-muted mt-2">
              {team.name} • Led by:{" "}
              {team.owner?.name || team.owner?.email || "Unknown"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <input type="hidden" {...register("teamId")} />
              <FormField
                label="Title"
                required
                htmlFor="title"
                error={errors.title?.message}
              >
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Short summary of your work"
                  className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400"
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="worklog-description"
                helpText="Optional"
                error={errors.description?.message}
              >
                <RichTextEditor
                  key={`create-worklog-editor-${createFormVersion}`}
                  value={createEditorSeed}
                  onChange={(newValue) => {
                    createEditorHtmlRef.current = newValue;
                  }}
                  placeholder="Describe your work and any outcomes."
                  id="worklog-description"
                />
              </FormField>

              <FormField
                label="GitHub Link(s)"
                htmlFor="githubLink"
                helpText="Optional"
                error={errors.githubLink?.message}
              >
                <Input
                  id="githubLink"
                  {...register("githubLink")}
                  placeholder="Comma/new-line separated GitHub PR/commit links"
                  className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/50 placeholder:text-gray-400"
                />
              </FormField>

              <FormField
                label="Current Progress"
                required
                htmlFor="progress-status"
              >
                <Select
                  value={watch("progressStatus") || "STARTED"}
                  onValueChange={(value) =>
                    setValue(
                      "progressStatus",
                      value as "STARTED" | "HALF_DONE" | "COMPLETED",
                    )
                  }
                >
                  <SelectTrigger
                    id="progress-status"
                    className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900"
                  >
                    <SelectValue placeholder="Select your progress" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
                    <SelectItem
                      value="STARTED"
                      className="dark:text-white/80 text-gray-700"
                    >
                      Just Started
                    </SelectItem>
                    <SelectItem
                      value="HALF_DONE"
                      className="dark:text-white/80 text-gray-700"
                    >
                      Halfway Done
                    </SelectItem>
                    <SelectItem
                      value="COMPLETED"
                      className="dark:text-white/80 text-gray-700"
                    >
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {canSetDeadline && (
                <FormField
                  label="Deadline (leaders only)"
                  htmlFor="worklog-deadline"
                  error={errors.deadline?.message}
                >
                  <DatePicker
                    id="worklog-deadline"
                    value={
                      watch("deadline")
                        ? new Date(String(watch("deadline")))
                        : undefined
                    }
                    onChange={(date) =>
                      setValue(
                        "deadline",
                        date ? toLocalDateString(date) : undefined,
                        {
                          shouldValidate: true,
                        },
                      )
                    }
                    placeholder="Select deadline"
                    disablePast
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

              <FormField
                label="Attach Files"
                helpText="Optional"
                htmlFor="files"
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`rounded-md border border-dashed px-4 py-5 text-sm transition-colors ${
                    isDragging
                      ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                      : "dark:border-white/20 border-gray-300 dark:bg-white/5 bg-gray-50 dark:text-white/70 text-gray-600"
                  }`}
                >
                  <p className="text-center">
                    Drag and drop files here, or{" "}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto p-0 ml-1 text-amber-200 underline hover:text-amber-100 bg-transparent hover:bg-transparent"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Browse files"
                    >
                      browse
                    </Button>
                  </p>
                  <p className="text-center text-xs dark:text-white/60 text-gray-500 mt-1">
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
                        className="flex items-center justify-between rounded-md border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-2"
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
                            <div className="h-10 w-10 rounded dark:bg-white/10 bg-gray-100 flex items-center justify-center text-xs dark:text-white/70 text-gray-600">
                              File
                            </div>
                          )}
                          <div>
                            <p className="text-sm dark:text-white text-gray-900">
                              {preview.file.name}
                            </p>
                            <p className="text-xs dark:text-white/60 text-gray-500">
                              {(preview.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="text-xs dark:text-white/70 text-gray-600">
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
                <p className="text-xs dark:text-white/60 text-gray-500">
                  {draftNotice}
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setClearCreateOpen(true)}
                disabled={isSubmitting || isUploading}
              >
                Clear All
              </Button>

              <Button
                type="submit"
                disabled={
                  isSubmitting || isUploading || createWorklogMutation.isPending
                }
                isLoading={createWorklogMutation.isPending}
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                aria-label="Submit Worklog"
              >
                Submit Worklog
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 backdrop-blur-md shadow-lg dark:shadow-black/20 shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="dark:text-white text-gray-900">
              Recent Worklogs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {worklogsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 p-3 animate-pulse"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="h-4 dark:bg-white/20 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 dark:bg-white/10 bg-gray-100 rounded w-24"></div>
                      </div>
                      <div className="h-6 dark:bg-white/20 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-3 dark:bg-white/10 bg-gray-100 rounded w-full mt-2"></div>
                    <div className="h-8 dark:bg-white/10 bg-gray-100 rounded w-32 mt-3"></div>
                  </div>
                ))}
              </div>
            ) : recentWorklogs.length > 0 ? (
              <div className="space-y-3">
                {recentWorklogs.map((worklog) => (
                  <div
                    key={worklog.id}
                    className="rounded-lg border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="dark:text-white text-gray-900 text-sm font-semibold">
                          {worklog.title}
                        </h4>
                        <p className="text-xs dark:text-white/60 text-gray-500 mt-1">
                          Created {worklog.createdAt}
                          {worklog.updatedAt &&
                          worklog.updatedAt !== worklog.createdAt
                            ? ` • Last updated ${worklog.updatedAt}`
                            : ""}
                        </p>
                      </div>
                      {worklog.deadline && (
                        <div className="flex flex-col items-end gap-1">
                          <DeadlineStatusBadge
                            deadline={worklog.deadline}
                            status={worklog.progressStatus}
                          />
                          <DeadlineCountdown
                            deadline={worklog.deadline}
                            status={worklog.progressStatus}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-2 line-clamp-2">
                      {worklog.description}
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap items-center">
                      {(() => {
                        const isCreator = worklog.userId === session?.user?.id;
                        const isLocked =
                          worklog.progressStatus === "REVIEWED" ||
                          worklog.progressStatus === "GRADED";
                        const canModify = isCreator && !isLocked;
                        const visibleStatus =
                          !canSetDeadline && isLocked
                            ? "COMPLETED"
                            : worklog.progressStatus || "STARTED";
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs dark:text-white/60 text-gray-500">
                                Status:
                              </span>
                              <Select
                                value={visibleStatus}
                                onValueChange={(value) =>
                                  handleStatusUpdate(worklog.id, value)
                                }
                                disabled={
                                  (statusUpdateMutation.isPending &&
                                    statusUpdateMutation.variables
                                      ?.worklogId === worklog.id) ||
                                  worklog.progressStatus === "COMPLETED" ||
                                  worklog.progressStatus === "REVIEWED" ||
                                  worklog.progressStatus === "GRADED"
                                }
                              >
                                <SelectTrigger
                                  className="w-32 h-8 text-xs dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900"
                                  aria-label={`Update status for ${worklog.title}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
                                  <SelectItem
                                    value={visibleStatus}
                                    className="dark:text-white/80 text-gray-700"
                                  >
                                    {visibleStatus === "STARTED" && "Started"}
                                    {visibleStatus === "HALF_DONE" &&
                                      "Halfway Done"}
                                    {visibleStatus === "COMPLETED" &&
                                      "Completed"}
                                  </SelectItem>
                                  {getValidStatusTransitions(visibleStatus).map(
                                    (transition) => (
                                      <SelectItem
                                        key={transition.value}
                                        value={transition.value}
                                        className="dark:text-white/80 text-gray-700"
                                      >
                                        {transition.label}
                                      </SelectItem>
                                    ),
                                  )}
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
                                variant="secondary"
                                size="sm"
                                className="dark:border-white/20 border-gray-300 dark:text-white/80 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200 h-8 text-xs"
                                onClick={() =>
                                  setEditingWorklog({
                                    ...worklog,
                                    deadline: worklog.deadline ?? null,
                                  })
                                }
                                aria-label={`Edit deadline for ${worklog.title}`}
                              >
                                <Pencil className="mr-2" />
                                Edit deadline
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="dark:border-white/20 border-gray-300 dark:text-white/80 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200 h-8 text-xs"
                              onClick={() => handleOpenEditWorklog(worklog.id)}
                              disabled={!canModify}
                            >
                              <Pencil className="mr-2" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-red-400/30 text-red-300 hover:bg-red-500/20 h-8 text-xs ml-auto"
                              onClick={() =>
                                handleDeleteWorklog(worklog.id, worklog.title)
                              }
                              disabled={
                                deleteWorklogMutation.isPending || !canModify
                              }
                              isLoading={
                                deleteWorklogMutation.isPending &&
                                deleteWorklogMutation.variables?.worklogId ===
                                  worklog.id
                              }
                            >
                              Delete
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Submit your first worklog to see it here.
              </p>
            )}
            <Pagination
              currentPage={worklogPage}
              totalPages={paginatedWorklogs?.meta.totalPages ?? 1}
              onPageChange={setWorklogPage}
              isLoading={worklogsLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(editableWorklog)}
        onOpenChange={(open) => {
          if (!open) {
            setEditableWorklog(null);
          }
        }}
      >
        <DialogContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-gray-900">
              Edit worklog
            </DialogTitle>
            <DialogDescription className="dark:text-white/60 text-gray-500">
              Update your worklog content. Reviewed or graded worklogs are
              locked.
            </DialogDescription>
          </DialogHeader>
          {editableWorklog && (
            <div className="space-y-4">
              <FormField label="Title" required htmlFor="edit-worklog-title">
                <Input
                  key={`edit-title-${editFormVersion}`}
                  id="edit-worklog-title"
                  defaultValue={editableWorklog.title}
                  onBlur={(e) =>
                    setEditableWorklog((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                  className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900"
                />
              </FormField>

              <FormField
                label="Description"
                helpText="Optional"
                htmlFor="edit-worklog-description"
              >
                <RichTextEditor
                  id="edit-worklog-description"
                  value={editEditorSeed}
                  onChange={(newValue) => {
                    editEditorHtmlRef.current = newValue;
                  }}
                  placeholder="Describe your work and any outcomes."
                />
              </FormField>

              <FormField
                label="GitHub Link(s)"
                helpText="Optional"
                htmlFor="edit-worklog-github"
              >
                <Input
                  key={`edit-github-${editFormVersion}`}
                  id="edit-worklog-github"
                  defaultValue={editableWorklog.githubLink}
                  onBlur={(e) =>
                    setEditableWorklog((prev) =>
                      prev ? { ...prev, githubLink: e.target.value } : prev,
                    )
                  }
                  placeholder="Comma/new-line separated GitHub PR/commit links"
                  className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900"
                />
              </FormField>

              <FormField
                label="Attach Files"
                helpText="Optional"
                htmlFor="edit-files"
              >
                <div className="rounded-md border border-dashed dark:border-white/20 border-gray-300 px-4 py-4 text-sm dark:bg-white/5 bg-gray-50">
                  <p className="text-center">
                    Add images or PDFs, or{" "}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto p-0 ml-1 text-amber-200 underline hover:text-amber-100 bg-transparent hover:bg-transparent"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      browse
                    </Button>
                  </p>
                  <Input
                    ref={editFileInputRef}
                    id="edit-files"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      const filtered = files.filter(
                        (file) =>
                          file.type.startsWith("image/") ||
                          file.type === "application/pdf",
                      );
                      setEditPendingFiles(filtered);
                    }}
                    className="hidden"
                  />
                </div>
                {editPendingFiles.length > 0 && (
                  <p className="text-xs dark:text-white/70 text-gray-600">
                    {editPendingFiles.length} file(s) will be attached on save.
                  </p>
                )}
              </FormField>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setClearEditOpen(true)}
                >
                  Clear All
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="dark:border-white/20 border-gray-300 dark:text-white/80 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200"
                  onClick={() => setEditableWorklog(null)}
                >
                  <X className="mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                  onClick={handleSaveEditedWorklog}
                  disabled={isEditUploading}
                  isLoading={isEditUploading}
                >
                  <Check className="mr-2" />
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingWorklog)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingWorklog(null);
          }
        }}
      >
        <DialogContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-gray-900">
              Edit deadline
            </DialogTitle>
            <DialogDescription className="dark:text-white/60 text-gray-500">
              Adjust the deadline for this worklog.
            </DialogDescription>
          </DialogHeader>
          {editingWorklog && (
            <div className="space-y-4">
              <div>
                <Label className="dark:text-white/80 text-gray-700">
                  Worklog
                </Label>
                <p className="text-sm dark:text-white/70 text-gray-600">
                  {editingWorklog.title}
                </p>
              </div>
              <div>
                <Label className="dark:text-white/80 text-gray-700">
                  Deadline
                </Label>
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
                            deadline: date ? toLocalDateString(date) : null,
                          }
                        : prev,
                    )
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DeadlineStatusBadge deadline={editingWorklog.deadline} />
                  <DeadlineCountdown
                    deadline={editingWorklog.deadline}
                    status={editingWorklog.progressStatus}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="dark:border-white/20 border-gray-300 dark:text-white/80 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200"
                  onClick={() => setEditingWorklog(null)}
                  aria-label="Cancel deadline edit"
                  disabled={deadlineUpdateMutation.isPending}
                >
                  <X className="mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                  onClick={handleDeadlineUpdate}
                  aria-label="Save deadline"
                  disabled={deadlineUpdateMutation.isPending}
                  isLoading={deadlineUpdateMutation.isPending}
                >
                  <Check className="mr-2" />
                  Save deadline
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Worklog Confirmation */}
      <AlertDialog open={clearCreateOpen} onOpenChange={setClearCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Worklog Form</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear title, description, links, and pending files. Are
              you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearCreateForm();
                setClearCreateOpen(false);
              }}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearEditOpen} onOpenChange={setClearEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Edit Form</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all editable fields in the current worklog edit
              modal. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearEditForm();
                setClearEditOpen(false);
              }}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!worklogToDelete}
        onOpenChange={(open) => !open && setWorklogToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worklog</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{worklogToDelete?.title}&rdquo;</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDeleteWorklog}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
