---
goal: Resolve Team Organization Linking/Unlinking Cache Sync Race Condition Causing Stale Data on Multiple Pages
version: 1.0
date_created: 2026-03-05
last_updated: 2026-03-05
owner: Development Team
status: "Planned"
tags: ["bug", "cache-sync", "race-condition", "tanstack-query"]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

After multiple cache synchronization fix attempts, a critical race condition persists where team organization linking/unlinking mutations update the database and individual team detail pages correctly, but team card organization badges on `/teams/lead` and the "Total Teams" count on `/teams/organisations` display stale cached data. The distinctive symptom is that data appears correct DURING the mutation save process but reverts to outdated values AFTER the save completes, indicating a post-mutation cache invalidation/refetch race condition.

## 1. Requirements & Constraints

- **REQ-001**: After a team's organization binding changes, the updated state must be reflected on `/teams/lead` team cards immediately (within 100ms of mutation completion)
- **REQ-002**: After a team's organization binding changes, the `/teams/organisations` page must show accurate "Total Teams" counts immediately upon navigation
- **REQ-003**: After a team's organization binding changes, the `/organizations/{orgId}` page must show the correct team list immediately upon navigation
- **REQ-004**: The fix must work when `/teams/lead` is the mounted page where the mutation fires
- **REQ-005**: The fix must work when user is NOT on `/teams/organisations` or `/organizations/{orgId}` at mutation time
- **REQ-006**: All HTTP responses must use `Cache-Control: no-store` to prevent browser HTTP caching of list endpoints
- **REQ-007**: TanStack Query cache invalidation must use correct query key matching (prefix matching for list queries with pagination objects)
- **SEC-001**: User data must remain consistent across all pages without requiring manual refresh
- **CON-001**: The fix must not introduce additional network requests for pages not being visited
- **CON-002**: The fix must not break optimistic UI updates that show correct data during mutation
- **PAT-001**: Follow TanStack Query mutation patterns: onMutate→onSuccess→onSettled
- **PAT-002**: Use explicit refetchQueries (forced immediate fetch) instead of invalidateQueries (marks stale, deferred fetch) for queries that must be fresh before React renders

## 2. Current Implementation Status

### A. What's Already Implemented

**File**: `lib/hooks/use-teams.ts` - `useUpdateTeam` mutation

**Current Flow**:

1. **onMutate** (lines 333-428):
   - Snapshots `teams.detail` cache
   - Snapshots ALL `teams.owned()` paginated pages
   - Scans owned-list pages to find previous org ID
   - Resolves new organization object from cached org list
   - Performs optimistic updates to both detail and owned-list caches
   - Returns context with snapshots for rollback

2. **onSuccess** (lines 435-458):
   - Writes server response into `teams.detail` cache
   - Writes server response into ALL `teams.owned()` paginated pages
   - Maps through items to update only the modified team

3. **onSettled** (lines 460-497):
   - Invalidates all team queries with `invalidateQueries(["teams"])`
   - **AWAITS** `refetchQueries(["teams", "owned"])` — this is the issue point
   - Calls non-awaited `refetchQueries` for sidebar stats
   - Invalidates organizations detail and list caches with `invalidateQueries`

**API Endpoints**:

- `/api/teams/owned` (lines 60-81): Returns with `Cache-Control: no-store` ✅
- `/api/organizations` (lines 85-115): Returns with `Cache-Control: no-store` ✅
- `/api/organizations/[organizationId]` (lines 1-230): Returns with `Cache-Control: no-store` ✅

### B. The Symptom Pattern

**Reproduction**:

1. User on `/teams/lead` opens TeamSettingsDialog for Team A
2. Changes Team A's organization binding (link or unlink)
3. Clicks "Save Changes"
4. **During save** (mutation in-flight): Team A card briefly shows CORRECT org badge
5. **After save completes**: Team A card reverts to showing OLD org badge (stale data)
6. **Fix**: Tab switch or page reload shows correct data

**Key Observations**:

