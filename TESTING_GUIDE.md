# API Testing Guide

Quick guide for testing the new backend APIs using curl or Postman.

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Authenticate via browser (Google or GitHub OAuth)
3. Get your session cookie from browser dev tools

## Testing Credits Management

### Organization Credits

**Get Organization Credits**:
```bash
GET http://localhost:3000/api/organizations/{organizationId}/credits
```

**Update Organization Credits** (Add 100 credits):
```bash
PATCH http://localhost:3000/api/organizations/{organizationId}/credits
Content-Type: application/json

{
  "action": "add",
  "amount": 100
}
```

**Set Organization Credits** (Set to 500):
```bash
PATCH http://localhost:3000/api/organizations/{organizationId}/credits
Content-Type: application/json

{
  "action": "set",
  "amount": 500
}
```

### Team Credits

**Get Team Credits**:
```bash
GET http://localhost:3000/api/teams/{teamId}/credits
```

**Add Team Credits**:
```bash
PATCH http://localhost:3000/api/teams/{teamId}/credits
Content-Type: application/json

{
  "action": "add",
  "amount": 50
}
```

## Testing Worklog Status

### Get Current Status

```bash
GET http://localhost:3000/api/worklogs/{worklogId}/status
```

**Response Example**:
```json
{
  "id": "worklog_123",
  "title": "Feature Implementation",
  "progressStatus": "STARTED",
  "updatedAt": "2025-02-06T13:42:36.000Z",
  "validNextStatuses": ["HALF_DONE"]
}
```

### Update Status

**Member updates STARTED → HALF_DONE**:
```bash
PATCH http://localhost:3000/api/worklogs/{worklogId}/status
Content-Type: application/json

{
  "status": "HALF_DONE"
}
```

**Member updates HALF_DONE → COMPLETED**:
```bash
PATCH http://localhost:3000/api/worklogs/{worklogId}/status
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Team Owner updates COMPLETED → REVIEWED**:
```bash
PATCH http://localhost:3000/api/worklogs/{worklogId}/status
Content-Type: application/json

{
  "status": "REVIEWED"
}
```

**Organization Owner updates REVIEWED → GRADED**:
```bash
PATCH http://localhost:3000/api/worklogs/{worklogId}/status
Content-Type: application/json

{
  "status": "GRADED"
}
```

### Test Invalid Transitions

**Attempting to skip a status** (should fail with 400):
```bash
PATCH http://localhost:3000/api/worklogs/{worklogId}/status
Content-Type: application/json

{
  "status": "REVIEWED"  # When current status is STARTED
}
```

**Expected Error**:
```json
{
  "error": "Invalid status transition from STARTED to REVIEWED. Valid next statuses: HALF_DONE"
}
```

## Testing Rating System

### Create Rating

**Organization Owner rates a worklog** (must be REVIEWED or GRADED):
```bash
POST http://localhost:3000/api/worklogs/{worklogId}/ratings
Content-Type: application/json

{
  "value": 8,
  "comment": "Great work on implementing this feature!"
}
```

**Response**:
```json
{
  "id": "rating_123",
  "value": 8,
  "comment": "Great work on implementing this feature!",
  "worklogId": "worklog_123",
  "raterId": "user_123",
  "createdAt": "2025-02-06T13:50:00.000Z",
  "rater": {
    "id": "user_123",
    "name": "Organization Owner",
    "email": "owner@example.com"
  }
}
```

### Get All Ratings for a Worklog

```bash
GET http://localhost:3000/api/worklogs/{worklogId}/ratings
```

### Get Single Rating

```bash
GET http://localhost:3000/api/ratings/{ratingId}
```

### Update Rating

```bash
PATCH http://localhost:3000/api/ratings/{ratingId}
Content-Type: application/json

{
  "value": 9,
  "comment": "Updated: Outstanding work!"
}
```

### Delete Rating

```bash
DELETE http://localhost:3000/api/ratings/{ratingId}
```

## Testing Authorization

### Test Forbidden Access

**Non-owner trying to access organization credits** (should return 403):
```bash
GET http://localhost:3000/api/organizations/{otherUsersOrgId}/credits
```

**Expected Response**:
```json
{
  "error": "Only organization owners can view organization credits"
}
```

**Team member trying to rate a worklog** (should return 403):
```bash
POST http://localhost:3000/api/worklogs/{worklogId}/ratings
Content-Type: application/json

{
  "value": 8,
  "comment": "Great work!"
}
```

**Expected Response**:
```json
{
  "error": "Only organization owners can rate worklogs"
}
```

## Testing Validation

### Invalid Rating Value

```bash
POST http://localhost:3000/api/worklogs/{worklogId}/ratings
Content-Type: application/json

{
  "value": 11,  # Invalid: must be 1-10
  "comment": "Great work!"
}
```

**Expected Response**:
```json
{
  "error": "Rating value must be at most 10"
}
```

### Invalid Credits Amount

```bash
PATCH http://localhost:3000/api/organizations/{organizationId}/credits
Content-Type: application/json

{
  "action": "add",
  "amount": -100  # Invalid: must be non-negative
}
```

**Expected Response**:
```json
{
  "error": "Amount must be non-negative"
}
```

## Postman Collection

For easier testing, create a Postman collection with these requests:

1. **Collection Variables**:
   - `baseUrl`: `http://localhost:3000`
   - `organizationId`: Your org ID
   - `teamId`: Your team ID
   - `worklogId`: Your worklog ID
   - `ratingId`: Your rating ID

2. **Authorization**: Use session cookies from browser

3. **Test Scenarios**:
   - Credits: Add/subtract/set operations
   - Status: Complete progression flow
   - Ratings: Create/read/update/delete cycle
   - Authorization: Test forbidden access
   - Validation: Test invalid inputs

## Testing Flow Example

Complete workflow for a new worklog:

1. **Member creates worklog** (status: STARTED)
2. **Member updates to HALF_DONE**
3. **Member updates to COMPLETED**
4. **Team Owner reviews** (status: REVIEWED)
5. **Organization Owner rates** (value: 1-10)
6. **Organization Owner grades** (status: GRADED)

---

## Common Test Cases

### ✅ Success Cases
- Organization owner can manage org credits
- Team owner can manage team credits
- Member can update worklog progress (STARTED → HALF_DONE → COMPLETED)
- Team owner can set worklog to REVIEWED
- Organization owner can rate and grade worklogs
- Valid status transitions work correctly
- Rating CRUD operations work for org owners

### ❌ Failure Cases
- Non-owner cannot access organization credits
- Non-owner cannot access team credits
- Invalid status transitions are rejected
- Non-org-owner cannot create ratings
- Ratings on worklogs not in REVIEWED/GRADED status fail
- Invalid rating values (< 1 or > 10) are rejected
- Duplicate ratings by same user are rejected
- Member cannot update worklog to REVIEWED or GRADED

---

## Error Response Format

All errors follow this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes**:
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid input or business logic violation
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

---

## Tips

1. **Use Browser DevTools** to get your session cookie:
   - Open DevTools → Application → Cookies
   - Copy the `next-auth.session-token` cookie

2. **Test in Order**:
   - First test GET endpoints (read-only)
   - Then test POST/PATCH (write operations)
   - Finally test authorization failures

3. **Reset Test Data**:
   - Use Prisma Studio to view/reset test data: `npx prisma studio`
   - Or reset database: `npx prisma migrate reset`

4. **Check Server Logs**:
   - Console logs show detailed error information
   - Useful for debugging authorization issues
