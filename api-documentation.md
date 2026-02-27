# Worklog App API Documentation

## Overview

This document provides comprehensive documentation for the Worklog App backend APIs. The system implements a hierarchical worklog tracking platform with organizations, teams, and members, featuring credits management, progress tracking, and rating systems.

## Authentication

All endpoints require authentication via Auth.js session. Include session cookies in requests. In development mode, the system provides mock data for testing without requiring authentication.

## API Endpoints

### Organizations

#### GET /api/organizations

Get all organizations owned by the current user.

**Authorization**: Authenticated user (returns organizations they own)

**Development Mode**: Returns mock organizations for user "mock-org-owner-1"

**Response**:

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "credits": "number",
      "ownerId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "teams": [
        {
          "id": "string",
          "name": "string"
        }
      ],
      "_count": {
        "teams": "number"
      }
    }
  ]
}
```

#### POST /api/organizations

Create a new organization.

**Authorization**: Authenticated user

**Request Body**:

```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**Response**: Created organization object (201 status)

---

#### GET /api/organizations/[organizationId]

Get a specific organization by ID.

**Authorization**: Organization owner only

**Development Mode**: Returns mock organization data

**Response**: Organization object with teams

#### PATCH /api/organizations/[organizationId]

Update an organization.

**Authorization**: Organization owner only

**Request Body**:

```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

#### DELETE /api/organizations/[organizationId]

Delete an organization.

**Authorization**: Organization owner only

---

#### GET /api/organizations/[organizationId]/credits

Get organization credits.

**Authorization**: Organization owner only

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "credits": "number"
}
```

#### PATCH /api/organizations/[organizationId]/credits

Update organization credits.

**Authorization**: Organization owner only

**Request Body**:

```json
{
  "action": "add | subtract | set",
  "amount": "number"
}
```

---

#### POST /api/organizations/[organizationId]/invite

Send organization invitation.

**Authorization**: Organization owner only

**Request Body**:

```json
{
  "email": "string"
}
```

**Response**: Invitation object (201 status)

---

#### GET /api/organizations/[organizationId]/worklogs

Get all worklogs in an organization.

**Authorization**: Organization owner only

**Response**: Array of worklog objects with ratings

---

### Teams

#### GET /api/teams

Get all teams owned by the current user.

**Authorization**: Authenticated user

**Development Mode**: Returns mock teams for user "mock-org-owner-1"

**Response**:

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "project": "string | null",
      "credits": "number",
      "organizationId": "string | null",
      "ownerId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "_count": {
        "members": "number",
        "worklogs": "number"
      }
    }
  ]
}
```

#### POST /api/teams

Create a new team.

**Authorization**: Authenticated user

**Request Body**:

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "project": "string (optional)",
  "organizationId": "string (optional)"
}
```

**Response**: Created team object (201 status)

---

#### GET /api/teams/owned

Get teams owned by the current user.

**Authorization**: Authenticated user

**Development Mode**: Returns mock owned teams

**Response**:

```json
{
  "data": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

#### GET /api/teams/member

Get teams where the current user is a member.

**Authorization**: Authenticated user

**Development Mode**: Returns mock member teams

**Response**:

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "project": "string | null",
      "credits": "number",
      "organizationId": "string | null",
      "ownerId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "_count": {
        "members": "number",
        "worklogs": "number"
      }
    }
  ]
}
```

#### GET /api/teams/accessible

Get all teams the current user can access (owned + member).

**Authorization**: Authenticated user

**Response**: Combined array of owned and member teams

#### GET /api/teams/invitations

Get pending team invitations for the current user.

**Authorization**: Authenticated user

**Development Mode**: Returns mock pending invitations

**Response**: Array of invitation objects

---

#### GET /api/teams/[teamId]

Get a specific team by ID.

**Authorization**: Team owner or member

**Development Mode**: Returns mock team with members and owner data

**Response**: Complete team object with owner, organization, and members

#### PATCH /api/teams/[teamId]

Update a team.

**Authorization**: Team owner only

**Request Body**:

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "project": "string (optional)"
}
```

#### DELETE /api/teams/[teamId]

Delete a team.

**Authorization**: Team owner only

---

#### GET /api/teams/[teamId]/credits

Get team credits.

**Authorization**: Team owner only

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "credits": "number"
}
```

#### PATCH /api/teams/[teamId]/credits

Update team credits.

**Authorization**: Team owner only

**Request Body**:

```json
{
  "action": "add | subtract | set",
  "amount": "number"
}
```

---

#### POST /api/teams/[teamId]/invite

Send team invitation.

**Authorization**: Team owner only

**Request Body**:

```json
{
  "email": "string"
}
```

**Response**: Invitation object (201 status)

---

#### GET /api/teams/[teamId]/members

Get team members.

**Authorization**: Team owner or member

**Development Mode**: Returns mock team members

**Response**: Array of team member objects

#### POST /api/teams/[teamId]/members

Add a member to the team.

**Authorization**: Team owner only

**Request Body**:

```json
{
  "email": "string"
}
```

#### DELETE /api/teams/[teamId]/members/[memberId]

Remove a member from the team.

**Authorization**: Team owner only

---

#### GET /api/teams/[teamId]/worklogs

Get worklogs for a specific team.

**Authorization**: Team owner or member

**Development Mode**: Returns mock worklogs for the team

**Response**: Array of worklog objects

---

### Worklogs

#### GET /api/worklogs

Get all worklogs for the current user.

**Authorization**: Authenticated user

**Development Mode**: Returns mock worklogs for user "mock-org-owner-1"

**Response**: Array of worklog objects with user data

#### POST /api/worklogs