- Database: ✅ Correct
- `/teams/lead/[teamId]` (detail page): ✅ Correct
- `/teams/lead/[otherId]` (other detail page): ✅ Correct
- `/teams/lead` (card list): ❌ Stale
- `/teams/organisations` (count): ❌ Stale
- `/organizations/[orgId]`: ❌ Stale

**Why Work-arounds Work**:

- Tab switch triggers `refetchOnWindowFocus: true` — forced refetch of visible queries
- Page reload clears all caches and refetches fresh
- Both bypass the post-mutation refetch logic entirely

### C. Root Cause: Race Condition in onSettled

**The Issue**:

```typescript
// Current code at line 469 in lib/hooks/use-teams.ts
await queryClient.refetchQueries({ queryKey: queryKeys.teams.owned() });
```

This line **AWAITS** the refetch. However:

1. **onSuccess writes data** to cache via `setQueryData` (non-deterministic timing)
2. **onSettled invalidates** with `invalidateQueries` (marks stale immediately)
3. **onSettled awaits refetch** for `teams.owned()` (forced immediate fetch to `/api/teams/owned`)
4. **Problem**: The API is hit BEFORE or RACE-CONDITIONS with the onSuccess cache writes

**Race Condition Timeline**:

**Scenario 1 (onSuccess wins)** — Desired behavior:

```
onSuccess: setQueryData(teams.detail, serverTeam)
onSuccess: setQueryData(teams.owned, {...items, [updatedTeam]})  ← Cache now has correct data
onSettled: invalidateQueries(["teams"])  ← Marks stale
onSettled: await refetchQueries(teams.owned)  ← Fetches from API
API: Returns fresh org data
Cache updated with API response  ← Should match onSuccess data
✅ Page renders with correct data
```

**Scenario 2 (refetch happens before onSuccess)** — BUG:

```
onSettled: invalidateQueries(["teams"])  ← Marks stale
onSettled: await refetchQueries(teams.owned)  ← Fetch STARTS
onSuccess: setQueryData(teams.detail, serverTeam)  ← This happens AFTER refetch starts
API responds with /api/teams/owned data
Refetch COMPLETES and overwrites cache  ← BUG: Overwrites onSuccess updates!
Cache has misaligned data (old org badge from API)
❌ Page renders with stale data
```

**Why this is possible**:

- `setQueryData` is synchronous but fast
- `invalidateQueries` marks stale immediately
- `refetchQueries` returns a Promise that awaits network completion
- The three callbacks (`onMutate`, `onSuccess`, `onSettled`) execute in sequence, but their side effects (refetches) are asynchronous
- By the time the refetch completes, the onSuccess updates may not have taken effect yet

### D. Organizations List Issue

**For `/teams/organisations` "Total Teams" count**:

```typescript
// Current code at lines 477-481 in lib/hooks/use-teams.ts
if (newOrgId) {
  queryClient.refetchQueries({
    queryKey: queryKeys.organizations.detail(newOrgId),
  });
  queryClient.refetchQueries({
    queryKey: queryKeys.organizations.list(),
  });
}
```

These refetches are **NOT AWAITED**. So:

1. Mutation fires `invalidateQueries` and `refetchQueries`
2. `refetchQueries(organizations.list)` starts but doesn't wait
3. User navigates to `/teams/organisations`
4. Component calls `useOrganizations()` hook → reads cache
5. Cache might still be stale because refetch hasn't completed yet
6. Component renders with stale count
7. Refetch eventually completes and updates cache
8. Component doesn't re-render because it's already mounted with stale data

---

## 3. Implementation Steps

### Implementation Phase 1: Eliminate onSettled Race Condition

- **GOAL-001**: Fix the race condition between onSuccess cache writes and onSettled refetches by ensuring cache is guaranteed fresh before React renders

