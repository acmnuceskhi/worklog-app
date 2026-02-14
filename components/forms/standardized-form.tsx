"use client";

import React from "react";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * StandardizedForm
 * ──────────────────────────────────────────────────────────────────
 * A thin wrapper around <form> that enforces consistent spacing and
 * provides an optional inline submitting indicator.
 *
 * Usage:
 *   <StandardizedForm onSubmit={handleSubmit} isSubmitting={isPending}>
 *     <FormField label="Name" required error={errors.name}>
 *       <Input ... />
 *     </FormField>
 *     <Button type="submit">Save</Button>
 *   </StandardizedForm>
 * ────────────────────────────────────────────────────────────────── */

export interface StandardizedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** Show loading overlay while the form is being submitted */
  isSubmitting?: boolean;
  /** Text shown alongside the spinner during submission */
  submittingText?: string;
}

export const StandardizedForm = React.forwardRef<
  HTMLFormElement,
  StandardizedFormProps
>(
  (
    {
      children,
      className,
      isSubmitting = false,
      submittingText = "Saving…",
      onSubmit,
      ...props
    },
    ref,
  ) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit?.(e);
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        {...props}
      >
        <fieldset disabled={isSubmitting} className="space-y-4">
          {children}
        </fieldset>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-4 text-white/70">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-sm">{submittingText}</span>
          </div>
        )}
      </form>
    );
  },
);
StandardizedForm.displayName = "StandardizedForm";
