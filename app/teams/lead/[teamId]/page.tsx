"use client";

import React from "react";
import { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import { Lobster_Two } from "next/font/google";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GanttChart } from "@/components/GanttChart";
import { DatePicker } from "@/components/ui/date-picker";

const lobster = Lobster_Two({ weight: "400", subsets: ["latin"] });

const teamDetails: { [key: string]: any } = {
  "1": {
    name: "Alpha Squad",
    leader: "Alice",
    members: [
      { name: "Ali", contribution: "Backend APIs", rating: 8 },
      { name: "Sara", contribution: "UI / UX Design", rating: 9 },
      { name: "Ahmed", contribution: "Database Design", rating: 7 },
      { name: "Zara", contribution: "Testing & QA", rating: 6 },
    ]
  },
  "2": {
    name: "Design Gurus",
    leader: "Bob",
    members: [
      { name: "John", contribution: "Graphic Design", rating: 9 },
      { name: "Emma", contribution: "Web Design", rating: 8 },
      { name: "Tom", contribution: "Prototyping", rating: 7 },
    ]
  },
  "3": {
    name: "Product Masters",
    leader: "Charlie",
    members: [
      { name: "Lisa", contribution: "Product Strategy", rating: 9 },
      { name: "Mark", contribution: "Market Research", rating: 8 },
    ]
  },
  "4": {
    name: "Dev Ninjas",
    leader: "David",
    members: [
      { name: "Chris", contribution: "Full Stack Dev", rating: 9 },
      { name: "Nina", contribution: "DevOps", rating: 8 },
      { name: "Sam", contribution: "Security", rating: 7 },
    ]
  }
};

