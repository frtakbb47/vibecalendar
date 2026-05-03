# Architecture & Design

## System Overview

VibeCalendar is a three-tier web application designed to help students discover recovery and productive time in their schedules.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                           │
└─────────────────────────────────────────────────────────┘
                         ↕ (HTTP/REST)
┌─────────────────────────────────────────────────────────┐
│              React 18 Frontend (Vite)                    │
│  ├─ App.tsx (main component, state management)          │
│  ├─ api.ts (fetch wrapper + types)                      │
│  └─ CSS (responsive Flexbox/Grid layout)                │
└─────────────────────────────────────────────────────────┘
                         ↕ (JSON/REST)
┌─────────────────────────────────────────────────────────┐
│            Express.js API Server (Node.js ESM)          │
│  ├─ Route handlers (auth, calendars, events, etc.)      │
│  ├─ Middleware (JWT auth, CORS)                         │
│  ├─ Business logic (suggestion engine, notifications)   │
│  └─ Database abstraction (sqlite wrapper)               │
└─────────────────────────────────────────────────────────┘
                         ↕ (SQL)
┌─────────────────────────────────────────────────────────┐
│              SQLite Database                             │
│  ├─ users, privacy_consents                             │
│  ├─ connected_calendars, events                         │
│  ├─ suggestions, notifications                          │
│  └─ friend_groups, friend_group_members                 │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **React 18** + **TypeScript** for UI components
- **Vite** for build tooling and dev server (fast HMR)
- **Flexbox/Grid CSS** for responsive layout
- **Fetch API** for HTTP requests (no external HTTP client)

### Backend
- **Node.js (ESM)** runtime
- **Express.js** web framework
- **SQLite** database (file-based, no server setup)
- **node-cron** for scheduled tasks (morning summary, suggestion runs)
- **jsonwebtoken** for JWT auth
- **bcryptjs** for password hashing
- **zod** for runtime schema validation

### Key Libraries
- `sqlite3` + `sqlite` for database access
- `node-ical` for parsing iCal feeds
- `googleapis` for Google Calendar OAuth
- `@azure/msal-node` for Outlook OAuth
- `dotenv` for environment configuration

## Data Model

### Core Entities

**Users**
```
users
  ├─ id (UUID)
  ├─ name
  ├─ email (unique)
  ├─ password_hash
  ├─ timezone
  └─ timestamps
```

**Privacy Consents**
```
privacy_consents (1:1 with users)
  ├─ user_id (FK)
  ├─ location_consent (boolean)
  ├─ social_consent (boolean)
  └─ calendar_write_consent (boolean)
```

**Calendar Connections**
```
connected_calendars (many per user)
  ├─ id (UUID)
  ├─ user_id (FK)
  ├─ provider (google | outlook | ical)
  ├─ import_mode (standard | hidden)
  ├─ sync_status (idle | ok)
  └─ oauth_*_token (if OAuth)
```

**Events**
```
events (many per user, imported or user-created)
  ├─ id (UUID)
  ├─ user_id (FK)
  ├─ title (null if hidden/busy-only)
  ├─ start_at, end_at (ISO 8601)
  ├─ effort_level (Low | Medium | High | Very High)
  ├─ source_visibility (standard | hidden)
  ├─ is_busy_block_only (for privacy)
  └─ created_by (external | user)
```

**Suggestions**
```
suggestions (auto-generated from gaps)
  ├─ id (UUID)
  ├─ user_id (FK)
  ├─ type (recovery | study | social | etc.)
  ├─ title, rationale_text
  ├─ start_at, end_at (time window)
  ├─ priority_score (lower = higher priority)
  ├─ status (pending | added | ignored)
  └─ context_key (for deduplication)
```

**Notifications**
```
notifications
  ├─ id (UUID)
  ├─ user_id (FK)
  ├─ suggestion_id (FK, optional)
  ├─ notification_type (suggestion | morning_summary)
  ├─ title, body
  └─ action_taken (none | opened)
```

**Friend Groups**
```
friend_groups
  ├─ id (UUID)
  ├─ owner_user_id (FK)
  ├─ name
  ├─ invite_code (unique, for joining)

friend_group_members (join table)
  ├─ id (UUID)
  ├─ group_id (FK)
  ├─ user_id (FK)
  ├─ role (owner | member)
  └─ sharing_mode (availability_only | selected_events)
```

## Authentication & Security

### JWT Flow

1. User registers or logs in with email + password
2. Backend validates, hashes password with bcryptjs
3. Server issues JWT token (7 day expiry)
4. Frontend stores token in localStorage
5. All API requests include token in `Authorization: Bearer {token}` header
6. Middleware validates JWT on each request

### Password Security
- Passwords hashed with bcryptjs (cost factor 10)
- Never sent in plain text over HTTP (use HTTPS in production)
- No password reset flow (out of scope for MVP)

### Database Security
- Foreign key constraints enabled
- Users can only see their own data (checked in all queries)
- Cascading deletes prevent orphaned records

## Backend Architecture

### Request Lifecycle

```
HTTP Request
  ↓
CORS middleware
  ↓
JSON parser
  ↓
Route handler (if public) | JWT middleware (if protected)
  ↓
Validation (zod schema)
  ↓
Database query
  ↓
Response (JSON)
```

### Key Services

**suggestionEngine.js**
- Analyzes user's calendar for time gaps
- Generates suggestions based on:
  - Effort level of surrounding events
  - Time of day (morning recovery, lunch, etc.)
  - Suggestion history (suppression rules)
