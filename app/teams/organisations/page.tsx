"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBuilding, FaUsers, FaPlus, FaArrowRight } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityList } from "@/components/entities/entity-list";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  teams: {
    id: string;
    name: string;
  }[];
  _count: {
    teams: number;
  };
}

export default function OrganisationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const data = await response.json();
      setOrganizations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading organizations..." fullPage />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOrganizations} fullPage />;
  }

  const totalTeams = organizations.reduce(
    (sum, org) => sum + org._count.teams,
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              My Organizations
            </h1>
            <p className="text-muted">
              Manage your organizations and their teams
            </p>
            {organizations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {organizations.length} organizations
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {totalTeams} teams
                </span>
              </div>
            )}
          </div>
          <Link href="/organizations/create">
            <Button variant="primary" size="lg">
              <FaPlus className="h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <FaBuilding className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {organizations.length}
                </p>
                <p className="text-muted">Organizations</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <FaUsers className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {organizations.reduce(
                    (sum, org) => sum + org._count.teams,
                    0,
                  )}
                </p>
                <p className="text-muted">Total Teams</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20 flex items-center justify-center text-muted italic text-sm">
            More stats coming soon...
          </div>
        </div>

        {/* Organizations Grid */}
        {organizations.length === 0 ? (
          <EmptyState
            title="Start building your organization"
            description="Create an organization to group your teams and manage them at scale"
            icon={<FaBuilding className="h-8 w-8" />}
            action={{
              label: "Create Organization",
              onClick: () => (window.location.href = "/organizations/create"),
            }}
          />
        ) : (
          <EntityList
            title="Your Organizations"
            count={organizations.length}
            layout="grid"
          >
            {organizations.map((org) => (
              <Link key={org.id} href={`/organizations/${org.id}`}>
                <EntityCard
                  title={org.name}
                  subtitle={org.description || undefined}
                  avatar={
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <FaBuilding className="h-6 w-6 text-white" />
                    </div>
                  }
                  actions={
                    <FaArrowRight className="h-5 w-5 text-muted group-hover:text-white transition-colors" />
                  }
                  stats={[{ label: "Teams", value: org._count.teams }]}
                  className="backdrop-blur-md shadow-lg shadow-black/20 hover:-translate-y-1 group"
                />
              </Link>
            ))}
          </EntityList>
        )}
      </div>
    </div>
  );
}
