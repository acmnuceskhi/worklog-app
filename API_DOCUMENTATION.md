# Backend API Documentation

## Overview

This document describes the backend APIs for the worklog tracking system with credits management, worklog progress tracking, and rating system.

## Authentication

All endpoints require authentication via Auth.js session. Include session cookies in requests.

## Credits Management

### Organization Credits

#### GET /api/organizations/[organizationId]/credits
Get organization credits (organization owners only).

**Authorization**: Organization owner only

**Response**: 
```json
{
  "id": "org_id",
  "name": "Organization Name",
  "credits": 1000
}
```

#### PATCH /api/organizations/[organizationId]/credits
Update organization credits (organization owners only).

**Authorization**: Organization owner only

**Request Body**:
```json
{
  "action": "add" | "subtract" | "set",
  "amount": 100
}
```

**Response**:
```json
{
  "id": "org_id",
  "name": "Organization Name",
  "credits": 1100,
  "previousCredits": 1000,
  "action": "add",
  "amount": 100
}
```

### Team Credits

#### GET /api/teams/[teamId]/credits
Get team credits (team owners only).

**Authorization**: Team owner only

**Response**:
```json
{
  "id": "team_id",
  "name": "Team Name",
  "credits": 500
}
```

#### PATCH /api/teams/[teamId]/credits
Update team credits (team owners only).

**Authorization**: Team owner only

**Request Body**:
```json
{
  "action": "add" | "subtract" | "set",
  "amount": 50
}
```

**Response**:
```json
{
  "id": "team_id",
  "name": "Team Name",
  "credits": 550,
  "previousCredits": 500,
  "action": "add",
  "amount": 50
}
```

## Worklog Progress Status Management

### Status Transitions

Valid status transitions:
- **STARTED** → **HALF_DONE**
- **HALF_DONE** → **COMPLETED**
- **COMPLETED** → **REVIEWED**
- **REVIEWED** → **GRADED**

### Role-Based Status Updates

- **Members/Worklog Owners**: Can update STARTED → HALF_DONE → COMPLETED
- **Team Owners**: Can update COMPLETED → REVIEWED
- **Organization Owners**: Can update REVIEWED → GRADED

#### GET /api/worklogs/[worklogId]/status
Get worklog status and valid next transitions.

**Authorization**: Authenticated user

**Response**:
```json
{
  "id": "worklog_id",
  "title": "Worklog Title",
  "progressStatus": "HALF_DONE",
  "updatedAt": "2025-02-06T13:42:36.000Z",
  "validNextStatuses": ["COMPLETED"]
}
```

#### PATCH /api/worklogs/[worklogId]/status
Update worklog progress status.

**Authorization**: Role-based (see above)

**Request Body**:
```json
{
  "status": "COMPLETED"
}
```

