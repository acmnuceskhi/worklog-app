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
        <Label className="text-slate-300">Search</Label>
        <Input
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={searchPlaceholder}
          className="bg-slate-800/60 border-slate-700 text-white"
        />
      </div>
      <div className="min-w-[160px]">
        <Label className="text-slate-300">Sort by</Label>
        <Select
          value={value.sortBy}
          onValueChange={(next) => update({ sortBy: next as TeamSortBy })}
        >
          <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[140px]">
        <Label className="text-slate-300">Direction</Label>
        <Select
          value={value.sortDir}
          onValueChange={(next) => update({ sortDir: next as TeamSortDir })}
        >
          <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          className="border-slate-600 text-slate-200"
          onClick={onReset}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
