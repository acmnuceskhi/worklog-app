"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { FaSpinner, FaStar, FaCheck } from "react-icons/fa";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worklogId: string;
  worklogTitle: string;
  worklogStatus: string;
  existingRating?: {
    id: string;
    value: number;
    comment: string | null;
  } | null;
  onSuccess?: () => void;
}

const MAX_COMMENT_LENGTH = 1000;

export function RatingModal({
  open,
  onOpenChange,
  worklogId,
  worklogTitle,
  worklogStatus,
  existingRating,
  onSuccess,
}: RatingModalProps) {
  const [ratingValue, setRatingValue] = React.useState(
    existingRating?.value || 0,
  );
  const [comment, setComment] = React.useState(existingRating?.comment || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [markAsGraded, setMarkAsGraded] = React.useState(false);

  // Reset form when modal opens/closes or existing rating changes
  React.useEffect(() => {
    if (open) {
      setRatingValue(existingRating?.value || 0);
      setComment(existingRating?.comment || "");
      setError(null);
      setMarkAsGraded(false);
    }
  }, [open, existingRating]);

  const isEditing = !!existingRating;
  const canMarkAsGraded = worklogStatus === "REVIEWED";

  const handleSubmit = async () => {
    if (ratingValue === 0) {
      setError("Please select a rating");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing) {
        // Update existing rating
        const response = await fetch(`/api/ratings/${existingRating.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: ratingValue,
            comment: comment || undefined,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Failed to update rating");
        }
      } else {
        // Create new rating
        const response = await fetch(`/api/worklogs/${worklogId}/ratings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: ratingValue,
            comment: comment || undefined,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Failed to create rating");
        }
      }

      // Optionally mark as graded
      if (markAsGraded && canMarkAsGraded) {
        const statusResponse = await fetch(
          `/api/worklogs/${worklogId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "GRADED" }),
          },
        );

        if (!statusResponse.ok) {
          console.error("Failed to mark as graded, but rating was saved");
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FaStar className="text-yellow-400" />
            {isEditing ? "Edit Rating" : "Rate Worklog"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {worklogTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {error && (
            <div
              className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              Rating <span className="text-red-400">*</span>
            </Label>
            <StarRating
              value={ratingValue}
              onChange={setRatingValue}
              size="lg"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="rating-comment" className="text-slate-200">
                Comment{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <span
                className={`text-xs ${
                  remainingChars < 100 ? "text-yellow-400" : "text-slate-500"
                }`}
              >
                {remainingChars} characters remaining
              </span>
            </div>
            <Textarea
              id="rating-comment"
              value={comment}
              onChange={(e) =>
                setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))
              }
              placeholder="Add feedback or comments about this worklog..."
              className="bg-slate-700/50 border-slate-600 text-white resize-none"
              rows={4}
              aria-describedby="comment-hint"
            />
            <p id="comment-hint" className="sr-only">
              Optional feedback, maximum {MAX_COMMENT_LENGTH} characters
            </p>
          </div>

          {/* Mark as Graded checkbox */}
          {canMarkAsGraded && (
            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors">
              <input
                type="checkbox"
                checked={markAsGraded}
                onChange={(e) => setMarkAsGraded(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-green-500 focus:ring-green-500 focus:ring-offset-slate-800"
              />
              <div>
                <span className="text-sm text-white font-medium">
                  Mark as Graded
                </span>
                <p className="text-xs text-slate-400">
                  Change status from REVIEWED to GRADED after rating
                </p>
              </div>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-600"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-medium"
              onClick={handleSubmit}
              disabled={ratingValue === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  {isEditing ? "Update Rating" : "Submit Rating"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
