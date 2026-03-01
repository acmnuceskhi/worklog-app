"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  maxRating?: number;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** HTML id – enables `<label htmlFor=…>` association */
  id?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  onChange,
  maxRating = 10,
  readOnly = false,
  size = "md",
  className,
  id,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const starsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  const focusStar = (rating: number) => {
    const index = rating - 1;
    if (index >= 0 && index < maxRating && starsRef.current[index]) {
      starsRef.current[index]?.focus();
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    rating: number,
  ) => {
    if (readOnly) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        if (rating < maxRating) {
          focusStar(rating + 1);
        }
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        if (rating > 1) {
          focusStar(rating - 1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        onChange?.(rating);
        break;
      case "Home":
        event.preventDefault();
        focusStar(1);
        break;
      case "End":
        event.preventDefault();
        focusStar(maxRating);
        break;
    }
  };

  const displayValue = hoveredRating || value;

  if (readOnly) {
    return (
      <div
        className={cn("flex items-center gap-0.5", className)}
        role="img"
        aria-label={`Rating: ${value} out of ${maxRating} stars`}
      >
        {Array.from({ length: maxRating }, (_, i) => {
          const rating = i + 1;
          const isActive = rating <= value;

          return (
            <span key={rating} className="inline-flex">
              {isActive ? (
                <Star
                  className={cn(sizeClasses[size], "text-yellow-400")}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              ) : (
                <Star
                  className={cn(sizeClasses[size], "text-slate-500")}
                  aria-hidden="true"
                />
              )}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cn("flex items-center gap-0.5", className)}
      role="radiogroup"
      aria-label="Rate this worklog"
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const rating = i + 1;
        const isActive = rating <= displayValue;
        const isSelected = rating === value;

        return (
          <button
            key={rating}
            ref={(el) => {
              starsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
            onClick={() => onChange?.(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(0)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            tabIndex={isSelected || (value === 0 && rating === 1) ? 0 : -1}
            className={cn(
              "inline-flex p-0.5 rounded transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-1 focus:ring-offset-slate-800",
              "hover:scale-110",
              isActive
                ? "text-yellow-400"
                : "text-slate-500 hover:text-slate-400",
            )}
          >
            {isActive ? (
              <Star
                className={sizeClasses[size]}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
            ) : (
              <Star className={sizeClasses[size]} aria-hidden="true" />
            )}
          </button>
        );
      })}
      <span className="ml-2 text-sm text-slate-400" aria-live="polite">
        {displayValue > 0 ? `${displayValue}/${maxRating}` : "Select rating"}
      </span>
    </div>
  );
}
