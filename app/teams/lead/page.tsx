"use client";

import React, { useState, useEffect } from "react";
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

interface Team {
  id: string;
  name: string;
  description?: string;
  project?: string;
  ownerId: string;
  _count?: {
    members: number;
    worklogs: number;
  };
}

export default function LeadTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/teams/owned");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err: unknown) {
      console.error("Error fetching teams:", err);
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = (teamId: string) => {
    // Refresh the teams list
    fetchTeams();
    // Navigate to the new team
    router.push(`/teams/lead/${teamId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">
          Loading your teams...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchTeams} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaUsers className="text-blue-600" />
            My Teams (Team Lead)
          </h1>
          <p className="text-gray-600 mt-1">
            Manage teams you own and create new ones
          </p>
        </div>
        <Button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2"
          size="lg"
        >
          <FaPlus />
          Create New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FaUsers className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first team to start managing worklogs and members
            </p>
            <Button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 mx-auto"
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
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(`/teams/lead/${team.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  <FaUsers className="text-blue-600" />
                  {team.name}
                </CardTitle>
                {team.project && (
                  <CardDescription className="text-sm">
                    Project: {team.project}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
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
                    className="flex-1"
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