Create a new worklog.

**Authorization**: Authenticated user

**Request Body**:

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "githubLink": "string (optional)",
  "teamId": "string (required)",
  "deadline": "string (optional)"
}
```

**Response**: Created worklog object (201 status)

---

#### GET /api/worklogs/[worklogId]

Get a specific worklog by ID.

**Authorization**: Worklog owner, team member, or organization owner

**Response**: Complete worklog object with attachments

#### PATCH /api/worklogs/[worklogId]

Update a worklog.

**Authorization**: Worklog owner only

**Request Body**:

```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "githubLink": "string (optional)",
  "deadline": "string (optional)"
}
```

#### DELETE /api/worklogs/[worklogId]

Delete a worklog.

**Authorization**: Worklog owner only

---

#### PATCH /api/worklogs/[worklogId]/status

Update worklog progress status.

**Authorization**: Worklog owner (STARTED→HALF_DONE→COMPLETED), Team owner (COMPLETED→REVIEWED), Organization owner (REVIEWED→GRADED)

**Request Body**:

```json
{
  "newStatus": "STARTED | HALF_DONE | COMPLETED | REVIEWED | GRADED"
}
```

**Response**: Updated worklog object

---

#### GET /api/worklogs/[worklogId]/ratings

Get ratings for a specific worklog.

**Authorization**: Organization owner only

**Development Mode**: Returns empty ratings array

**Response**: Array of rating objects

#### POST /api/worklogs/[worklogId]/ratings

Create a rating for a worklog.

**Authorization**: Organization owner only

**Request Body**:

```json
{
  "value": "number (1-10)",
  "comment": "string (optional)"
}
```

**Response**: Created rating object (201 status)

---

### Ratings

#### GET /api/ratings/[ratingId]

Get a specific rating by ID.

**Authorization**: Organization owner only

**Response**: Rating object with rater information

#### PATCH /api/ratings/[ratingId]

Update a rating.

**Authorization**: Organization owner (rating creator) only

**Request Body**:

```json
{
  "value": "number (1-10) (optional)",
  "comment": "string | null (optional)"
}
```

#### DELETE /api/ratings/[ratingId]

Delete a rating.

**Authorization**: Organization owner (rating creator) only

---

### Invitations

#### POST /api/invitations/[token]/accept

Accept an invitation.

**Authorization**: Invitation recipient (via token)

**Response**: Success message

#### POST /api/invitations/[token]/reject

Reject an invitation.

**Authorization**: Invitation recipient (via token)

**Response**: Success message

---

### Dashboard & Sidebar

#### GET /api/dashboard

Get dashboard data for the current user.

**Authorization**: Authenticated user

**Development Mode**: Returns comprehensive mock dashboard data

**Response**:

```json
{
  "sidebarStats": {
    "totalWorklogs": "number",
    "completedWorklogs": "number",
    "pendingReviews": "number",
    "overdueWorklogs": "number"
  },
  "worklogs": [...],
  "memberTeams": [...],
  "ownedTeams": [...]
}
```

#### GET /api/sidebar/stats

Get sidebar statistics.

**Authorization**: Authenticated user

**Development Mode**: Returns mock sidebar statistics

**Response**:

```json
{
  "totalWorklogs": "number",
  "completedWorklogs": "number",
  "pendingReviews": "number",
  "overdueWorklogs": "number"
}
```

---

### File Uploads

#### POST /api/uploads

Upload files for worklog attachments.

**Authorization**: Authenticated user

**Content-Type**: multipart/form-data

**Files**: image/\*, application/pdf

**Response**: Array of uploaded file objects

---

### Email Testing

#### POST /api/send

Send test email (development only).

**Authorization**: None (development only)

**Request Body**:

```json
{
  "to": "string",
  "subject": "string",
  "html": "string"
}
```

---

## Data Models

### Organization

```typescript
{
  id: string;
  name: string;
  description?: string;
  credits: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  teams?: Team[];
  invitations?: OrganizationInvitation[];
}
```

### Team

```typescript
{
  id: string;
  name: string;
  description?: string;
  project?: string;
  credits: number;
  organizationId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  worklogs?: Worklog[];
}
```

### TeamMember

```typescript
{
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  invitedAt: string;
  joinedAt?: string;
  user?: User;
}
```

### Worklog

```typescript
{
  id: string;
  title: string;
  description: string;
  githubLink?: string;
  progressStatus: "STARTED" | "HALF_DONE" | "COMPLETED" | "REVIEWED" | "GRADED";
  deadline?: string;
  userId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  ratings?: Rating[];
  attachments?: WorklogAttachment[];
}
```

### Rating

```typescript
{
  id: string;
  value: number; // 1-10
  comment?: string;
  worklogId: string;
  raterId: string;
  createdAt: string;
  updatedAt: string;
  worklog?: Worklog;
  rater?: User;
}
```

### User

```typescript
{
  id: string;
  name?: string;
  email?: string;
  emailVerified?: string;
  image?: string;
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "string",
  "details": "object (optional)"
}
```

Common HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Development Mode

In development environment (`NODE_ENV === "development"`), all API endpoints provide mock data without requiring authentication or database connectivity. This enables full frontend development and testing without backend dependencies.

Mock data includes:

- Default user: "mock-org-owner-1" (Alice Johnson)
- Sample organizations, teams, members, worklogs, and ratings
- Realistic data relationships and permissions

## Rate Limiting

API endpoints implement rate limiting to prevent abuse. Contact the development team for specific limits.

## Versioning

Current API version: v1

All endpoints are prefixed with `/api/`. Future versions will use `/api/v2/`, etc.
