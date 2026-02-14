"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * FormField
 * ──────────────────────────────────────────────────────────────────
 * Wraps a form control with a consistent label, optional helper
 * text, and error message.  Designed to work inside
 * <StandardizedForm> but also usable standalone.
 *
 * Usage:
 *   <FormField label="Email" required error={errors.email}
 *              helpText="Use your university email">
 *     <Input type="email" value={email} onChange={…} />
 *   </FormField>
 * ────────────────────────────────────────────────────────────────── */

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Validation error message */
  error?: string;
  /** Mark the field as required (shows red asterisk) */
  required?: boolean;
  /** Small helper text below the input */
  helpText?: string;
  /** Unique id – forwarded to the label's `htmlFor` attribute */
  htmlFor?: string;
  /** Additional wrapper classes */
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  helpText,
  htmlFor,
  className,
  children,
}) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={htmlFor} className="text-sm font-medium text-white/90">
      {label}
      {required && <span className="ml-1 text-red-400">*</span>}
    </Label>

    {children}

    {helpText && !error && <p className="text-xs text-white/60">{helpText}</p>}

    {error && (
      <p className="flex items-center gap-1 text-xs text-red-400">
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0V4Zm.75 7.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);
FormField.displayName = "FormField";