export default function TeamDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  const resolvedParams = (React as any).use ? (React as any).use(params) : params;
  const teamId = resolvedParams?.teamId ?? params?.teamId;
  const team = teamDetails[teamId] || { name: "Unknown", leader: "N/A", members: [] };
  
  const [teamData, setTeamData] = useState(team.members);
  const [tasks, setTasks] = useState<any[]>([
    { id: 1, assignedTo: "Ali", title: "API Documentation", status: "Halfway done", deadline: "2025-02-10", progress: 60 },
    { id: 2, assignedTo: "Sara", title: "UI Mockups", status: "Initial stage", deadline: "2025-02-15", progress: 20 },
    { id: 3, assignedTo: "Ahmed", title: "Database Schema", status: "Completed", deadline: "2025-02-08", progress: 100 },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", assignedTo: "", deadline: "" });

  // Check if deadline passed
  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

  const setRating = (index: number, value: number) => {
    const updated = [...teamData];
    updated[index].rating = Math.max(0, value);
    setTeamData(updated);
  };

  const handleAssignTask = () => {
    if (newTask.title && newTask.assignedTo && newTask.deadline) {
      setTasks([...tasks, {
        id: tasks.length + 1,
        assignedTo: newTask.assignedTo,
        title: newTask.title,
        status: "Initial stage",
        deadline: newTask.deadline,
        progress: 0
      }]);
      setNewTask({ title: "", assignedTo: "", deadline: "" });
      setShowModal(false);
    }
  };

  const updateTaskStatus = (taskId: number, newStatus: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const progressMap: Record<string, number> = { "Initial stage": 20, "Halfway done": 60, "Completed": 100 };
        return { ...t, status: newStatus, progress: progressMap[newStatus] || 0 };
      }
      return t;
    });
    setTasks(updated);
  };

  // Ranking logic
  const rankedUsers = [...teamData].sort((a, b) => b.rating - a.rating);

  return (
    <div className="p-3 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Contributions & Tasks Card */}
      <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-amber-500">{team.name} - Team Contributions</CardTitle>
              <CardDescription className="text-gray-300 mt-1">Led by: {team.leader}</CardDescription>
            </div>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold flex items-center gap-2"
            >
              <FaPlus /> Assign Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-amber-500">
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">Name</th>
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">Contribution</th>
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">Assigned Tasks</th>
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {teamData.map((member: any, index: number) => {
                  const memberTasks = tasks.filter(t => t.assignedTo === member.name);
                  return (
                    <tr key={index} className="border-b border-amber-500/10 hover:bg-blue-800/50 transition-colors">
                      <td className="py-3 px-2 text-gray-200">{member.name}</td>
                      <td className="py-3 px-2 text-gray-300">{member.contribution}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1">
                          {memberTasks.length > 0 ? (
                            memberTasks.map(t => (
                              <div key={t.id} className="text-xs text-gray-400">
                                <strong className="text-amber-400">{t.title}</strong> - {t.status}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No tasks</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <span
                              key={star}
                              className="cursor-pointer text-sm transition-transform hover:scale-110"
                              style={{ color: star <= member.rating ? "#FFD700" : "#555" }}
                              onClick={() => setRating(index, star)}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-amber-500 font-semibold text-sm">{member.rating}/10</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List Card */}
      <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-amber-500">Active Tasks & Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.map((task: any) => {
              const isPastDeadline = isDeadlinePassed(task.deadline) && task.status !== "Completed";
              return (
                <div 
                  key={task.id} 
                  className={`bg-blue-950/80 p-4 rounded-lg border-2 transition-all ${
                    isPastDeadline 
                      ? 'border-red-500 shadow-lg shadow-red-500/30 bg-red-950/40' 
                      : 'border-amber-500/30 hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-amber-500">{task.title}</strong>
                    <span className={`text-xs font-semibold ${isPastDeadline ? 'text-red-400' : 'text-gray-400'}`}>
                      {task.deadline}
                      {isPastDeadline && ' ⚠️'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Assigned to: <strong className="text-amber-400">{task.assignedTo}</strong>
                  </p>
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">Status:</div>
                    <div className="px-3 py-1 rounded border border-amber-500 bg-blue-900 text-amber-500 text-xs font-semibold text-center">
                      {task.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Progress: <strong className="text-amber-500">{task.progress}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rankings Card */}
      <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-amber-500">User Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-amber-500">
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">#</th>
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">Name</th>
                  <th className="text-left py-3 px-2 text-amber-500 font-bold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {rankedUsers.map((user: any, i: number) => (
                  <tr key={i} className="border-b border-amber-500/10 hover:bg-blue-800/50 transition-colors">
                    <td className="py-3 px-2"><strong className="text-pink-500">{i + 1}</strong></td>
                    <td className="py-3 px-2 text-gray-200">{user.name}</td>
                    <td className="py-3 px-2"><strong className="text-amber-500">{user.rating}/10</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart - Timeline View */}
      <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-amber-500">Task Timeline & Progress</CardTitle>
          <CardDescription className="text-gray-300">Complete view of task deadlines, progress, and team member workload</CardDescription>
        </CardHeader>
        <CardContent>
          <GanttChart tasks={tasks} teamMembers={teamData} />
        </CardContent>
      </Card>

      {/* Task Assignment Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-blue-950 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-amber-500">Assign Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-amber-500 mb-2 block">Task Title</Label>
              <Input
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-blue-900 border-amber-500/30 text-amber-500 placeholder:text-amber-500/50"
              />
            </div>

            <div>
              <Label className="text-amber-500 mb-2 block">Assign to Member</Label>
              <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}>
                <SelectTrigger className="bg-blue-900 border-amber-500/30 text-amber-500">
                  <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent className="bg-blue-950 border-amber-500/30">
                  {team.members.map((m: any) => (
                    <SelectItem key={m.name} value={m.name} className="text-amber-500">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-amber-500 mb-2 block">Deadline</Label>
              <DatePicker
                value={newTask.deadline ? new Date(newTask.deadline) : undefined}
                onChange={(date) => setNewTask({ ...newTask, deadline: date ? date.toISOString().split('T')[0] : "" })}
                placeholder="Select deadline"
              />
            </div>

            <Button
              onClick={handleAssignTask}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