| Task     | Description                                                                          | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-001 | Remove `await queryClient.refetchQueries(teams.owned)` from onSettled                | **File**: `lib/hooks/use-teams.ts` line 469<br/>**Current**: `await queryClient.refetchQueries({ queryKey: queryKeys.teams.owned() });`<br/>**Reason**: onSuccess already wrote server data to owned-list cache. Refetch AFTER onSuccess cache write is guaranteed stale overwrite. Since /teams/lead component that opened the dialog is still mounted, the cache update propagates to React immediately via query observer.<br/>**Action**: Delete this entire line and its comment block (lines 466-469)    |
| TASK-002 | Remove `invalidateQueries(["teams"])` from onSettled                                 | **File**: `lib/hooks/use-teams.ts` line 391<br/>**Current**: `queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });`<br/>**Reason**: Calling invalidate THEN refetch is a double-invalidation that causes race conditions. Since onSuccess already synchronized the server data into owned-list cache, invalidating it and refetching again is redundant and dangerous.<br/>**Action**: Delete this line and its comment (lines 389-391). The refetch will implicitly mark as stale and refetch. |
| TASK-003 | Ensure onSuccess cache writes for owned-list pages complete before mutation resolves | **File**: `lib/hooks/use-teams.ts` lines 435-458<br/>**Current state**: onSuccess uses synchronous setQueryData which is fast but still can race<br/>**Action**: Verify the setQueryData calls in onSuccess are happening (they are). Leave as-is — synchronous setQueryData is correct.<br/>**Verify**: Confirm onSuccess is NOT async; if it is, remove async and make it synchronous                                                                                                                        |

### Implementation Phase 2: Ensure Organizations Caches Update Before Navigation

- **GOAL-002**: Fix stale organization list/detail caches by forcing refetch before user can navigate to those pages

| Task     | Description                                                                          | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-004 | Change `invalidateQueries` to `refetchQueries` for organizations.detail on newOrgId  | **File**: `lib/hooks/use-teams.ts` line 410<br/>**Current**: `queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(newOrgId) });`<br/>**Change to**: `await queryClient.refetchQueries({ queryKey: queryKeys.organizations.detail(newOrgId) });`<br/>**Reason**: Forced refetch ensures org detail cache is fresh immediately. If user navigates to `/organizations/[newOrgId]`, they see correct team count.<br/>**Action**: Replace line 410 with await refetchQueries |
| TASK-005 | Change `invalidateQueries` to `refetchQueries` for organizations.list on newOrgId    | **File**: `lib/hooks/use-teams.ts` line 415<br/>**Current**: `queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list() });`<br/>**Change to**: `await queryClient.refetchQueries({ queryKey: queryKeys.organizations.list() });`<br/>**Reason**: Forced refetch ensures org list cache is fresh. `/teams/organisations` page reads fresh count immediately.<br/>**Action**: Replace line 415 with await refetchQueries                                                       |
| TASK-006 | Change `invalidateQueries` to `refetchQueries` for organizations.detail on prevOrgId | **File**: `lib/hooks/use-teams.ts` line 425<br/>**Current**: `queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(prevOrgId) });`<br/>**Change to**: `await queryClient.refetchQueries({ queryKey: queryKeys.organizations.detail(prevOrgId) });`<br/>**Reason**: Ensures old org detail is also fresh (count decreased by 1).<br/>**Action**: Replace line 425 with await refetchQueries                                                                               |
| TASK-007 | Change `invalidateQueries` to `refetchQueries` for organizations.list on prevOrgId   | **File**: `lib/hooks/use-teams.ts` line 430<br/>**Current**: `queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list() });`<br/>**Change to**: `await queryClient.refetchQueries({ queryKey: queryKeys.organizations.list() });`<br/>**Reason**: Same as TASK-005 but for old org when unlinking.<br/>**Action**: Replace line 430 with await refetchQueries                                                                                                                 |
| TASK-008 | Update comment block explaining invalidateQueries→refetchQueries change              | **File**: `lib/hooks/use-teams.ts` lines 402-409<br/>**Current comment**: Explains why NOT to use refetchQueries (outdated logic)<br/>**New comment**: Should explain that refetchQueries forces immediate refetch regardless of observer status, ensuring caches are fresh before navigation<br/>**Action**: Replace entire comment block with corrected explanation                                                                                                                        |

