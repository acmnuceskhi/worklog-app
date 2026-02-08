"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./member.module.css";

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
    <div className="p-5 min-h-full">
      {acceptedTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {acceptedTeams.map((t) => (
            <div
              key={t.id}
              className={`${styles.card} p-4 rounded-xl cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => router.push(`/teams/member/${t.id}`)}
            >
              <h3 className={`${styles.title} m-0 mb-2 text-lg font-semibold`}>
                {t.name}
              </h3>
              <p className="m-0 text-gray-300 text-sm">
                <strong>Leader:</strong> {t.leader}
              </p>
              <p className="m-0 text-gray-300 text-sm">
                <strong>Society:</strong> {t.society}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white text-lg text-center">
          No teams joined yet. Accept an invitation to get started!
        </p>
      )}
    </div>
  );
}
