/**
 * Organization-related queries and mutations
 * Handles organization CRUD operations, team management within organizations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE } from "@/lib/types/pagination";

export interface OrganizationTeam {
  id: string;
  name: string;
  description: string | null;
  project: string | null;
  credits: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    worklogs: number;
  };
  members?: {
    id: string;
    teamId: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    } | null;
  }[];
  worklogs?: {
    id: string;
    title: string;
    progressStatus: string;
    teamId: string;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
    ratings: {
      id: string;
      value: number;
      comment: string | null;
      worklogId: string;
    }[];
  }[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  credits: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  teams?: OrganizationTeam[];
  stats?: {
    totalTeams: number;
    totalMembers: number;
    totalWorklogs: number;
  };
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
      const response = await fetch(
        `/api/organizations?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access this resource");
        }
        throw new Error("Failed to fetch organizations");
      }
      return (await response.json()) as PaginatedResponse<Organization>;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access this resource");
        }
        // Handle 404 (Not Found)
        if (response.status === 404) {
          throw new Error("Organization not found");
        }
        throw new Error("Failed to fetch organization");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access this resource");
        }
        throw new Error("Failed to fetch organization teams");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    onMutate: async (data) => {
      // Cancel in-flight org queries to prevent stale overwrites
      await queryClient.cancelQueries({
        queryKey: queryKeys.organizations.all(),
      });

      // Snapshot all list query variants (any pagination params) for rollback
      const previousOrgLists = queryClient.getQueriesData<
        PaginatedResponse<Organization>
      >({ queryKey: ["organizations", "list"] });

      // Build a temporary placeholder so the new page sees data immediately
      const optimisticOrg: Organization = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description,
        credits: 0,
        ownerId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teams: [],
        _count: { teams: 0 },
      };

      queryClient.setQueriesData<PaginatedResponse<Organization>>(
        { queryKey: ["organizations", "list"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [optimisticOrg, ...(old.items ?? [])],
            meta: {
              ...old.meta,
              total: (old.meta?.total ?? 0) + 1,
            },
          };
        },
      );

      return { previousOrgLists };
    },
    onError: (_err, _data, context) => {
      // Restore every list variant to its pre-mutation snapshot
      if (context?.previousOrgLists) {
        for (const [key, value] of context.previousOrgLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      // Eagerly refetch the org list so the new org shows immediately,
      // even if the component has already navigated away (no active subscriber).
      queryClient.refetchQueries({ queryKey: queryKeys.organizations.list() });
      // Side-effect invalidations for unrelated caches
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    },
    onSettled: () => {
      // Always sync all organization data with the server
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.organizations.all(),
      });

      const previousOrg = queryClient.getQueryData<Organization>(
        queryKeys.organizations.detail(organizationId),
      );
      const previousOrgLists = queryClient.getQueriesData<
        PaginatedResponse<Organization>
      >({ queryKey: ["organizations", "list"] });

      // Optimistically update the detail cache
      queryClient.setQueryData<Organization>(
        queryKeys.organizations.detail(organizationId),
        (old) => (old ? { ...old, ...data } : old),
      );

      // Optimistically update every list variant
      queryClient.setQueriesData<PaginatedResponse<Organization>>(
        { queryKey: ["organizations", "list"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((org) =>
              org.id === organizationId ? { ...org, ...data } : org,
            ),
          };
        },
      );

      return { previousOrg, previousOrgLists };
    },
    onError: (_err, _data, context) => {
      if (context?.previousOrg) {
        queryClient.setQueryData(
          queryKeys.organizations.detail(organizationId),
          context.previousOrg,
        );
      }
      if (context?.previousOrgLists) {
        for (const [key, value] of context.previousOrgLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
      });
      // Keep sidebar organization count in sync after updates
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
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
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.organizations.all(),
      });

      const previousOrg = queryClient.getQueryData<Organization>(
        queryKeys.organizations.detail(organizationId),
      );

      // Optimistically apply the credit change so the UI reflects it instantly
      queryClient.setQueryData<Organization>(
        queryKeys.organizations.detail(organizationId),
        (old) => {
          if (!old) return old;
          let newCredits = old.credits;
          if (data.action === "add") newCredits += data.amount;
          else if (data.action === "subtract")
            newCredits = Math.max(0, newCredits - data.amount);
          else if (data.action === "set") newCredits = data.amount;
          return { ...old, credits: newCredits };
        },
      );

      return { previousOrg };
    },
    onError: (_err, _data, context) => {
      if (context?.previousOrg) {
        queryClient.setQueryData(
          queryKeys.organizations.detail(organizationId),
          context.previousOrg,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
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
