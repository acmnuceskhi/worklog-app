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

export type WorklogSortBy = "date" | "status" | "priority";
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
  onChange: (next: WorklogFilterState) => void;
  onReset?: () => void;
  teamOptions: TeamOption[];
}

export function WorklogFilters({
  value,
  onChange,
  onReset,
  teamOptions,
}: WorklogFiltersProps) {
  const update = (partial: Partial<WorklogFilterState>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Label className="text-slate-300">Search</Label>
          <Input
            value={value.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Title or description"
            className="bg-slate-800/60 border-slate-700 text-white"
          />
        </div>
        <div className="min-w-[180px]">
          <Label className="text-slate-300">Team</Label>
          <Select
            value={value.teamId || "all"}
            onValueChange={(next) =>
              update({ teamId: next === "all" ? "" : next })
            }
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All teams</SelectItem>
              {teamOptions.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Label className="text-slate-300">Status</Label>
          <Select
            value={value.status || "all"}
            onValueChange={(next) =>
              update({ status: next === "all" ? "" : next })
            }
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="STARTED">Started</SelectItem>
              <SelectItem value="HALF_DONE">Half done</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="GRADED">Graded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[160px]">
          <Label className="text-slate-300">From</Label>
          <Input
            type="date"
            value={value.dateFrom}
            onChange={(event) => update({ dateFrom: event.target.value })}
            className="bg-slate-800/60 border-slate-700 text-white"
          />
        </div>
        <div className="min-w-[160px]">
          <Label className="text-slate-300">To</Label>
          <Input
            type="date"
            value={value.dateTo}
            onChange={(event) => update({ dateTo: event.target.value })}
            className="bg-slate-800/60 border-slate-700 text-white"
          />
        </div>
        <div className="min-w-[160px]">
          <Label className="text-slate-300">Sort by</Label>
          <Select
            value={value.sortBy}
            onValueChange={(next) => update({ sortBy: next as WorklogSortBy })}
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px]">
          <Label className="text-slate-300">Direction</Label>
          <Select
            value={value.sortDir}
            onValueChange={(next) =>
              update({ sortDir: next as WorklogSortDir })
            }
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
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
    </div>
  );
}
