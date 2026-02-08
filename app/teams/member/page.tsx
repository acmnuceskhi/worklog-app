"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";

interface MemberTeam {
  id: number;
  name: string;
  leader: string;
  society: string;
}

const memberTeams: MemberTeam[] = [
  {
    id: 101,
    name: "Marketing Team",
    leader: "alice@example.com",
    society: "Marketing",
  },
  {
    id: 102,
    name: "Design Team",
    leader: "bob@example.com",
    society: "Design",
  },
  {
    id: 103,
    name: "Product Team",
    leader: "leader@company.com",
    society: "Product",
  },
];

export default function MemberTeamsPage() {
  const router = useRouter();
  const [acceptedTeams] = useState(memberTeams);

  return (
    <div className="p-5 min-h-full space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Member Teams</h1>
          <p className="text-muted">
            Teams you are part of this semester and their leads.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          {acceptedTeams.length} teams
        </div>
      </div>

      {acceptedTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {acceptedTeams.map((t) => (
            <div
              key={t.id}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-md shadow-md transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
              onClick={() => router.push(`/teams/member/${t.id}`)}
            >
              <h3 className="m-0 mb-2 text-lg font-semibold text-white">
                {t.name}
              </h3>
              <p className="m-0 text-muted text-sm">
                <strong>Leader:</strong> {t.leader}
              </p>
              <p className="m-0 text-muted text-sm">
                <strong>Society:</strong> {t.society}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white">
          <FaUsers className="mx-auto mb-4 h-12 w-12 text-white/40" />
          <p className="text-lg font-semibold">No teams joined yet</p>
          <p className="text-muted">
            Accept an invitation to get started with your first worklog.
          </p>
        </div>
      )}
    </div>
  );
}
