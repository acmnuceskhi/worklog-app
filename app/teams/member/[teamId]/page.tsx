"use client";

import React, { use } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AssignedTask {
  id: number;
  title: string;
  status: string;
  deadline: string;
  progress: number;
}

interface TeamDetails {
  name: string;
  leader: string;
}

const memberTeamDetails: Record<string, TeamDetails> = {
  "101": { name: "Marketing Team", leader: "alice@example.com" },
  "102": { name: "Design Team", leader: "bob@example.com" },
  "103": { name: "Product Team", leader: "leader@company.com" },
};

export default function ContributionFlashcardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const team = memberTeamDetails[teamId] || {
    name: "Unknown Team",
    leader: "N/A",
  };

  const [contribution, setContribution] = useState("");
  const [submittedContributions, setSubmittedContributions] = useState<
    { text: string; timestamp: string }[]
  >([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([
    {
      id: 1,
      title: "API Documentation",
      status: "Halfway done",
      deadline: "2025-02-10",
      progress: 60,
    },
    {
      id: 2,
      title: "Database Schema",
      status: "Initial stage",
      deadline: "2025-02-15",
      progress: 20,
    },
  ]);

  const handleSubmit = () => {
    if (!contribution.trim()) {
      alert("Please enter your contribution!");
      return;
    }
    const timestamp = new Date().toLocaleString();
    setSubmittedContributions([
      ...submittedContributions,
      { text: contribution, timestamp },
    ]);
    setContribution("");
    alert("✅ Contribution submitted successfully!");
  };

  const updateTaskStatus = (taskId: number, newStatus: string) => {
    const statusProgress = {
      "Initial stage": 20,
      "Halfway done": 60,
      Completed: 100,
    };
    const updated = assignedTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: newStatus,
            progress:
              statusProgress[newStatus as keyof typeof statusProgress] || 0,
          }
        : t,
    );
    setAssignedTasks(updated);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-3">
      {/* Main Layout: Contribution on left, Tasks on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contribution Section - Larger */}
        <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-amber-500 text-xl">
              ADD YOUR WORK
            </CardTitle>
            <CardDescription className="text-center text-amber-500 mt-2">
              {team.name} • Led by: {team.leader}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <Textarea
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder="Describe your work, achievements, and contributions..."
              className="bg-blue-900 border-amber-500/30 text-amber-500 placeholder:text-amber-500/50 min-h-40 flex-1"
            />
            <Button
              onClick={handleSubmit}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Submit Contribution
            </Button>
          </CardContent>
        </Card>

        {/* Assigned Tasks Section - Right side */}
        <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-500">Your Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedTasks.length > 0 ? (
                assignedTasks.map((task: AssignedTask) => (
                  <div
                    key={task.id}
                    className="bg-blue-950 p-3 rounded-lg border border-amber-500/20"
                  >
                    <div className="mb-3">
                      <h4 className="m-0 text-amber-500 font-semibold text-sm">
                        {task.title}
                      </h4>
                      <p className="m-0 text-xs text-gray-400 mt-1">
                        Due: <strong>{task.deadline}</strong>
                      </p>
                    </div>

                    <div className="mb-3">
                      <Label className="text-xs text-gray-400 block mb-2">
                        Status:
                      </Label>
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          updateTaskStatus(task.id, value)
                        }
                      >
                        <SelectTrigger className="bg-blue-900 border-amber-500/30 text-amber-500 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-950 border-amber-500/30">
                          <SelectItem
                            value="Initial stage"
                            className="text-amber-500"
                          >
                            Initial stage
                          </SelectItem>
                          <SelectItem
                            value="Halfway done"
                            className="text-amber-500"
                          >
                            Halfway done
                          </SelectItem>
                          <SelectItem
                            value="Completed"
                            className="text-amber-500"
                          >
                            Completed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">Progress</div>
                      <div className="w-full h-2 bg-amber-500/10 rounded-full overflow-hidden border border-amber-500/20">
                        <div
                          style={{
                            height: "100%",
                            width: `${task.progress}%`,
                            background:
                              task.progress >= 100
                                ? "#22C55E"
                                : task.progress >= 50
                                  ? "#FFD700"
                                  : "#FF6B6B",
                            transition: "all 0.3s ease",
                          }}
                        />
                      </div>
                      <div className="text-xs text-amber-500 mt-1 text-center font-semibold">
                        {task.progress}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No tasks assigned yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contributions History - Full width below */}
      {submittedContributions.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-500">Your Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {submittedContributions.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-blue-950 p-3 rounded-lg border-l-4 border-amber-500"
                >
                  <p className="m-0 mb-2 text-gray-200 text-sm leading-relaxed">
                    {c.text}
                  </p>
                  <p className="m-0 text-xs text-gray-500 italic">
                    {c.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