**Response**:
```json
{
  "id": "worklog_id",
  "title": "Worklog Title",
  "progressStatus": "COMPLETED",
  "updatedAt": "2025-02-06T13:45:00.000Z",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  },
  "team": {
    "id": "team_id",
    "name": "Team Name"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid status transition
- `403 Forbidden`: User doesn't have permission to update to this status

## Rating System

### Worklog Ratings

#### POST /api/worklogs/[worklogId]/ratings
Create a rating for a worklog (organization owners only).

**Authorization**: Organization owner only

**Requirements**:
- Worklog must be in REVIEWED or GRADED status
- Team must belong to an organization
- One rating per worklog per organization owner

**Request Body**:
```json
{
  "value": 8,
  "comment": "Great work on this feature!"
}
```

**Validation**:
- `value`: Integer between 1-10 (required)
- `comment`: String max 1000 characters (optional)

**Response**:
```json
{
  "id": "rating_id",
  "value": 8,
  "comment": "Great work on this feature!",
  "worklogId": "worklog_id",
  "raterId": "user_id",
  "createdAt": "2025-02-06T13:50:00.000Z",
  "updatedAt": "2025-02-06T13:50:00.000Z",
  "rater": {
    "id": "user_id",
    "name": "Organization Owner",
    "email": "owner@example.com"
  },
  "worklog": {
    "id": "worklog_id",
    "title": "Worklog Title"
  }
}
```

#### GET /api/worklogs/[worklogId]/ratings
Get all ratings for a worklog (organization owners only).

**Authorization**: Organization owner only

**Response**:
```json
[
  {
    "id": "rating_id",
    "value": 8,
    "comment": "Great work!",
    "worklogId": "worklog_id",
    "raterId": "user_id",
    "createdAt": "2025-02-06T13:50:00.000Z",
    "updatedAt": "2025-02-06T13:50:00.000Z",
    "rater": {
      "id": "user_id",
      "name": "Organization Owner",
      "email": "owner@example.com"
    }
  }
]
```

### Individual Rating Management

#### GET /api/ratings/[ratingId]
Get a single rating (organization owners only).

**Authorization**: Organization owner only

**Response**: Same as rating object above with full worklog details.

#### PATCH /api/ratings/[ratingId]
Update a rating (organization owner who created it only).

**Authorization**: Rating creator (must be organization owner)

**Request Body**:
```json
{
  "value": 9,
  "comment": "Updated comment"
}
```

**Note**: Both fields are optional, update only what's provided.

#### DELETE /api/ratings/[ratingId]
Delete a rating (organization owner who created it only).

**Authorization**: Rating creator (must be organization owner)

**Response**:
```json
{
  "message": "Rating deleted successfully"
}
```

## Authorization Helpers

The following helper functions are available in `lib/auth-utils.ts`:

### User Management
- `getCurrentUser()`: Get current authenticated user
- `isOrganizationOwner(userId, organizationId)`: Check if user owns organization
- `isTeamOwner(userId, teamId)`: Check if user owns team
- `isTeamMember(userId, teamId)`: Check if user is accepted team member
- `isWorklogOwner(userId, worklogId)`: Check if user owns worklog

### Access Control
- `canTeamOwnerAccessTeam(userId, teamId)`: Check if team owner can access team (validates organization ownership)
- `getTeamOrganization(teamId)`: Get organization for a team
- `getUserOrganizations(userId)`: Get all organizations owned by user
- `getUserTeamsInOrganization(userId, organizationId)`: Get teams owned by user in organization

### Response Helpers
- `unauthorized()`: 401 response
- `forbidden(message?)`: 403 response
- `notFound(message?)`: 404 response
- `badRequest(message?)`: 400 response
- `success(data, status?)`: Success response

## Validation Schemas

All validation schemas are in `lib/validations.ts` using Zod:

- `creditsUpdateSchema`: Credits management
- `worklogStatusUpdateSchema`: Status updates
- `ratingCreateSchema`: Creating ratings
- `ratingUpdateSchema`: Updating ratings
- `organizationCreateSchema`: Creating organizations
- `organizationUpdateSchema`: Updating organizations
- `teamCreateSchema`: Creating teams
- `teamUpdateSchema`: Updating teams
- `teamInviteSchema`: Team invitations
- `worklogCreateSchema`: Creating worklogs
- `worklogUpdateSchema`: Updating worklogs

Use `validateRequest(request, schema)` helper for validation.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `400 Bad Request`: Invalid input or business logic violation
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

## Database Schema

### Key Models

#### Organization
```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  description String?
  credits     Int      @default(0)
  ownerId     String
  owner       User     @relation("OrganizationOwner")
  teams       Team[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Team
```prisma
model Team {
  id              String       @id @default(cuid())
  name            String
  description     String?
  project         String?
  credits         Int          @default(0)
  organizationId  String?
  organization    Organization? @relation()
  ownerId         String
  owner           User         @relation("TeamOwner")
  members         TeamMember[]
  worklogs        Worklog[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}
```

#### Worklog
```prisma
model Worklog {
  id             String        @id @default(cuid())
  title          String
  description    String        @db.Text
  githubLink     String?
  progressStatus ProgressStatus @default(STARTED)
  deadline       DateTime?
  userId         String
  teamId         String
  user           User          @relation()
  team           Team          @relation()
  ratings        Rating[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

enum ProgressStatus {
  STARTED
  HALF_DONE
  COMPLETED
  REVIEWED
  GRADED
}
```

#### Rating
```prisma
model Rating {
  id        String   @id @default(cuid())
  value     Int      // 1-10
  comment   String?  @db.Text
  worklogId String
  raterId   String
  worklog   Worklog  @relation()
  rater     User     @relation()
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([worklogId, raterId])
}
```

## Testing

To test the APIs:

1. Start the development server: `npm run dev`
2. Authenticate via OAuth (Google or GitHub)
3. Use tools like Postman or curl with session cookies
4. Test different role scenarios:
   - Organization owner actions (credits, ratings, REVIEWED→GRADED)
   - Team owner actions (team credits, COMPLETED→REVIEWED)
   - Member actions (worklog updates, STARTED→HALF_DONE→COMPLETED)

## Future Enhancements

Potential additions based on user requirements:
- Automatic rating reduction for late worklogs
- Bulk operations for credits management
- Analytics endpoints for organization/team performance
- Worklog filtering and search
- Export functionality for ratings and worklogs
