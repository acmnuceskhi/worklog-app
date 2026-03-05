/**
 * Rating-related mutations
 * Handles creating, updating, and deleting ratings for worklogs
 * Only organization owners can create/manage ratings
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE } from "@/lib/types/pagination";

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
 * Fetch ratings for a specific worklog (paginated)
 */
export const useWorklogRatings = (
  worklogId: string,
  page: number = DEFAULT_PAGE,
  limit: number = 20,
) => {
  return useQuery({
    queryKey: queryKeys.ratings.byWorklog(worklogId, page, limit),
    queryFn: async (): Promise<PaginatedResponse<Rating>> => {
      const response = await fetch(
        `/api/worklogs/${worklogId}/ratings?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to view ratings");
        }
        throw new Error("Failed to fetch ratings");
      }
      return (await response.json()) as PaginatedResponse<Rating>;
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error(
            "You don't have permission to view organization ratings",
          );
        }
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
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.ratings.byWorklog(newData.worklogId),
      });

      // Snapshot the previous state
      const previousRatings = queryClient.getQueriesData<
        PaginatedResponse<Rating>
      >({
        queryKey: queryKeys.ratings.byWorklog(newData.worklogId),
      });

      // Optimistic rating (minimal data)
      const optimisticRating: Rating = {
        id: `temp-${Date.now()}`,
        value: newData.value,
        comment: newData.comment ?? null,
        worklogId: newData.worklogId,
        raterId: "me", // Placeholder
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Apply optimistic update to all paginated versions of this worklog's ratings
      queryClient.setQueriesData<PaginatedResponse<Rating>>(
        { queryKey: queryKeys.ratings.byWorklog(newData.worklogId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [optimisticRating, ...(old.items ?? [])],
            meta: {
              ...old.meta,
              total: (old.meta?.total ?? 0) + 1,
            },
          };
        },
      );

      return { previousRatings };
    },
    onError: (_err, variables, context) => {
      // Rollback
      if (context?.previousRatings) {
        for (const [key, value] of context.previousRatings) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.byWorklog(variables.worklogId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.list(),
      });
    },
    onSettled: () => {
      // Sync everything
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.all(),
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
