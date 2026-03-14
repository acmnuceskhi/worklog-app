import * as React from "react";
import { format, isValid, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Prevent selecting dates before today */
  disablePast?: boolean;
  /** Prevent selecting dates after today */
  disableFuture?: boolean;
  /** Earliest selectable date */
  minDate?: Date;
  /** Latest selectable date */
  maxDate?: Date;
  className?: string;
  /** HTML id – enables `<label htmlFor=…>` association */
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  error,
  disabled = false,
  disablePast = false,
  disableFuture = false,
  minDate,
  maxDate,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Build a matcher for react-day-picker v9 `disabled` prop
  const disabledMatcher = React.useMemo(() => {
    const matchers: Array<
      { before: Date } | { after: Date } | ((date: Date) => boolean)
    > = [];

    if (disablePast) {
      matchers.push({ before: startOfToday() });
    }
    if (disableFuture) {
      matchers.push({ after: startOfToday() });
    }
    if (minDate) {
      matchers.push({ before: minDate });
    }
    if (maxDate) {
      matchers.push({ after: maxDate });
    }

    return matchers.length > 0 ? matchers : undefined;
  }, [disablePast, disableFuture, minDate, maxDate]);

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      setOpen(false);
    },
    [onChange],
  );

  const isError = !!error;
  const displayValue =
    value && isValid(value) ? format(value, "PPP") : undefined;

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            data-empty={!value}
            aria-label={`Select date. Current selection: ${displayValue ?? placeholder}`}
            aria-invalid={isError}
            aria-describedby={isError ? "date-picker-error" : undefined}
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-200",
              "dark:bg-white/5 bg-white dark:border-white/20 border-gray-300 dark:text-white text-gray-900",
              "dark:hover:bg-white/10 hover:bg-gray-50 dark:hover:border-white/30 hover:border-gray-400",
              "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400",
              "dark:data-[empty=true]:text-white/40 data-[empty=true]:text-gray-400",
              "backdrop-blur-sm",
              isError && "border-red-500/60 focus:ring-red-500/50",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5 dark:text-white/50 text-gray-400" />
            <span className="truncate">
              {displayValue ?? <span>{placeholder}</span>}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-auto p-0 rounded-lg",
            "shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
          align="start"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={disabledMatcher}
            defaultMonth={value}
            className="rounded-lg"
          />
        </PopoverContent>
      </Popover>
      {isError && (
        <div
          id="date-picker-error"
          className="flex items-center mt-2 text-sm text-red-400"
          role="alert"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
