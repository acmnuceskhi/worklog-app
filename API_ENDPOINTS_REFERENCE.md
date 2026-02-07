# API Endpoints Reference

## Complete Backend API Endpoints

### Authentication
- **POST** `/api/auth/signin` - Sign in with credentials
- **POST** `/api/auth/callback/google` - Google OAuth callback
- **POST** `/api/auth/callback/github` - GitHub OAuth callback
- **GET** `/api/auth/session` - Get current session info

### Organizations
- **GET** `/api/organizations` - List user's organizations (with team counts)
- **POST** `/api/organizations` - Create new organization
- **GET/PATCH** `/api/organizations/[organizationId]/credits` - Manage credits (existing)

### Teams
- **POST** `/api/teams` - Create new team
- **GET** `/api/teams/owned` - List teams owned by user
- **GET** `/api/teams/member` - List teams where user is member
- **GET** `/api/teams/invitations` - List pending team invitations
- **POST** `/api/teams/[teamId]/invite` - Invite member to team (existing)
- **GET/PATCH** `/api/teams/[teamId]/credits` - Manage team credits (existing)

### Team Memberships
- **POST** `/api/invitations/[token]/accept` - Accept team invitation (existing)
- **POST** `/api/invitations/[token]/reject` - Reject team invitation (existing)

### Worklogs
- **GET** `/api/worklogs` - List user's worklogs
- **POST** `/api/worklogs` - Create new worklog
- **GET/PATCH/DELETE** `/api/worklogs/[worklogId]/status` - Update worklog status (existing)
- **GET/POST** `/api/worklogs/[worklogId]/ratings` - Manage worklog ratings (existing)

### Ratings
- **GET/PATCH/DELETE** `/api/ratings/[ratingId]` - Individual rating management (existing)

## Newly Created Endpoints (This Session)

### 1. Organizations
```typescript
// GET /api/organizations
// Returns: { data: Organization[] }
// Authorization: User must be authenticated
// Response:
{
  data: [
    {
      id: "org_123",
      name: "Tech Corp",
      description: "Technology company",
      credits: 100,
      teams: [{ id: "t1", name: "Frontend" }],
      _count: { teams: 1 }
    }
  ]
}

// POST /api/organizations
// Body: { name: string, description?: string }
// Response: { data: Organization }
```

### 2. Teams
```typescript
// POST /api/teams
// Body: { name: string, description?: string, project?: string, organizationId?: string }
// Returns: { data: Team }

// GET /api/teams/owned
// Returns: { data: Team[] }
// Response includes: organization, members, worklogs, counts

// GET /api/teams/member
// Returns: { data: Team[] }
// Response includes: owner, organization, member's worklogs
```

### 3. Team Invitations
```typescript
// GET /api/teams/invitations
// Returns: { data: TeamInvitation[] }
// Response includes: team details, team owner info
```

### 4. Worklogs
```typescript
// GET /api/worklogs
// Returns: { data: Worklog[] }
// Response includes: team info, ratings, sorted by createdAt desc

// POST /api/worklogs
// Body: { title: string, description: string, teamId: string, githubLink?: string }
// Returns: { data: Worklog }
// Authorization: User must be team member or owner
```

## Frontend Integration Points

### Dashboard Component (`/app/dashboard/page.tsx`)

**Data Fetching:**
```typescript
async function fetchDashboardData() {
  const [orgs, ownedTeams, memberTeams, invitations, worklogs] = await Promise.all([
    fetch("/api/organizations").then(r => r.json()),
    fetch("/api/teams/owned").then(r => r.json()),
    fetch("/api/teams/member").then(r => r.json()),
    fetch("/api/teams/invitations").then(r => r.json()),
    fetch("/api/worklogs").then(r => r.json())
  ]);
  // Update states with responses
}
```

**Create Operations:**
```typescript
// Create Organization
async function handleCreateOrganization() {
  const response = await fetch("/api/organizations", {
    method: "POST",
    body: JSON.stringify({ name: orgName, description: orgDesc })
  });
  // Refetch dashboard data
  await fetchDashboardData();
}

// Create Team
async function handleCreateTeam() {
  const response = await fetch("/api/teams", {
    method: "POST",
    body: JSON.stringify({
      name: teamName,
      project: teamProject,
      description: teamDesc,
      organizationId: teamOrg || undefined
    })
  });
  // Invite members
  for (const email of teamMembers) {
    await fetch(`/api/teams/${teamId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }
  // Refetch dashboard data
  await fetchDashboardData();
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | GET request successful |
| 201 | Created | POST resource created successfully |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User lacks permissions |
| 500 | Server Error | Database or processing error |

Example Error Response:
```json
{
  "error": "Organization not found or unauthorized"
}
```

## Authorization Checks

### Organization Endpoints
- **GET /api/organizations**: User must be authenticated
- **POST /api/organizations**: User becomes owner automatically
- **Credits**: Only organization owner can modify

### Team Endpoints
- **POST /api/teams**: If organizationId provided, user must own that organization
- **GET /api/teams/owned**: Returns only teams where user is owner
- **GET /api/teams/member**: Returns only teams with ACCEPTED membership

### Worklog Endpoints
- **GET /api/worklogs**: Returns only user's own worklogs
- **POST /api/worklogs**: User must be team member or owner

## Testing with cURL

### Get Organizations
```bash
curl -X GET http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]"
```

### Create Organization
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{"name": "My Org", "description": "Test"}'
```

### Create Team
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{
    "name": "Frontend Team",
    "project": "Website Redesign",
    "description": "Build new website",
    "organizationId": "org_123"
  }'
```

### Get Owned Teams
```bash
curl -X GET http://localhost:3000/api/teams/owned \
  -H "Cookie: [your-auth-cookie]"
```

## Response Examples

### GET /api/organizations
```json
{
  "data": [
    {
      "id": "clsabcd123",
      "name": "Tech Startup",
      "description": "Our organization",
      "credits": 500,
      "ownerId": "user123",
      "teams": [
        { "id": "t1", "name": "Engineering" }
      ],
      "_count": { "teams": 1 }
    }
  ]
}
```

### GET /api/teams/owned
```json
{
  "data": [
    {
      "id": "t1",
      "name": "Engineering",
      "description": "Development team",
      "project": "Mobile App",
      "credits": 200,
      "ownerId": "user123",
      "organizationId": "org123",
      "organization": {
        "id": "org123",
        "name": "Tech Startup"
      },
      "members": [
        {
          "id": "m1",
          "email": "dev@company.com",
          "status": "ACCEPTED",
          "user": { "name": "John Dev" }
        }
      ],
      "worklogs": [
        { "id": "w1", "progressStatus": "COMPLETED" }
      ],
      "_count": { "members": 1, "worklogs": 1 }
    }
  ]
}
```

### GET /api/worklogs
```json
{
  "data": [
    {
      "id": "w1",
      "title": "Build login page",
      "description": "Implement user authentication",
      "progressStatus": "HALF_DONE",
      "userId": "user123",
      "teamId": "t1",
      "createdAt": "2024-01-24T10:00:00Z",
      "team": {
        "id": "t1",
        "name": "Engineering",
        "owner": { "name": "John Owner" }
      },
      "ratings": []
    }
  ]
}
```

---

**Last Updated**: Today
**Status**: ✅ All endpoints implemented and tested
