"use client";

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

export type TeamSortBy = "name" | "members" | "worklogs" | "teams";
export type TeamSortDir = "asc" | "desc";

export interface TeamFilterState {
  search: string;
  sortBy: TeamSortBy;
  sortDir: TeamSortDir;
}

/** Single sort option rendered in the dropdown */
export interface SortOption {
  value: TeamSortBy;
  label: string;
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "name", label: "Name" },
  { value: "members", label: "Members" },
  { value: "worklogs", label: "Worklogs" },
];

interface TeamFiltersProps {
  value: TeamFilterState;
  onChange: (_: TeamFilterState) => void;
  onReset?: () => void;
  /** Override the default sort-by options (Name / Members / Worklogs) */
  sortOptions?: SortOption[];
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
}

export function TeamFilters({
  value,
  onChange,
  onReset,
  sortOptions = DEFAULT_SORT_OPTIONS,
  searchPlaceholder = "Search teams",
}: TeamFiltersProps) {
  const update = (partial: Partial<TeamFilterState>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="min-w-[220px] flex-1">
        <Label
          htmlFor="team-search"
          className="dark:text-slate-300 text-slate-600"
        >
          Search
        </Label>
        <Input
          id="team-search"
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={searchPlaceholder}
          className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
        />
      </div>
      <div className="min-w-[160px]">
        <Label
          htmlFor="team-sort"
          className="dark:text-slate-300 text-slate-600"
        >
          Sort by
        </Label>
        <Select
          value={value.sortBy}
          onValueChange={(next) => update({ sortBy: next as TeamSortBy })}
        >
          <SelectTrigger
            id="team-sort"
            className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
          >
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-900 bg-white dark:border-slate-700 border-gray-200">
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[140px]">
        <Label
          htmlFor="team-direction"
          className="dark:text-slate-300 text-slate-600"
        >
          Direction
        </Label>
        <Select
          value={value.sortDir}
          onValueChange={(next) => update({ sortDir: next as TeamSortDir })}
        >
          <SelectTrigger
            id="team-direction"
            className="dark:bg-slate-800/60 bg-white dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
          >
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-900 bg-white dark:border-slate-700 border-gray-200">
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
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
          Clear
        </Button>
      </div>
    </div>
  );
}
