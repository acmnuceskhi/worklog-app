/**
 * Testing utilities for React Query hooks
 * Provides helper functions for testing custom hooks in isolation
 * Note: For full integration testing with React Testing Library, install:
 * npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Create a test-specific QueryClient with disabled defaults
 * Prevents unwanted side effects during testing
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable garbage collection in tests
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Mock query data in cache
 * Useful for testing components without actually fetching data
 */
export const setQueryData = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  data: T,
) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Get query data from cache
 * Useful for asserting query state in tests
 */
export const getQueryData = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) => {
  return queryClient.getQueryData<T>(queryKey);
};

/**
 * Clear all cached data
 * Useful for resetting state between tests
 */
export const clearQueryCache = (queryClient: QueryClient) => {
  queryClient.clear();
};

/**
 * Wait for query to settle by polling its state
 * Useful for async operations in tests
 */
export const waitForQueryToSettle = async (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  timeout = 5000,
) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const state = queryClient.getQueryState(queryKey);
    if (!state || state.status !== "pending") {
      return state?.data;
    }
    // Small delay before next check
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Query did not settle within ${timeout}ms`);
};

/**
 * Invalidate specific query
 * Useful for testing cache invalidation in mutations
 */
export const invalidateQuery = async (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) => {
  await queryClient.invalidateQueries({ queryKey });
};

/**
 * Mock fetch response for testing
 * Use to simulate API responses in tests
 */
export const mockFetchResponse = (data: unknown, ok = true) => {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status: ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

/**
 * Test data fixtures
 * Realistic mock data for all entity types
 */
export const testData = {
  organization: {
    id: "org-123",
    name: "Test Organization",
    description: "A test organization",
    credits: 100,
    ownerId: "user-123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  team: {
    id: "team-123",
    name: "Test Team",
    description: "A test team",
    project: "Test Project",
    credits: 50,
    organizationId: "org-123",
    ownerId: "user-456",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  worklog: {
    id: "worklog-123",
    title: "Test Worklog",
    description: "A test worklog entry",
    githubLink: "https://github.com/test/repo/commit/abc123",
    progressStatus: "STARTED" as const,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "user-789",
    teamId: "team-123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  rating: {
    id: "rating-123",
    value: 8,
    comment: "Great work!",
    worklogId: "worklog-123",
    raterId: "user-123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};
