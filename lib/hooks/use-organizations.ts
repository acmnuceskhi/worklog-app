/**
 * Organization-related queries and mutations
 * Handles organization CRUD operations, team management within organizations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE } from "@/lib/types/pagination";
import { useIdempotencyToken } from "./use-idempotency-token";

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
          const error = new Error(
            "You don't have permission to access this resource",
          ) as Error & { status?: number };
          error.status = 403;
          throw error;
        }
        // Handle 404 (Not Found)
        if (response.status === 404) {
          const error = new Error("Organization not found") as Error & {
            status?: number;
          };
          error.status = 404;
          throw error;
        }
        throw new Error("Failed to fetch organization");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number })?.status;
      if (status === 403 || status === 404) return false;
      return failureCount < 2;
    },
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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
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

      // Track whether the default page key was empty before this mutation
      // (needed so onError can clean up the cold-cache seed if the API fails)
      const defaultListKey = queryKeys.organizations.list(DEFAULT_PAGE, 50);
      const seededDefaultKey = !queryClient.getQueryData(defaultListKey);

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

      // Warm-cache path: update every existing ["organizations", "list", ...] entry
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

      // Cold-cache path: setQueriesData only touches existing entries — if the
      // user navigated here without ever visiting the org list, no entry exists
      // yet. Seed the exact key that useOrganizations() subscribes to so
      // OrganisationsPage renders the new org immediately without a spinner.
      if (seededDefaultKey) {
        queryClient.setQueryData<PaginatedResponse<Organization>>(
          defaultListKey,
          {
            items: [optimisticOrg],
            meta: {
              page: DEFAULT_PAGE,
              limit: 50,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        );
      }

      return { previousOrgLists, seededDefaultKey };
    },
    onError: (_err, _data, context) => {
      // Restore every list variant to its pre-mutation snapshot
      if (context?.previousOrgLists) {
        for (const [key, value] of context.previousOrgLists) {
          queryClient.setQueryData(key, value);
        }
      }
      // Remove the cold-cache seed so a phantom optimistic org isn't left behind
      if (context?.seededDefaultKey) {
        queryClient.removeQueries({
          queryKey: queryKeys.organizations.list(),
        });
      }
    },
    onSuccess: () => {
      resetIdempotencyToken();
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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
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
    onSuccess: () => {
      resetIdempotencyToken();
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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": idempotencyToken },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete organization");
      }
      return { success: true, organizationId };
    },
    onSuccess: (_, organizationId) => {
      resetIdempotencyToken();
      // Remove from list caches immediately to prevent stale data
      queryClient.setQueriesData<PaginatedResponse<Organization>>(
        { queryKey: ["organizations", "list"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((org) => org.id !== organizationId),
            meta: old.meta
              ? { ...old.meta, total: Math.max(0, old.meta.total - 1) }
              : old.meta,
          };
        },
      );

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
        const error = new Error(
          "Failed to fetch organization invitations",
        ) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }
      const payload = await response.json();
      return (payload.data || payload) as OrganizationInvitationsResponse;
    },
    enabled: !!organizationId,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number })?.status;
      if (status === 403 || status === 404) return false;
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Invite organization owners via email
 */
export const useInviteOrganizationOwner = (organizationId: string) => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (emails: string[]) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyToken,
          },
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
      resetIdempotencyToken();
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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
        {
          method: "DELETE",
          headers: { "Idempotency-Key": idempotencyToken },
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to revoke invitation");
      }
      return response.json();
    },
    onSuccess: (_, invitationId) => {
      resetIdempotencyToken();
      // Immediately remove from invitations list to prevent stale visualization
      queryClient.setQueryData<OrganizationInvitationsResponse>(
        queryKeys.organizations.invitations(organizationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((i) => i.id !== invitationId),
            meta: {
              ...old.meta,
              total: Math.max(0, old.meta.total - 1),
              pending: Math.max(0, old.meta.pending - 1),
            },
          };
        },
      );

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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/owners/${userId}`,
        {
          method: "DELETE",
          headers: { "Idempotency-Key": idempotencyToken },
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove co-owner");
      }
      return response.json();
    },
    onSuccess: (_, userId) => {
      resetIdempotencyToken();
      // Immediately remove from invitations list to prevent stale visualization
      queryClient.setQueryData<OrganizationInvitationsResponse>(
        queryKeys.organizations.invitations(organizationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((i) => i.user?.id !== userId),
            meta: {
              ...old.meta,
              total: Math.max(0, old.meta.total - 1),
              accepted: Math.max(0, old.meta.accepted - 1),
            },
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(organizationId),
      });
    },
  });
};
