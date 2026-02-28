/**
 * Organization-related queries and mutations
 * Handles organization CRUD operations, team management within organizations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { mockOrganizations, mockTeams } from "@/lib/mock-data";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE } from "@/lib/types/pagination";

export interface Organization {
  id: string;
  name: string;
  description?: string;
  credits: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  teams?: {
    id: string;
    name: string;
  }[];
  _count?: {
    teams: number;
  };
}

export interface OrgListData {
  data: Organization[];
}

/**
 * Fetch all organizations where user is an owner (paginated)
 */
export const useOrganizations = (
  page: number = DEFAULT_PAGE,
  limit: number = 50,
) => {
  return useQuery({
    queryKey: queryKeys.organizations.list(page, limit),
    queryFn: async (): Promise<PaginatedResponse<Organization>> => {
      // In development, return mock data directly without any network call
      if (process.env.NODE_ENV === "development") {
        const defaultUserId = "mock-org-owner-1";
        const all = mockOrganizations
          .filter((o) => o.ownerId === defaultUserId)
          .map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description || undefined,
            credits: o.credits,
            ownerId: o.ownerId,
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
            teams: mockTeams
              .filter((t) => t.organizationId === o.id)
              .map((t) => ({ id: t.id, name: t.name })),
            _count: {
              teams: mockTeams.filter((t) => t.organizationId === o.id).length,
            },
          })) as Organization[];
        const total = all.length;
        const skip = (page - 1) * limit;
        const items = all.slice(skip, skip + limit);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
          items,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        };
      }
      const response = await fetch(
        `/api/organizations?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      return (await response.json()) as PaginatedResponse<Organization>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single organization by ID
 */
export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch organization");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch teams within an organization
 */
export const useOrganizationTeams = (organizationId: string) => {
  return useQuery({
    queryKey: queryKeys.organizations.teams(organizationId),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/teams`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch organization teams");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create a new organization mutation
 */
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create organization");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.list(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    },
  });
};

/**
 * Update organization mutation
 */
export const useUpdateOrganization = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update organization");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.list(),
      });
    },
  });
};

/**
 * Delete organization mutation
 */
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this organization? This action cannot be undone.",
      );
      if (!confirmed) throw new Error("User cancelled");

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete organization");
      }
      return { success: true, organizationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    },
  });
};

/**
 * Update organization credits mutation
 */
export const useUpdateOrganizationCredits = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      action: "add" | "subtract" | "set";
      amount: number;
    }) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/credits`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update organization credits",
        );
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.list(),
      });
    },
  });
};

// ─── Organization Owner Invitation Types ─────────────────────────────────────

export interface OrganizationInvitation {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  invitedAt: string;
  joinedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export interface OrganizationInvitationsResponse {
  data: OrganizationInvitation[];
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  meta: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
}

// ─── Organization Owner Invitation Hooks ─────────────────────────────────────

/**
 * Fetch organization invitations (pending, accepted, rejected)
 */
export const useOrganizationInvitations = (
  organizationId: string,
  status?: "PENDING" | "ACCEPTED" | "REJECTED",
) => {
  return useQuery({
    queryKey: queryKeys.organizations.invitations(organizationId, status),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const url = `/api/organizations/${organizationId}/invitations${params.toString() ? `?${params}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch organization invitations");
      }
      return (await response.json()) as OrganizationInvitationsResponse;
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Invite organization owners via email
 */
export const useInviteOrganizationOwner = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emails: string[]) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitations");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(organizationId),
      });
    },
  });
};

/**
 * Revoke a pending organization owner invitation
 */
export const useRevokeOrganizationInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to revoke invitation");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(organizationId),
      });
    },
  });
};

/**
 * Remove an accepted co-owner from the organization
 */
export const useRemoveOrganizationOwner = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/owners/${userId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove co-owner");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(organizationId),
      });
    },
  });
};
