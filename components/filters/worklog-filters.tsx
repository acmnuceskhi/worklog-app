"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { parseDeadline, toLocalDateString } from "@/lib/dates";
import { SlidersHorizontal, X } from "lucide-react";

export type WorklogSortBy = "date" | "status";
export type WorklogSortDir = "asc" | "desc";

export interface WorklogFilterState {
  search: string;
  status: string;
  teamId: string;
  dateFrom: string;
  dateTo: string;
  sortBy: WorklogSortBy;
  sortDir: WorklogSortDir;
}

interface TeamOption {
  id: string;
  name: string;
}

interface WorklogFiltersProps {
  value: WorklogFilterState;
  onChange: (_: WorklogFilterState) => void;
  onReset?: () => void;
  teamOptions: TeamOption[];
}

export function WorklogFilters({
  value,
  onChange,
  onReset,
  teamOptions,
}: WorklogFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const update = (partial: Partial<WorklogFilterState>) => {
    onChange({ ...value, ...partial });
  };

  const hasActiveFilters =
    value.status || value.teamId || value.dateFrom || value.dateTo;

  return (
    <div className="space-y-3">
      {/* Search row — always visible */}
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <Label
            htmlFor="worklog-search"
            className="dark:text-slate-300 text-slate-600"
          >
            Search
          </Label>
          <Input
            id="worklog-search"
            value={value.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Title or description"
            className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="dark:border-slate-600 border-gray-300 dark:text-slate-200 text-slate-700 md:hidden"
            onClick={() => setFiltersOpen((p) => !p)}
            aria-expanded={filtersOpen}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="ml-1 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Detailed filters — always visible on md+, toggleable on mobile */}
      <div className={`space-y-3 ${filtersOpen ? "block" : "hidden"} md:block`}>
        <div className="flex flex-wrap gap-3">
          <div className="w-full sm:min-w-[180px] sm:w-auto sm:flex-1">
            <Label
              htmlFor="worklog-team"
              className="dark:text-slate-300 text-slate-600"
            >
              Team
            </Label>
            <Select
              value={value.teamId || "all"}
              onValueChange={(next) =>
                update({ teamId: next === "all" ? "" : next })
              }
            >
              <SelectTrigger
                id="worklog-team"
                className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
              >
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 bg-white dark:border-slate-700 border-gray-200">
                <SelectItem value="all">All teams</SelectItem>
                {teamOptions.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:min-w-[160px] sm:w-auto">
            <Label
              htmlFor="worklog-status"
              className="dark:text-slate-300 text-slate-600"
            >
              Status
            </Label>
            <Select
              value={value.status || "all"}
              onValueChange={(next) =>
                update({ status: next === "all" ? "" : next })
              }
            >
              <SelectTrigger
                id="worklog-status"
                className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 bg-white dark:border-slate-700 border-gray-200">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="STARTED">Started</SelectItem>
                <SelectItem value="HALF_DONE">Halfway Done</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="w-[calc(50%-6px)] sm:min-w-[160px] sm:w-auto">
            <Label
              htmlFor="worklog-date-from"
              className="dark:text-slate-300 text-slate-600"
            >
              From
            </Label>
            <DatePicker
              id="worklog-date-from"
              value={parseDeadline(value.dateFrom) ?? undefined}
              onChange={(date) =>
                update({ dateFrom: date ? toLocalDateString(date) : "" })
              }
              placeholder="Start date"
              maxDate={parseDeadline(value.dateTo) ?? undefined}
            />
          </div>
          <div className="w-[calc(50%-6px)] sm:min-w-[160px] sm:w-auto">
            <Label
              htmlFor="worklog-date-to"
              className="dark:text-slate-300 text-slate-600"
            >
              To
            </Label>
            <DatePicker
              id="worklog-date-to"
              value={parseDeadline(value.dateTo) ?? undefined}
              onChange={(date) =>
                update({ dateTo: date ? toLocalDateString(date) : "" })
              }
              placeholder="End date"
              minDate={parseDeadline(value.dateFrom) ?? undefined}
            />
          </div>
          <div className="w-[calc(50%-6px)] sm:min-w-[160px] sm:w-auto">
            <Label
              htmlFor="worklog-sort"
              className="dark:text-slate-300 text-slate-600"
            >
              Sort by
            </Label>
            <Select
              value={value.sortBy}
              onValueChange={(next) =>
                update({ sortBy: next as WorklogSortBy })
              }
            >
              <SelectTrigger
                id="worklog-sort"
                className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 bg-white dark:border-slate-700 border-gray-200">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[calc(50%-6px)] sm:min-w-[140px] sm:w-auto">
            <Label
              htmlFor="worklog-direction"
              className="dark:text-slate-300 text-slate-600"
            >
              Direction
            </Label>
            <Select
              value={value.sortDir}
              onValueChange={(next) =>
                update({ sortDir: next as WorklogSortDir })
              }
            >
              <SelectTrigger
                id="worklog-direction"
                className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
              >
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 bg-white dark:border-slate-700 border-gray-200">
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="dark:border-slate-600 border-gray-300 dark:text-slate-200 text-slate-700"
              onClick={onReset}
            >
              <X className="h-4 w-4 mr-1 sm:hidden" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
