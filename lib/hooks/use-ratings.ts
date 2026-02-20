/**
 * Rating-related mutations
 * Handles creating, updating, and deleting ratings for worklogs
 * Only organization owners can create/manage ratings
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { isDevelopment, getMockRatingsForWorklog } from "@/lib/mock-data";

export interface Rating {
  id: string;
  value: number;
  comment?: string | null;
  worklogId: string;
  raterId: string;
  createdAt: string;
  updatedAt: string;
  rater?: {
    id: string;
    name?: string | null;
    email: string;
  };
}

/**
 * Fetch ratings for a specific worklog
 */
export const useWorklogRatings = (worklogId: string) => {
  return useQuery({
    queryKey: queryKeys.ratings.byWorklog(worklogId),
    queryFn: async () => {
      // In development, return mock ratings for the worklog
      if (isDevelopment) {
        const mockWorklogRatings = getMockRatingsForWorklog(worklogId);
        if (mockWorklogRatings.length > 0) {
          return mockWorklogRatings.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.createdAt.toISOString(), // Mock updatedAt as createdAt
          })) as Rating[];
        }
      }

      const response = await fetch(`/api/worklogs/${worklogId}/ratings`);
      if (!response.ok) {
        throw new Error("Failed to fetch ratings");
      }
      const payload = await response.json();
      return (
        Array.isArray(payload) ? payload : payload.data || []
      ) as Rating[];
    },
    enabled: !!worklogId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch all ratings in an organization
 */
export const useOrganizationRatings = (organizationId: string) => {
  return useQuery({
    queryKey: queryKeys.ratings.byOrganization(organizationId),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/ratings`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch ratings");
      }
      const payload = await response.json();
      return (payload.data || []) as Rating[];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create a rating for a worklog mutation
 */
export const useCreateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      worklogId: string;
      value: number;
      comment?: string;
    }) => {
      const response = await fetch(`/api/worklogs/${data.worklogId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: data.value,
          comment: data.comment || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create rating");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.byWorklog(variables.worklogId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.list(),
      });
    },
  });
};

/**
 * Update a rating mutation
 */
export const useUpdateRating = (ratingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { value: number; comment?: string | null }) => {
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update rating");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all() });
    },
  });
};

/**
 * Delete a rating mutation
 */
export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ratingId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this rating?",
      );
      if (!confirmed) throw new Error("User cancelled");

      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete rating");
      }
      return { success: true, ratingId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all() });
    },
  });
};
