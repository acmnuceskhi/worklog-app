"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TeamCreationWizard } from "@/components/teams/team-creation-wizard";
import { FaPlus, FaUsers, FaCog } from "react-icons/fa";
import { useOwnedTeams } from "@/lib/hooks";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityList } from "@/components/entities/entity-list";

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
    return <LoadingState text="Loading your teams..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load teams"
        }
        onRetry={() => refetch()}
      />
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
            Teams I Lead
          </h1>
          <p className="text-muted mt-1">
            Manage your teams, review worklogs, and invite new members
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
        <Button onClick={() => setShowWizard(true)} variant="primary" size="lg">
          <FaPlus />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          title="Ready to lead your first team?"
          description="Create a team to start collaborating with members and tracking their worklogs"
          icon={<FaUsers className="h-8 w-8" />}
          action={{
            label: "Create Team",
            onClick: () => setShowWizard(true),
          }}
        />
      ) : (
        <EntityList title="Your Teams" count={teams.length} layout="grid">
          {teams.map((team) => (
            <EntityCard
              key={team.id}
              title={team.name}
              subtitle={team.project ? `Project: ${team.project}` : undefined}
              avatar={<FaUsers className="text-blue-400" />}
              stats={[
                { label: "Members", value: team._count?.members || 0 },
                { label: "Worklogs", value: team._count?.worklogs || 0 },
              ]}
              onClick={() => router.push(`/teams/lead/${team.id}`)}
              className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl"
            >
              {team.description && (
                <p className="text-sm text-muted line-clamp-2">
                  {team.description}
                </p>
              )}
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
                    alert("Team settings coming soon!");
                  }}
                  aria-label={`Settings for ${team.name}`}
                >
                  <FaCog />
                </Button>
              </div>
            </EntityCard>
          ))}
        </EntityList>
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
