"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaBuilding,
  FaUsers,
  FaPlus,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <FaSpinner className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-muted">Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchOrganizations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalTeams = organizations.reduce(
    (sum, org) => sum + org._count.teams,
    0,
  );
  const totalCredits = organizations.reduce((sum, org) => sum + org.credits, 0);

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
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {totalCredits} credits
                </span>
              </div>
            )}
          </div>
          <Link href="/organizations/create">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20">
              <FaPlus className="h-4 w-4" />
              Create Organization
            </button>
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
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <FaPlus className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {organizations.reduce((sum, org) => sum + org.credits, 0)}
                </p>
                <p className="text-muted">Total Credits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <FaBuilding className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No organizations yet
            </h3>
            <p className="text-muted mb-6">
              Create your first organization to get started
            </p>
            <Link href="/organizations/create">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20">
                Create Organization
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Link key={org.id} href={`/organizations/${org.id}`}>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group shadow-lg shadow-black/20 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <FaBuilding className="h-6 w-6 text-white" />
                    </div>
                    <FaArrowRight className="h-5 w-5 text-muted group-hover:text-white transition-colors" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="text-muted text-sm mb-4 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <FaUsers className="h-4 w-4" />
                      <span>{org._count.teams} teams</span>
                    </div>
                    <div className="text-muted">{org.credits} credits</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
