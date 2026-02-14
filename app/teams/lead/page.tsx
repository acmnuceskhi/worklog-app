"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TeamCreationWizard } from "@/components/teams/team-creation-wizard";
import { FaPlus, FaUsers, FaSpinner, FaCog } from "react-icons/fa";
import { useOwnedTeams } from "@/lib/hooks";

export default function LeadTeamsPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);

  const { data: teams = [], isLoading, error, refetch } = useOwnedTeams();

  const handleTeamCreated = (teamId: string) => {
    // Refetch owned teams after creation
    refetch();
    // Navigate to the new team
    router.push(`/teams/lead/${teamId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-400" />
        <span className="ml-3 text-lg text-muted">Loading your teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-500/40 bg-white/5 backdrop-blur-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-300">
              {error instanceof Error ? error.message : "Failed to load teams"}
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMembers = teams.reduce(
    (sum, team) => sum + (team._count?.members || 0),
    0,
  );
  const totalWorklogs = teams.reduce(
    (sum, team) => sum + (team._count?.worklogs || 0),
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FaUsers className="text-blue-400" />
            My Teams (Team Lead)
          </h1>
          <p className="text-muted mt-1">
            Manage teams you own and create new ones
          </p>
          {teams.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {teams.length} teams
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {totalMembers} members
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {totalWorklogs} worklogs
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          size="lg"
        >
          <FaPlus />
          Create New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
          <CardContent className="pt-12 pb-12 text-center">
            <FaUsers className="mx-auto text-6xl text-white/40 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No teams yet
            </h3>
            <p className="text-muted mb-6">
              Create your first team to start managing worklogs and members
            </p>
            <Button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <FaPlus />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer group border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl transition-all"
              onClick={() => router.push(`/teams/lead/${team.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white group-hover:text-blue-300 transition-colors">
                  <FaUsers className="text-blue-400" />
                  {team.name}
                </CardTitle>
                {team.project && (
                  <CardDescription className="text-sm text-white/70">
                    Project: {team.project}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-muted mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>
                    {team._count?.members || 0} member
                    {team._count?.members !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {team._count?.worklogs || 0} worklog
                    {team._count?.worklogs !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/20 text-white/80 hover:text-white hover:border-white/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/teams/lead/${team.id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/80 hover:text-white hover:border-white/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open team settings modal
                      alert("Team settings coming soon!");
                    }}
                    aria-label={`Settings for ${team.name}`}
                  >
                    <FaCog />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Creation Wizard */}
      <TeamCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleTeamCreated}
      />
    </div>
  );
}
