/**
 * Organization-related queries and mutations
 * Handles organization CRUD operations, team management within organizations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export interface Organization {
  id: string;
  name: string;
  description?: string;
  credits: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgListData {
  data: Organization[];
}

/**
 * Fetch all organizations where user is an owner
 */
export const useOrganizations = () => {
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async () => {
      const response = await fetch("/api/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const payload = await response.json();
      return (payload.data || payload.organizations || []) as Organization[];
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
