# API Reference

Complete API documentation for VibeCalendar backend.

**Base URL:** `http://localhost:8787` (development)

**Authentication:** JWT token in `Authorization: Bearer {token}` header

**Content-Type:** `application/json`

---

## Auth Endpoints

### Register

**POST** `/api/auth/register`

Create a new user account.

**Request:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "secure-password-8+chars",
  "timezone": "America/New_York"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }
}
```

**Errors:**
- `400`: Invalid request (missing fields, email already exists, password too short)
- `409`: Email already in use

---

### Login

**POST** `/api/auth/login`

Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "secure-password-8+chars"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }
}
```

**Errors:**
- `400`: Invalid credentials format
- `401`: Wrong email or password

---

### Get Current User

**GET** `/api/auth/me`

Retrieve authenticated user's profile (requires auth).

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "timezone": "America/New_York",
  "locationConsent": 1,
  "socialConsent": 1,
  "calendarWriteConsent": 0
}
```

**Errors:**
- `401`: Missing or invalid token

---

## User Endpoints

### Update Privacy Consent

**PUT** `/api/users/consent`

Update user's privacy settings (requires auth).

**Request:**
```json
{
  "locationConsent": true,
  "socialConsent": true,
  "calendarWriteConsent": false
}
```

**Response (200):**
```json
{ "ok": true }
```

**Errors:**
- `400`: Invalid payload
- `401`: Not authenticated

---

## Calendar Endpoints

### List Connected Calendars

**GET** `/api/calendars`

Retrieve all connected calendars for the user (requires auth).

**Response (200):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440111",
    "provider": "google",
    "importMode": "standard",
    "accessScope": "read",
    "status": "connected",
    "syncStatus": "ok",
    "lastSyncedAt": "2026-04-28T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440222",
    "provider": "ical",
    "importMode": "hidden",
    "accessScope": "read",
    "status": "connected",
    "syncStatus": "ok",
    "lastSyncedAt": "2026-04-28T09:15:00Z"
  }
]
```

---

### Start OAuth Flow

**GET** `/api/calendars/oauth/:provider/start`

Initiate OAuth login for Google or Outlook (requires auth).

**Params:**
- `provider`: `google` or `outlook`

**Response (200):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

Redirect user to `authUrl`. After user approves, they are redirected to callback.

**Errors:**
- `400`: Invalid provider
- `500`: OAuth setup incomplete (missing env variables)

---

### OAuth Callback

**GET** `/api/calendars/oauth/:provider/callback`

Callback handler after OAuth approval. Redirects to app URL.

**Query Params:**
- `state`: CSRF token (generated on `/start`)
- `code`: Authorization code from provider

**Response (302):**
Redirects to `http://localhost:5173?oauth=google-connected`

---

### Connect iCal Feed

**POST** `/api/calendars/ical/connect`

Add an iCal feed URL (requires auth).

**Request:**
```json
{
  "url": "https://example.com/calendar.ics",
  "importMode": "hidden"
}
```

**Response (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440333",
  "provider": "ical",
  "importMode": "hidden"
}
```

**Errors:**
- `400`: Invalid URL or import mode
- `409`: Calendar already connected

---

### Sync Calendar

**POST** `/api/calendars/:id/sync`

Manually sync a calendar and import events (requires auth).

**Params:**
- `id`: Calendar ID

**Response (200):**
```json
{
  "ok": true,
  "imported": 12,
  "note": "Sync complete: 12 events imported."
}
```

For OAuth calendars: scaffolded (0 events imported, awaiting credential setup)
For iCal calendars: fetches and parses feed, creates events in DB

**Errors:**
- `404`: Calendar not found
- `401`: Not authorized (calendar belongs to another user)

---

## Event Endpoints

### List Events

**GET** `/api/events`

Fetch all events for authenticated user (requires auth).

**Query Params (optional):**
- None currently; all events returned

**Response (200):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "title": "Calculus Lecture",
    "startAt": "2026-04-28T09:00:00Z",
    "endAt": "2026-04-28T10:15:00Z",
    "effortLevel": "High",
    "sourceVisibility": "standard"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Hidden calendar block",
    "startAt": "2026-04-28T14:00:00Z",
    "endAt": "2026-04-28T15:00:00Z",
    "effortLevel": null,
    "sourceVisibility": "hidden"
  }
]
```

Events sorted by `start_at` ascending.

---

### Create Event

**POST** `/api/events`

Create a new event (requires auth). Used by quick-create feature.

**Request:**
```json
{
  "title": "Quick Event",
  "startAt": "2026-04-28T14:30:00Z",
  "endAt": "2026-04-28T15:00:00Z",
  "sourceVisibility": "standard",
  "isBusyBlockOnly": false
}
```

