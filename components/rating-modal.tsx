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
import { FormField } from "@/components/forms/form-field";
import { ErrorState } from "@/components/states/error-state";
import { StarRating } from "@/components/ui/star-rating";
import { Star, Check, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCreateRating, useUpdateRating } from "@/lib/hooks/use-ratings";
import { useUpdateWorklogStatus } from "@/lib/hooks/use-worklogs";
import { cn } from "@/lib/utils";

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
  const [error, setError] = React.useState<string | null>(null);
  const [markAsGraded, setMarkAsGraded] = React.useState(false);

  const { mutateAsync: createRating } = useCreateRating();
  const { mutateAsync: updateRating } = useUpdateRating(
    existingRating?.id || "",
  );
  const { mutateAsync: updateWorklogStatus } = useUpdateWorklogStatus();

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

    const processRating = async () => {
      setError(null);

      if (isEditing) {
        await updateRating({
          value: ratingValue,
          comment: comment || undefined,
        });
      } else {
        await createRating({
          worklogId,
          value: ratingValue,
          comment: comment || undefined,
        });
      }

      // Optionally mark as graded
      if (markAsGraded && canMarkAsGraded) {
        await updateWorklogStatus({
          worklogId,
          newStatus: "GRADED",
        });
      }

      return { success: true };
    };

    toast.promise(processRating(), {
      loading: isEditing ? "Updating rating..." : "Submitting rating...",
      success: () => {
        onOpenChange(false);
        onSuccess?.();
        return isEditing
          ? "Rating updated successfully"
          : "Rating submitted successfully";
      },
      error: (err) => {
        const message =
          err instanceof Error ? err.message : "Failed to save rating";
        setError(message);
        return message;
      },
    });
  };

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--panel-strong)] border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <Star className="h-4 w-4 text-blue-400" />
            </div>
            {isEditing ? "Edit Rating" : "Rate Worklog"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {worklogTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 pt-1">
          {error && <ErrorState message={error} className="py-3" />}

          {/* Star Rating */}
          <FormField label="Rating" required htmlFor="star-rating">
            <StarRating
              id="star-rating"
              value={ratingValue}
              onChange={setRatingValue}
              size="lg"
            />
          </FormField>

          {/* Visual Divider */}
          <div className="border-t border-white/5" />

          {/* Comment */}
          <FormField
            label="Feedback"
            htmlFor="rating-comment"
            helpText={`${remainingChars} characters remaining`}
          >
            <Textarea
              id="rating-comment"
              value={comment}
              onChange={(e) =>
                setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))
              }
              placeholder="Add feedback or comments about this worklog..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none focus:border-blue-500/50 focus:ring-blue-500/30"
              rows={4}
              aria-describedby="comment-hint"
            />
            <p id="comment-hint" className="sr-only">
              Optional feedback, maximum {MAX_COMMENT_LENGTH} characters
            </p>
          </FormField>

          {/* Mark as Graded checkbox */}
          {canMarkAsGraded && (
            <>
              <div className="border-t border-white/5" />
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  "bg-white/5 border border-white/10",
                  "hover:bg-white/10",
                  markAsGraded && "border-green-500/30 bg-green-500/5",
                )}
              >
                <input
                  type="checkbox"
                  checked={markAsGraded}
                  onChange={(e) => setMarkAsGraded(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-green-500 focus:ring-green-500/30 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <span className="text-sm text-white font-medium flex items-center gap-1.5">
                    Mark as Graded
                    <ArrowRight className="h-3 w-3 text-white/40" />
                    <span className="text-green-400 text-xs font-normal">
                      GRADED
                    </span>
                  </span>
                  <p className="text-xs text-white/40 mt-0.5">
                    Advance status from REVIEWED → GRADED after saving
                  </p>
                </div>
              </label>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 font-medium"
              onClick={handleSubmit}
              disabled={ratingValue === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              {isEditing ? "Update Rating" : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
