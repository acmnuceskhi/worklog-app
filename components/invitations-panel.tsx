"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaClock,
  FaBuilding,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  useTeamInvitations,
  useAcceptInvitation,
  useRejectInvitation,
  type TeamInvitation,
} from "@/lib/hooks/use-team-invitations";

/* ──────────────────────────────────────────────────────────────────
 * InvitationsPanel
 * ──────────────────────────────────────────────────────────────────
 * A distinctive, compact sidebar panel for displaying and managing
 * pending team invitations. Features elegant animations, clear
 * visual hierarchy, and intuitive accept/reject actions.
 *
 * Design Philosophy:
 * - Clean, minimal aesthetic with subtle gradients
 * - Smooth micro-interactions and state transitions
 * - Clear visual feedback for all actions
 * - Responsive design that works on different screen sizes
 * - Accessibility-first with proper ARIA labels and keyboard navigation
 *
 * Usage:
 *   <InvitationsPanel />
 * ────────────────────────────────────────────────────────────────── */

interface InvitationCardProps {
  invitation: TeamInvitation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

function InvitationCard({
  invitation,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: InvitationCardProps) {
  const timeAgo = formatDistanceToNow(new Date(invitation.invitedAt), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="group"
    >
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-slate-600/70 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <FaUserPlus className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold text-white truncate">
                  {invitation.team.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-slate-700/50 text-slate-300 border-slate-600/50"
                  >
                    <FaClock className="w-3 h-3 mr-1" />
                    {timeAgo}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Team Details */}
            <div className="text-xs text-slate-400 space-y-1">
              {invitation.team.description && (
                <p className="line-clamp-2">{invitation.team.description}</p>
              )}
              {invitation.team.organization && (
                <div className="flex items-center gap-1 text-slate-500">
                  <FaBuilding className="w-3 h-3" />
                  <span className="truncate">
                    {invitation.team.organization.name}
                  </span>
                </div>
              )}
            </div>

            {/* Inviter Info */}
            <div className="text-xs text-slate-500">
              Invited by{" "}
              <span className="text-slate-400 font-medium">
                {invitation.team.owner.name || invitation.team.owner.email}
              </span>
            </div>

            <Separator className="bg-slate-700/50" />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(invitation.id)}
                disabled={isAccepting || isRejecting}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                aria-label={`Accept invitation to ${invitation.team.name}`}
              >
                {isAccepting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <FaCheck className="w-3 h-3" />
                  </motion.div>
                ) : (
                  <>
                    <FaCheck className="w-3 h-3 mr-1.5" />
                    Accept
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(invitation.id)}
                disabled={isAccepting || isRejecting}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-slate-500 transition-all duration-200"
                aria-label={`Decline invitation to ${invitation.team.name}`}
              >
                {isRejecting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <FaTimes className="w-3 h-3" />
                  </motion.div>
                ) : (
                  <>
                    <FaTimes className="w-3 h-3 mr-1.5" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InvitationsPanel() {
  const { data: invitations = [], isLoading, error } = useTeamInvitations();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptInvitation.mutateAsync(invitationId);
      toast.success("Invitation Accepted", {
        description: "Welcome to the team!",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Accept Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation. Please try again.",
        duration: 3500,
      });
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      await rejectInvitation.mutateAsync(invitationId);
      toast.success("Invitation Declined", {
        description: "The invitation has been declined.",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Decline Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to decline invitation. Please try again.",
        duration: 3500,
      });
    }
  };

  // Don't render if no invitations
  if (!isLoading && invitations.length === 0) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 flex-shrink-0 hidden xl:block"
      aria-label="Team Invitations"
    >
      <div className="sticky top-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <FaUserPlus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Team Invitations
            </h3>
            <p className="text-xs text-slate-400">
              {invitations.length} pending
            </p>
          </div>
        </div>

        {/* Invitations List */}
        <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              // Loading skeleton
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/30 border-slate-700/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700/50 animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                          <div className="h-3 bg-slate-700/30 rounded animate-pulse w-2/3" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <div className="flex-1 h-8 bg-slate-700/50 rounded animate-pulse" />
                        <div className="flex-1 h-8 bg-slate-700/30 rounded animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ) : error ? (
              // Error state
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center"
              >
                <p className="text-sm text-red-400">
                  Failed to load invitations
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </motion.div>
            ) : (
              // Invitations
              invitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isAccepting={
                    acceptInvitation.isPending &&
                    acceptInvitation.variables === invitation.id
                  }
                  isRejecting={
                    rejectInvitation.isPending &&
                    rejectInvitation.variables === invitation.id
                  }
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
