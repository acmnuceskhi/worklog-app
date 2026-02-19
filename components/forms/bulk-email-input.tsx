"use client";

import React, { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FaTimes, FaCheck, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface BulkEmailInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  label?: string;
  placeholder?: string;
  validateEmail?: (email: string) => boolean;
  className?: string;
  maxEmails?: number;
}

const defaultEmailValidation = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const BulkEmailInput: React.FC<BulkEmailInputProps> = ({
  emails,
  onChange,
  label = "Email Addresses",
  placeholder = "Enter email addresses (press Enter or comma to add)",
  validateEmail = defaultEmailValidation,
  className = "",
  maxEmails = 50,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number | null>(
    null,
  );

  const addEmail = useCallback(
    (email: string) => {
      const trimmedEmail = email.trim().toLowerCase();

      // Clear any existing errors
      setError(null);

      if (!trimmedEmail) {
        return;
      }

      // Check max emails limit
      if (emails.length >= maxEmails) {
        setError(`Maximum ${maxEmails} emails allowed`);
        return;
      }

      // Validate email format
      if (!validateEmail(trimmedEmail)) {
        setError(`Invalid email format: ${trimmedEmail}`);
        return;
      }

      // Check for duplicates
      if (emails.includes(trimmedEmail)) {
        setError(`Email already added: ${trimmedEmail}`);
        return;
      }

      // Add email
      onChange([...emails, trimmedEmail]);
      setInputValue("");

      // Announce to screen readers
      announceToScreenReader(`Added email: ${trimmedEmail}`);
    },
    [emails, onChange, validateEmail, maxEmails],
  );

  const removeEmail = useCallback(
    (index: number) => {
      const removedEmail = emails[index];
      onChange(emails.filter((_, i) => i !== index));

      // Announce to screen readers
      announceToScreenReader(`Removed email: ${removedEmail}`);

      // Reset selection
      setSelectedEmailIndex(null);
    },
    [emails, onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);

    // Handle comma or semicolon separation
    if (value.includes(",") || value.includes(";")) {
      const emailsToAdd = value
        .split(/[,;]/)
        .map((email) => email.trim())
        .filter((email) => email);

      emailsToAdd.forEach((email) => addEmail(email));
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      // Remove last email on backspace when input is empty
      removeEmail(emails.length - 1);
    } else if (e.key === "Escape") {
      setInputValue("");
      setError(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // Split by common delimiters (newline, comma, semicolon, space)
    const emailsToAdd = pastedText
      .split(/[\n,;\s]+/)
      .map((email) => email.trim())
      .filter((email) => email);

    let addedCount = 0;
    let skippedCount = 0;

    emailsToAdd.forEach((email) => {
      if (
        emails.length + addedCount < maxEmails &&
        validateEmail(email) &&
        !emails.includes(email.toLowerCase())
      ) {
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    // Add all valid emails at once
    const validEmails = emailsToAdd
      .filter((email) => validateEmail(email))
      .map((email) => email.toLowerCase())
      .filter((email) => !emails.includes(email))
      .slice(0, maxEmails - emails.length);

    if (validEmails.length > 0) {
      onChange([...emails, ...validEmails]);
      announceToScreenReader(
        `Added ${validEmails.length} email${validEmails.length !== 1 ? "s" : ""}`,
      );
    }

    if (skippedCount > 0) {
      setError(
        `${skippedCount} email${skippedCount !== 1 ? "s" : ""} skipped (invalid format or duplicate)`,
      );
    }

    setInputValue("");
  };

  const handleEmailClick = (index: number) => {
    setSelectedEmailIndex(selectedEmailIndex === index ? null : index);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeEmail(index);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleEmailClick(index);
    }
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.getElementById("email-announcer");
    if (announcement) {
      announcement.textContent = message;
    }
  };

  return (
    <div className={`bulk-email-input ${className}`}>
      <Label
        htmlFor="bulk-email-input"
        className="text-sm font-medium mb-2 block"
      >
        {label}
        <span className="text-white/50 ml-2 text-xs font-normal">
          ({emails.length}/{maxEmails})
        </span>
      </Label>

      {/* Email Tags Display */}
      <div
        className={`
          min-h-[100px] p-3 border rounded-md bg-white/5
          transition-all duration-200
          ${focused ? "ring-2 ring-blue-500 border-blue-500" : "border-white/20"}
          ${error ? "border-red-500" : ""}
          touch-manipulation
        `}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <AnimatePresence>
            {emails.map((email, index) => (
              <motion.div
                key={`${email}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`
                  inline-flex items-center gap-1 px-3 py-1.5 md:py-1 rounded-full text-sm
                  bg-blue-500/20 text-blue-300 border border-blue-500/30
                  transition-all duration-200
                  ${selectedEmailIndex === index ? "ring-2 ring-blue-400" : ""}
                  min-h-[36px] md:min-h-0
                `}
                tabIndex={0}
                role="button"
                aria-label={`Email: ${email}. Press Delete or Backspace to remove`}
                onClick={() => handleEmailClick(index)}
                onKeyDown={(e: React.KeyboardEvent) =>
                  handleEmailKeyDown(e, index)
                }
              >
                <FaCheck className="text-blue-400" aria-hidden="true" />
                <span className="text-xs sm:text-sm">{email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEmail(index);
                  }}
                  className="ml-1 hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full p-1 md:p-0.5 min-w-[24px] md:min-w-0 h-auto"
                  aria-label={`Remove ${email}`}
                >
                  <FaTimes aria-hidden="true" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Field */}
        <Input
          ref={inputRef}
          id="bulk-email-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            emails.length === 0 ? placeholder : "Add another email..."
          }
          className="border-0 focus:ring-0 p-0 h-10 md:h-8 text-base md:text-sm"
          disabled={emails.length >= maxEmails}
          aria-describedby="email-error email-help"
          aria-invalid={!!error}
        />
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id="email-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-2 text-sm text-red-400"
            role="alert"
          >
            <FaExclamationCircle aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <p id="email-help" className="text-xs text-white/50 mt-2">
        Press Enter, comma, or semicolon to add emails. Paste multiple emails
        from clipboard.
      </p>

      {/* Screen Reader Announcements */}
      <div
        id="email-announcer"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Clear All Button */}
      {emails.length > 0 && (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange([]);
              announceToScreenReader("All emails cleared");
            }}
            className="text-xs"
          >
            Clear All ({emails.length})
          </Button>
        </div>
      )}
    </div>
  );
};