### Implementation Phase 3: Verification & Validation

| Task     | Description                                                        | Details                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-009 | Run lint and build to ensure no syntax errors                      | **Command**: `npm run lint ; npm run build`<br/>**Expected**: 0 errors, exit code 0<br/>**Action**: Execute in terminal and verify success                                                                                                                                                                                                  |
| TASK-010 | Manual test: Team card update on `/teams/lead`                     | **Steps**:<br/>1. Navigate to `http://localhost:3000/teams/lead`<br/>2. Click settings on any team<br/>3. Change organization binding in dialog<br/>4. Click "Save Changes"<br/>5. **Expected**: Team card org badge updates immediately and STAYS updated<br/>6. **Verify**: No longer reverts to old value after save                     |
| TASK-011 | Manual test: Count update on `/teams/organisations`                | **Steps**:<br/>1. Open two browser tabs: `/teams/lead` and `/teams/organisations`<br/>2. On `/teams/lead`, link a standalone team to an org<br/>3. Wait for mutation to complete<br/>4. Look at `/teams/organisations` tab<br/>5. **Expected**: Total team count increments by 1 immediately<br/>6. **Verify**: No longer shows stale count |
| TASK-012 | Manual test: Organization detail page `/organizations/[orgId]`     | **Steps**:<br/>1. Navigate to org detail page in one tab<br/>2. Link/unlink a team from another tab<br/>3. Return to org detail tab<br/>4. **Expected**: Team list reflects the change immediately<br/>5. **Verify**: No stale data shown                                                                                                   |
| TASK-013 | Test cross-page scenario: Mutation on team detail, check list page | **Steps**:<br/>1. Open team detail page `/teams/lead/[teamId]` (if settings are there)<br/>2. Or open settings dialog on `/teams/lead`<br/>3. Change org binding<br/>4. Close dialog and check card on list page<br/>5. **Expected**: Card shows correct org immediately<br/>6. **Verify**: Consistent data across detail and list pages    |

---

## 4. Alternatives Considered

- **ALT-001**: Use `refetchOnWindowFocus: true` + browser focus event to force refetch — **Rejected** because (1) doesn't work for SPA navigation, (2) user shouldn't need to switch tabs, (3) adds unnecessary network traffic
- **ALT-002**: Manually invalidate cache in component's useEffect on mount — **Rejected** because (1) mutation callbacks should handle cache sync, (2) spreads responsibility across multiple files, (3) less reliable than mutation callback logic
- **ALT-003**: Remove onSuccess cache writes and rely only on onSettled refetch — **Rejected** because (1) shows stale data momentarily during refetch, (2) breaks optimistic UI pattern, (3) increases network latency perception
- **ALT-004**: Use optimistic render immediately in component before mutation completes — **Rejected** because (1) component doesn't know about mutation outcome, (2) TeamSettingsDialog is lazily loaded, (3) adds complexity without fixing root cause

---

## 5. Dependencies

- **DEP-001**: TanStack Query v5+ with `refetchQueries` API
- **DEP-002**: Next.js App Router for proper query observer lifecycle
- **DEP-003**: Prisma ORM returning correct data from database (already verified ✅)
- **DEP-004**: HTTP API endpoints returning fresh data with `Cache-Control: no-store` (already verified ✅)

---

## 6. Files Modified

| File                                        | Changes                                                                                                                                                                                                                                    | Impact                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **lib/hooks/use-teams.ts**                  | Remove onSettled refetch for teams.owned (line 469)<br/>Remove invalidateQueries for teams (line 391)<br/>Change 4x invalidateQueries to refetchQueries for org caches (lines 410, 415, 425, 430)<br/>Update comment block (lines 402-409) | High — Core mutation cache logic |
| **lib/hooks/use-teams.ts** (no code change) | Verify onSuccess is synchronous and cache writes are correct (lines 435-458)                                                                                                                                                               | Verification only                |

---

## 7. Testing Strategy

### Unit/Integration Level

