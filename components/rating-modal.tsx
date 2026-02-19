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
import { FaStar, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import { useCreateRating, useUpdateRating } from "@/lib/hooks/use-ratings";
import { useUpdateWorklogStatus } from "@/lib/hooks/use-worklogs";

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
          {error && <ErrorState message={error} className="py-3" />}

          {/* Star Rating */}
          <FormField label="Rating" required>
            <StarRating
              value={ratingValue}
              onChange={setRatingValue}
              size="lg"
            />
          </FormField>

          {/* Comment */}
          <FormField
            label="Comment"
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
              className="bg-slate-700/50 border-slate-600 text-white resize-none"
              rows={4}
              aria-describedby="comment-hint"
            />
            <p id="comment-hint" className="sr-only">
              Optional feedback, maximum {MAX_COMMENT_LENGTH} characters
            </p>
          </FormField>

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
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <FaTimes className="mr-2" />
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 font-medium"
              onClick={handleSubmit}
              disabled={ratingValue === 0}
            >
              <FaCheck className="mr-2" />
              {isEditing ? "Update Rating" : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
