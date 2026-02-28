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
      <DialogContent className="bg-[var(--panel-strong)] border-white/10 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Assign Task</DialogTitle>
          <DialogDescription className="text-white/60">
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
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </FormField>

          <FormField label="Description" required htmlFor="assign-task-desc">
            <Textarea
              id="assign-task-desc"
              placeholder="Enter task description"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
            />
          </FormField>

          <FormField label="Assign To" required>
            <Select
              value={form.assignedTo}
              onValueChange={(value) => update({ assignedTo: value })}
            >
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select member…" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--panel-strong)] border-white/10">
                {members.map((m) => (
                  <SelectItem
                    key={m.memberId}
                    value={m.userId}
                    className="text-white/80"
                    disabled={!m.userId}
                  >
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Deadline">
            <DatePicker
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
            className="border-white/20 text-white/70"
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
