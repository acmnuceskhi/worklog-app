"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/forms/form-field";
import { toLocalDateString } from "@/lib/deadline-utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AssignTaskFormState {
  title: string;
  description: string;
  assignedTo: string;
  deadline: string;
}

export interface MemberOption {
  /** TeamMember record id */
  memberId: string;
  /** The user's ID (needed for the API) */
  userId: string;
  /** Display name (falls back to email) */
  displayName: string;
}

export interface AssignTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberOption[];
  onSubmit: (task: AssignTaskFormState) => void;
  isSubmitting?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function AssignTaskModal({
  open,
  onOpenChange,
  members,
  onSubmit,
  isSubmitting,
}: AssignTaskModalProps) {
  const [form, setForm] = React.useState<AssignTaskFormState>({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
  });

  // Reset form when dialog closes (e.g. after successful submit)
  React.useEffect(() => {
    if (!open) {
      setForm({ title: "", description: "", assignedTo: "", deadline: "" });
    }
  }, [open]);

  const update = (partial: Partial<AssignTaskFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const handleSubmit = () => {
    onSubmit(form);
  };

  const isValid =
    form.title.trim() && form.description.trim() && form.assignedTo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="dark:text-white text-gray-900">
            Assign Task
          </DialogTitle>
          <DialogDescription className="dark:text-white/60 text-gray-500">
            Create a new worklog and assign it to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FormField label="Task Title" required htmlFor="assign-task-title">
            <Input
              id="assign-task-title"
              placeholder="Enter task title"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/40 placeholder:text-gray-400"
            />
          </FormField>

          <FormField label="Description" required htmlFor="assign-task-desc">
            <Textarea
              id="assign-task-desc"
              placeholder="Enter task description"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/40 placeholder:text-gray-400 min-h-[100px]"
            />
          </FormField>

          <FormField label="Assign To" required htmlFor="assign-to">
            <Select
              value={form.assignedTo}
              onValueChange={(value) => update({ assignedTo: value })}
            >
              <SelectTrigger
                id="assign-to"
                className="dark:bg-white/5 bg-gray-50 dark:border-white/20 border-gray-300 dark:text-white text-gray-900"
              >
                <SelectValue placeholder="Select member…" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--panel-strong)] dark:border-white/10 border-gray-200">
                {members.map((m) => (
                  <SelectItem
                    key={m.memberId}
                    value={m.userId}
                    className="dark:text-white/80 text-gray-700"
                    disabled={!m.userId}
                  >
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Deadline" htmlFor="assign-deadline">
            <DatePicker
              id="assign-deadline"
              value={form.deadline ? new Date(form.deadline) : undefined}
              onChange={(date) =>
                update({ deadline: date ? toLocalDateString(date) : "" })
              }
              placeholder="Select deadline"
              disablePast
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="dark:border-white/20 border-gray-300 dark:text-white/70 text-gray-600"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Assigning…" : "Assign Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