**Response (201):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440999",
  "title": "Quick Event",
  "startAt": "2026-04-28T14:30:00Z",
  "endAt": "2026-04-28T15:00:00Z",
  "effortLevel": null,
  "sourceVisibility": "standard"
}
```

**Errors:**
- `400`: Invalid payload (missing fields, invalid ISO dates)

---

### Update Event Effort Level

**PATCH** `/api/events/:id/effort`

Tag an event's effort level (requires auth).

**Params:**
- `id`: Event ID

**Request:**
```json
{
  "effortLevel": "High"
}
```

Valid values: `Low`, `Medium`, `High`, `Very High`

**Response (200):**
```json
{ "ok": true }
```

**Errors:**
- `400`: Invalid effort level
- `404`: Event not found
- `401`: Not authorized (event belongs to another user)

---

## Suggestion Endpoints

### Run Suggestion Engine

**POST** `/api/suggestions/run`

Analyze schedule and generate suggestions for today (requires auth).

**Request:** (empty body)

**Response (200):**
```json
{
  "createdCount": 3,
  "notificationsCount": 2
}
```

Runs the suggestion engine for the authenticated user:
1. Fetches today's events
2. Calculates gaps between events
3. Generates suggestions (recovery, study, social, etc.)
4. Applies suppression rules
5. Creates notifications (max 4/day)
6. Stores suggestions in DB

---

### List Suggestions

**GET** `/api/suggestions`

Fetch all pending suggestions for user (requires auth).

**Response (200):**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "type": "recovery",
    "title": "Take a 15-minute break",
    "rationale": "You have high-effort classes back-to-back. Recovery time is important.",
    "startAt": "2026-04-28T10:30:00Z",
    "endAt": "2026-04-28T10:45:00Z",
    "status": "pending",
    "priority": 1
  }
]
```

Sorted by `priority_score` ascending (lower = higher priority).

---

### Record Suggestion Action

**POST** `/api/suggestions/:id/action`

Mark suggestion as added to calendar or ignored (requires auth).

**Params:**
- `id`: Suggestion ID

**Request:**
```json
{
  "action": "added"
}
```

Valid values: `added`, `ignored`

**Response (200):**
```json
{ "ok": true }
```

Used for:
- Tracking user behavior (improve future suggestions)
- Suppression rules (suppress types ignored 3+ times in 7 days)
- Metrics and reporting

---

### Get Morning Summary

**GET** `/api/morning-summary`

Fetch daily summary headline and top 3 pending suggestions (requires auth).

**Response (200):**
```json
{
  "headline": "Your day looks manageable. Keep a light rhythm and protect focus windows.",
  "topSuggestions": [
    {
      "id": "...",
      "title": "Take a break after Calculus",
      "rationale": "Recovery recommended",
      "priority": 1
    }
  ],
  "summaryNotificationCreated": true
}
```

Generated at 7:30 AM server time daily via node-cron.

---

## Notification Endpoints

### List Notifications

**GET** `/api/notifications`

Fetch notification history (last 50, requires auth).

**Response (200):**
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "type": "suggestion",
    "title": "Recovery Time Available",
    "body": "You have 15 minutes free after Calculus. Perfect for a walk or snack.",
    "actionTaken": "none",
    "sentAt": "2026-04-28T10:30:00Z"
  }
]
```

Sorted by `sent_at` descending (most recent first).

---

## Friend Group Endpoints

### List Groups

**GET** `/api/groups`

Fetch all friend groups the user is member of (requires auth).

**Response (200):**
```json
[
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440001",
    "name": "Study Sprint Crew",
    "inviteCode": "vibe-study1"
  }
]
```

---

### Create Group

**POST** `/api/groups`

Create a new friend group (requires auth).

**Request:**
```json
{
  "name": "Project Buddies"
}
```

**Response (201):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440002",
  "name": "Project Buddies",
  "inviteCode": "vibe-xyz123"
}
```

User becomes owner and is auto-added to the group.

---

### Join Group

**POST** `/api/groups/join`

Join an existing friend group using invite code (requires auth).

**Request:**
```json
{
  "inviteCode": "vibe-study1",
  "sharingMode": "availability_only"
}
```

**Response (200):**
```json
{ "ok": true }
```

Valid `sharingMode` values: `availability_only`, `selected_events`

**Errors:**
- `404`: Invite code not found
- `409`: User already in group

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing the issue"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | OK - request succeeded |
| 201 | Created - resource created successfully |
| 400 | Bad Request - invalid input |
| 401 | Unauthorized - missing or invalid token |
| 404 | Not Found - resource doesn't exist |
| 409 | Conflict - resource already exists |
| 500 | Server Error - unexpected error |

---

## Example Workflows

### Workflow: User Registration and First Calendar

```bash
# 1. Register
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "MyPassword123!",
    "timezone": "America/New_York"
  }'

# Response includes token

# 2. Connect iCal (using token from step 1)
curl -X POST http://localhost:8787/api/calendars/ical/connect \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/calendar.ics",
    "importMode": "standard"
  }'

# 3. Sync calendar
curl -X POST http://localhost:8787/api/calendars/{calendarId}/sync \
  -H "Authorization: Bearer {token}"

# 4. Run suggestions
curl -X POST http://localhost:8787/api/suggestions/run \
  -H "Authorization: Bearer {token}"

# 5. Fetch suggestions
curl http://localhost:8787/api/suggestions \
  -H "Authorization: Bearer {token}"
```

### Workflow: Create Quick Event and Tag Effort

```bash
# 1. Create event via drag-to-create
curl -X POST http://localhost:8787/api/events \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Study Session",
    "startAt": "2026-04-28T14:00:00Z",
    "endAt": "2026-04-28T15:00:00Z",
    "sourceVisibility": "standard"
  }'

# Response includes event ID

# 2. Tag effort level
curl -X PATCH http://localhost:8787/api/events/{eventId}/effort \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "effortLevel": "High" }'
```

---

## Rate Limiting

Currently none. For production, implement:
- Per-user request quotas
- Per-endpoint rate limits (e.g., 100 req/min for suggestions)
- Backoff for calendar syncs

---

## Versioning

Current version: **v1** (no explicit versioning in URLs)

Future: Consider `/api/v2/...` for backwards compatibility if needed.