None needed — this is pure cache management, tested via manual e2e scenarios

### Manual E2E Tests (TASK-010 through TASK-013)

Critical for verification because TanStack Query race conditions are timing-dependent and difficult to replicate in unit tests

### Acceptance Criteria

1. ✅ `/teams/lead` team card org badge updates immediately after mutation and DOES NOT revert
2. ✅ `/teams/organisations` "Total Teams" count accurate immediately after navigation
3. ✅ `/organizations/[orgId]` team list accurate immediately
4. ✅ No errors in console
5. ✅ `npm run lint` and `npm run build` pass with exit code 0

---

## 8. Risks & Assumptions

- **RISK-001**: Removing `invalidateQueries(["teams"])` might leave some team query cached if refetchQueries doesn't match all variants. **Mitigation**: onSuccess already synchronized all relevant caches (detail + owned-list pages), so the initial sync is correct. invalidateQueries was redundant.
- **RISK-002**: Changing to `await refetchQueries` for org caches might slow down mutation callback completion if API is slow. **Mitigation**: This is intentional — user should not be able to navigate before caches are fresh. The await is necessary for correctness.
- **RISK-003**: Previous failed fixes showed different symptoms (blank pages, missing data). This fix specifically addresses the "stale data after mutation" symptom. **Mitigation**: The race condition is now correctly identified and isolated.
- **ASSUMPTION-001**: The database is correctly updated by the API PATCH endpoint. **Verification**: ✅ Confirmed in issue description
- **ASSUMPTION-002**: Individual team detail pages show correct data. **Verification**: ✅ Confirmed in issue description
- **ASSUMPTION-003**: `/api/teams/owned` and `/api/organizations` return fresh data. **Verification**: ✅ `Cache-Control: no-store` headers present
- **ASSUMPTION-004**: React Query refetchQueries actually forces fetch regardless of observer status. **Verification**: ✅ TanStack Query documentation confirms this behavior

---

## 9. Related Context & Previous Attempts

### Previous Fixes Applied (What's Already in Code)

1. ✅ Removed `withCacheHeaders(60)` from API responses — HTTP cache no longer forces stale data
2. ✅ Added `Cache-Control: no-store` headers to all list endpoints
3. ✅ Implemented optimistic updates in onMutate
4. ✅ Implemented onSuccess cache synchronization with server response
5. ✅ Changed some invalidateQueries to refetchQueries for owned teams

### Why Previous Fixes Didn't Fully Resolve

1. onSuccess synchronization works correctly, but onSettled refetch races against it
2. The `await queryClient.refetchQueries(teams.owned)` line creates the race condition
3. invalidateQueries for org caches was too passive — if user navigates before refetch completes, they see stale data

### Diagnostic Files

- `TEAM_LINKING_CACHE_SYNC_DIAGNOSIS.md` — Original diagnosis (before optimistic updates were added)
- This file — Updated diagnosis after optimistic update implementation revealed the race condition

---

## 10. Verification Commands

```bash
# After making changes, run:
npm run lint          # Verify no linting errors
npm run build         # Verify no TypeScript errors
npm run dev           # Start development server

# Then execute TASK-010 through TASK-013 manually in browser
```

---

## Implementation Notes for AI Models

**For Claude/Gemini/other AI agents implementing this fix**:

1. **Read the entire onMutate, onSuccess, onSettled flow** before making changes — they are interdependent
2. **The TASK-001 (remove await refetch)** is critical — leaving it causes the race condition to persist
3. **The 4x TASK-004-007 changes (add await to org caches)** are necessary to fix the `/teams/organisations` count issue
4. **Replace the entire comment block TASK-008** — the old comment explains WHY NOT to use refetchQueries, but that reasoning is outdated
5. **Do NOT modify onSuccess logic** — it's correct as-is. Only fixing onSettled.
6. **After changes, test ALL three pages** (lead, organisations, org detail) because fixes span multiple related caches
7. **The fix relies on TanStack Query's behavior**: `refetchQueries` with no observer requires an active network fetch, which blocks the await