- Stores in `suggestions` table
- Priority scored (lower = more urgent)

**notificationEngine.js**
- Creates in-app notifications for new suggestions
- Morning summary at 7:30 AM (server timezone)
- Respects suppression rules (max 4/day)
- Tracks action_taken (ignored, added, opened)

**calendarProviders.js**
- OAuth flow orchestration (Google, Outlook)
- iCal feed parsing (node-ical)
- Event extraction and formatting
- Handles hidden imports (no event details stored)

**seedData.js**
- One-time setup for new users (creates default calendars)
- Demo account creation (idempotent)

## Frontend Architecture

### State Management

All state in `App.tsx` using React hooks:
- **token**: JWT stored in component and localStorage
- **user**: Current user object
- **events**: Fetched calendar events
- **suggestions**: Pending suggestions
- **notifications**: Notification history
- **groups**: Friend groups user is in
- **consent**: Privacy settings

### Key Components

**App.tsx** (main)
- Auth flow (register/login)
- Tab navigation (today, planner, calendar, groups, settings)
- Modal overlays (auth, quick-create, tour)
- Planner views (month grid, week timeline)

**Tab: Today**
- Metrics display (event count, hidden blocks, high-effort count)
- Active suggestions with action buttons
- Morning headline from summary

**Tab: Planner**
- Month view: 42-cell grid with event counts
- Week view: hour-by-hour timeline with drag-to-create
- Event stacking (greedy column algorithm for overlaps)
- Multi-day event clamping

**Tab: Calendar**
- OAuth connectors (Google, Outlook)
- iCal URL input + sync button
- Connected calendars list
- Manual effort tagging on events

**Tab: Groups**
- Create new group form
- Join group by invite code
- Display member list and invite codes

**Tab: Settings**
- Privacy consent toggles (location, social, write-back)
- Trust notes display

### UI Patterns

**Modal Overlays**
- Quick-create event modal (drag-to-create flow)
- Guided tour modal (2 steps, element highlighting)
- Responsive, centered, semi-transparent backdrop

**Planner Timeline**
- Hour-by-hour grid (40px per hour)
- Greedy column stacking for overlapping events
- Multi-day events show "continues" arrows
- Temp visual block during drag (semi-transparent highlight)

**Effort Tagging**
- Color coding in CSS (Low/Medium/High/Very High)
- Select dropdown on events
- PATCH request to update

## Event Flow: Creating a Quick Event

1. User clicks on week timeline and drags to select time
2. `onMouseDown` records startY in timeline-column
3. `onMouseMove` updates currentY (temp visual block follows cursor)
4. `onMouseUp` computes start/end times from pixel offsets
5. Rounds to 5-minute intervals
6. Modal appears showing title input + times
7. User enters title and clicks "Add"
8. Frontend calls `POST /api/events` with:
   ```json
   {
     "title": "Quick Event",
     "startAt": "2026-04-28T14:30:00Z",
     "endAt": "2026-04-28T15:00:00Z",
     "sourceVisibility": "standard"
   }
   ```
9. Backend validates, creates event in DB
10. Returns created event object
11. Frontend updates state, re-renders calendar

## Event Flow: Running Suggestions

1. User clicks "Run suggestions" button on Today tab
2. Frontend calls `POST /api/suggestions/run`
3. Backend calls suggestionEngine for user:
   - Fetches all events for today
   - Calculates gaps between events
   - Generates suggestions for each gap
   - Checks suppression rules
   - Stores in DB
4. Backend creates notifications for new suggestions
5. Frontend fetches updated suggestions and notifications
6. Displays in UI with action buttons (Add / Ignore)

## Scheduled Jobs (node-cron)

**Morning Summary (7:30 AM)**
```
cron.schedule('30 7 * * *', async () => {
  // For each user, create a morning_summary notification
  // Shows headline about today's load + top suggestions
})
```

**Suggestion Engine (every 20 minutes)**
```
cron.schedule('*/20 * * * *', async () => {
  // For each user, run suggestion engine
  // Create notifications for new suggestions
})
```

## Deployment Considerations

### Production Checklist
- [ ] Use HTTPS (not HTTP)
- [ ] Set strong JWT_SECRET env variable
- [ ] Configure CORS to specific origin (not *)
- [ ] Use persistent database (not ephemeral)
- [ ] Enable database backups
- [ ] Set NODE_ENV=production
- [ ] Use PM2 or similar for process management
- [ ] Enable request logging
- [ ] Set up monitoring and error tracking
- [ ] Review Google/Outlook OAuth credentials

### Database Migration Strategy
- Use `npm run db:migrate` to apply schema
- For schema changes, create new migration files in `server/migrations/`
- Use `INSERT OR IGNORE` for idempotent operations
- Test migrations on staging before production

## Performance Considerations

- **Frontend**: Vite HMR for fast dev, code splitting on build
- **Backend**: SQLite fast for small-medium workloads; consider PostgreSQL for scale
- **State**: Events grouped by date in useMemo (memoized computations)
- **API**: No pagination yet (assume < 100 events per user)
- **Scheduling**: node-cron may drift; consider separate job queue service at scale

## Future Enhancements

- [ ] GraphQL API (vs REST)
- [ ] Real-time updates (WebSocket)
- [ ] Push notifications (service worker)
- [ ] Mobile app (React Native)
- [ ] Recommendation ML (TensorFlow.js)
- [ ] Advanced calendar sync (incremental, bi-directional)
- [ ] Rate limiting and quotas
- [ ] Audit logging
