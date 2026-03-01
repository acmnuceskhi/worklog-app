"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";

interface DebugTeam {
  id: string;
  name: string;
  role: "owner" | "member";
  _count: {
    members: number;
    worklogs: number;
  };
}

export default function DebugPage() {
  const {
    data: teamsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["accessible-teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams/accessible");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      return response.json();
    },
    enabled: process.env.NODE_ENV !== "production",
  });

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Not Found</h1>
        <p>This page is not available in production.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug - Accessible Teams</h1>
        <LoadingState text="Loading teams..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug - Accessible Teams</h1>
        <ErrorState title="Error" message={error.message} />
      </div>
    );
  }

  const teams: DebugTeam[] = teamsData?.data || [];
  const meta = teamsData?.meta || {};

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Accessible Teams</h1>
      <p className="mb-4">
        Total teams: {meta.total} (Owned: {meta.owned}, Member: {meta.member})
      </p>

      {teams.length === 0 ? (
        <p>
          No teams found. You may need to seed the database or create teams
          first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="border border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">{team.name}</CardTitle>
                <p className="text-sm text-muted">Role: {team.role}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-2">
                  ID:{" "}
                  <code className="bg-black/20 px-1 rounded">{team.id}</code>
                </p>
                <p className="text-sm text-muted mb-2">
                  Members: {team._count?.members || 0}
                </p>
                <p className="text-sm text-muted mb-4">
                  Worklogs: {team._count?.worklogs || 0}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/teams/member/${team.id}`}>Member View</Link>
                  </Button>
                  {team.role === "owner" && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/teams/lead/${team.id}`}>Lead View</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/home">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teams/organisations">Organizations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
