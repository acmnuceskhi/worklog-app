"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-transparent group/calendar p-3", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("flex gap-4 flex-col md:flex-row relative", defaults.months),
        month: cn("flex flex-col w-full gap-4", defaults.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaults.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 p-0 opacity-60 hover:opacity-100 select-none",
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 p-0 opacity-60 hover:opacity-100 select-none",
          defaults.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-7 w-full px-7",
          defaults.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-7 gap-1.5",
          defaults.dropdowns,
        ),
        dropdown_root: cn(
          "relative has-focus:border-amber-400 border border-white/20 shadow-xs has-focus:ring-amber-400/50 has-focus:ring-[3px] rounded-md",
          defaults.dropdown_root,
        ),
        dropdown: cn(
          "absolute bg-blue-950 inset-0 opacity-0",
          defaults.dropdown,
        ),
        caption_label: cn(
          "select-none font-medium text-sm",
          defaults.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn(
          "text-amber-500/80 rounded-md flex-1 font-normal text-[0.8rem] select-none w-9",
          defaults.weekday,
        ),
        week: cn("flex w-full mt-2", defaults.week),
        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          "[&:first-child[data-selected=true]_button]:rounded-l-md",
          "[&:last-child[data-selected=true]_button]:rounded-r-md",
          defaults.day,
        ),
        range_start: cn("rounded-l-md bg-amber-500/30", defaults.range_start),
        range_middle: cn("rounded-none", defaults.range_middle),
        range_end: cn("rounded-r-md bg-amber-500/30", defaults.range_end),
        today: cn(
          "bg-amber-500/20 text-amber-300 rounded-md data-[selected=true]:rounded-none",
          defaults.today,
        ),
        outside: cn(
          "text-white/30 opacity-50 aria-selected:bg-amber-500/20 aria-selected:text-white/30",
          defaults.outside,
        ),
        disabled: cn("text-white/30 opacity-50", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootCN, rootRef, ...rootProps }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(rootCN)}
              {...rootProps}
            />
          );
        },
        Chevron: ({ className: chevCN, orientation, ...chevProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4", chevCN)}
                {...chevProps}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", chevCN)}
                {...chevProps}
              />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", chevCN)} {...chevProps} />
          );
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaults = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-amber-500 data-[selected-single=true]:text-white",
        "data-[range-middle=true]:bg-amber-500/20 data-[range-middle=true]:text-amber-300",
        "data-[range-start=true]:bg-amber-500 data-[range-start=true]:text-white",
        "data-[range-end=true]:bg-amber-500 data-[range-end=true]:text-white",
        "group-data-[focused=true]/day:border-amber-400 group-data-[focused=true]/day:ring-amber-400/50",
        "flex aspect-square size-auto w-full min-w-9 flex-col gap-1 leading-none font-normal",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "group-data-[focused=true]/day:ring-[3px]",
        "data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md",
        "data-[range-middle=true]:rounded-none",
        "data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md",
        "hover:bg-amber-500/30 hover:text-amber-300",
        "aria-selected:opacity-100",
        "h-9 w-9 p-0",
        defaults.day,
        className,
      )}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar, CalendarDayButton };
