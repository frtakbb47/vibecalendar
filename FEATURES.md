# Features

Comprehensive overview of VibeCalendar features and how to use them.

## Core Features

### 1. Authentication & User Accounts

**Register**
- Create account with email, name, password, timezone
- Password validated (≥8 characters)
- Auto-creates default privacy settings

**Login**
- Email + password authentication
- JWT token issued (7-day expiry)
- Token persisted in localStorage for persistence across sessions

**Privacy Consent**
- Location context sharing (optional)
- Social/friend group data sharing (default: on)
- Calendar write-back consent (default: off)
- All consent choices visible in Settings

---

### 2. Calendar Integration

#### Google Calendar

**How to Connect:**
1. Settings → Calendar Setup → Connect Google
2. Redirects to Google OAuth consent screen
3. After approval, Google Calendar events sync

**Features:**
- OAuth 2.0 flow (credentials required in `.env`)
- Reads calendar events via Google Calendar API
- Imports event title, time, duration
- Supports multiple calendars (primary)

#### Outlook Calendar

**How to Connect:**
1. Settings → Calendar Setup → Connect Outlook
2. Redirects to Microsoft OAuth consent screen
3. After approval, Outlook Calendar events sync

**Features:**
- OAuth 2.0 flow via Azure (credentials required in `.env`)
- Similar to Google Calendar integration
- Reads Outlook calendar events

#### iCal Import

**How to Connect:**
1. Calendar Setup → Add iCal URL
2. Paste feed URL (e.g., from Trello, GitHub, or personal calendar)
3. Select import mode (standard or hidden)
4. Click "Connect iCal"

**Features:**
- Real iCal parsing (node-ical library)
- Supports `.ics` file feeds
- Two import modes:
  - **Standard**: Full event details (title, description)
  - **Hidden**: Only marks time as busy (no details stored)
- Manual sync button or auto-sync on schedule

**Example iCal URLs:**
- Personal calendar export
- GitHub issue milestones
- Trello board
- Any RFC 5545 compliant feed

---

### 3. Calendar Views

#### Month View (Planner)

**How to Access:**
1. Dashboard → Full Planner tab
2. Toggle to "Month" view (default)

**Features:**
- 42-cell calendar grid (6 weeks)
- Event count badge per day
- Clicking day shows event list (below grid)
- Navigate months with Previous/Next buttons
- Jump to today with "Today" button
- Visual selection highlight on selected day
- Days outside current month shown in lighter shade

**Use Cases:**
- Overview of entire month
- Identify busy vs. free days
- Plan ahead for high-load periods
- Quick drill-down to specific day

#### Week View (Planner)

**How to Access:**
1. Dashboard → Full Planner tab
2. Toggle to "Week" view

**Features:**
- Hour-by-hour timeline (00:00 - 23:00)
- 7 columns (one per day of week)
- Events displayed as blocks with exact positioning
- Multi-day events show "continues" arrows (← →)
- Overlapping events stacked (greedy column algorithm)
- Color-coding by source visibility (standard vs. hidden)
- Minute-accurate placement (1px = 1/40 hour = 1.5 minutes)

**Guided Tour:**
- Click "Start Tour" button in Planner header
- Step 1: Explains Month view
- Step 2: Explains Week view + drag-to-create
- Week timeline highlights with glowing border
- Closes on "Finish"

**Drag-to-Create:**
1. Click on timeline column and drag to select time
2. Release to open quick-create modal
3. Enter event title
4. Click "Add" to persist to backend

---

### 4. Event Management

#### View Events

**Today Tab:**
- Metric cards: total events, hidden blocks, high-effort count
- List all events for today with time + effort level
- Filter by effort level (if UI added in future)

**Planner → Month:**
- Event count per day
- Quick list of top 3 events per day
- "+N more" indicator if > 3 events

**Planner → Week:**
- All events for the week on timeline
- Exact visual positioning
- Hover for more details (if tooltip added)

#### Create Event (Quick-Create)

**How to Create:**
1. Open Planner → Week view
2. Click and drag on timeline column
3. Modal appears with:
   - Computed start/end times
   - Title input field
   - Add / Cancel buttons
4. Enter title (optional, defaults to "Quick Event")
5. Click "Add"

**Backend Behavior:**
- `POST /api/events` with title, startAt, endAt
- Returns created event object
- Event immediately visible on calendar
- Persists across sessions

**Rounding:**
- Times snapped to 5-minute intervals
- Minimum duration: 30 minutes (auto-extended if too short)

#### Update Event Effort

**How to Tag:**
1. Calendar Setup tab
2. Scroll to "Manual Effort Tagging"
3. Each event shows a dropdown (Low/Medium/High/Very High)
4. Select effort level
5. Saved immediately via PATCH request

**Why It Matters:**
- Suggestion engine uses effort levels to prioritize recovery
- High-effort classes identified for "recovery" suggestions
- Helps prevent burnout by balancing load

---

### 5. Suggestions & Recommendations

#### Run Suggestions

**How to Use:**
1. Today tab
2. Click "Run suggestions" button
3. Backend analyzes today's schedule
4. Returns suggestions in real-time

**How It Works:**
1. Fetches all events for today
2. Calculates gaps (time between events)
3. Generates suggestions for each gap:
   - **Recovery**: After high-effort events
   - **Study**: Before/during free time
   - **Social**: Between individual work sessions
   - **Hydration/Food**: Mid-morning, lunch time
4. Applies suppression rules (avoids duplicate suggestions)
5. Scores by priority (lower = more urgent)
6. Creates notifications (max 4/day)

#### View Suggestions

**Today Tab:**
- "Active Suggestions" section
- Shows up to 3 pending suggestions
- Each shows: title, time window, action buttons

**Available Actions:**
- "Add": Marks suggestion as added (user took action)
- "Ignore": Marks suggestion as ignored (improves suppression)

#### Morning Summary

**When:**
- Generated daily at 7:30 AM (server timezone)
- Available via GET /api/morning-summary

**Contains:**
- Headline: contextual message about today's load
  - "Your day looks manageable..." if < 5 events
  - "Today is packed..." if > 4 events
- Top 3 pending suggestions
- Event count + open suggestion count

---

### 6. Notifications

#### In-App Notifications

**Types:**
- **Suggestion**: New suggestion available for gap
- **Morning Summary**: Daily summary at 7:30 AM

**Where:**
- Notification History tab (Today section)
- Shows last 50 notifications
- Sorted by most recent first

**Tracking:**
- Logged when sent
- Records if user opened (for analytics)
- Links to suggestion for context

#### Suppression Rules

**Prevent Notification Fatigue:**
- Max 4 notification per day per user
- No duplicate suggestions for same gap
- Don't suggest type if ignored 3+ times in last 7 days

---

### 7. Friend Groups

#### Create Group

**How to Create:**
1. Groups tab
2. Enter group name (e.g., "Study Squad")
3. Click "Create group"
4. Group appears in "Your groups" list with invite code

**Ownership:**
- Creator is group owner
- Auto-added as first member

#### Join Group

**How to Join:**
1. Groups tab
2. Enter invite code (from friend)
3. Click "Join group"
4. Group appears in "Your groups"

**Sharing Modes (on join):**
- **Availability only** (default): Share just free/busy status
- **Selected events**: Share specific event titles (not implemented in MVP)

#### View Groups

**Your Groups:**
- List of all groups you're member of
- Shows: group name, invite code, member count
- Copy invite code to share with friends

**Seeded Groups (Demo):**
- Study Sprint Crew (`vibe-study1`)
- Gym + Recovery Buddies (`vibe-recover`)
- Project Night Owls (`vibe-night1`)

---

### 8. Privacy & Settings

#### Hidden Calendar Import

**Use Case:**
- Import shared calendar (partner, roommate, etc.)
- Block time without revealing event details

**How It Works:**
1. Connect → iCal URL
2. Select "Hidden import mode"
3. Sync calendar
4. Events appear as "Hidden calendar block" on timeline
5. No title, description, or location stored

**Visual Indicator:**
- Hidden events styled differently (lighter color)
- Labeled as "Private busy block" in event details

#### Privacy Consent

**Settings Tab:**
- **Allow coarse location context** (optional)
  - For future: location-based suggestions
- **Allow friend-group availability suggestions** (default on)
  - Share your gaps with friend groups
- **Allow write-back** (optional)
  - Auto-add suggestions to calendar

**Changes Saved:** Click "Save consent" button

---

### 9. Demo Mode

#### Quick Demo Button

**Location:** Login screen

**Steps:**
1. Click "Start full demo"
2. Auto-logs in as Alice
3. Shows 3-step guided walkthrough:
   - Step 1: Today view (today's story, suggestions)
   - Step 2: Calendar Setup (imports, integrations)
   - Step 3: Settings (privacy controls)
4. Buttons: Next, Exit, Compact mode

**Compact Mode:**
- Hides tabs
- Shows only Today view
- Useful for presenter or small screen

#### Guided Tour

**Location:** Planner tab

**Steps:**
1. Click "Start Tour" button
2. Modal opens (step 1):
   - Explains Month view features
   - Button: "Next"
3. Auto-switches to Week view
4. Modal shows (step 2):
   - Explains Week timeline and drag-to-create
   - Button: "Finish"
5. On finish: tour closes, demo presentation ends

**Visual Highlight:**
- Week timeline gets glowing border during step 2
- Subtle transform effect to draw attention

---

## Planned/Future Features

- [ ] Push notifications (service worker)
- [ ] Mobile app (React Native)
- [ ] AI/ML recommendations (TensorFlow.js)
- [ ] Bi-directional calendar sync (write events back)
- [ ] Advanced filtering (effort, category, duration)
- [ ] Calendar sharing (view others' availability)
- [ ] Custom reminders & alerts
- [ ] Habit tracking (study streaks, recovery patterns)
- [ ] Integration with habit apps (Habitica, Streaks, etc.)
- [ ] Dark mode
- [ ] Accessibility improvements (better keyboard nav, screen reader)

---

## Usage Scenarios

### Scenario 1: Overworked Student

**Problem:** Alice is overwhelmed with back-to-back classes + assignments

**Solution:**
1. Connect Google Calendar (imports classes)
2. Tag high-effort events (exams, project deadlines)
3. Run suggestions
4. Gets "Recovery" recommendations in gaps
5. Joins "Gym + Recovery Buddies" to see when friends are free
6. Schedules recovery activities (walk, meal, rest)

### Scenario 2: Procrastinator

**Problem:** Bob can't find time to start assignments until last minute

**Solution:**
1. Import Trello board as iCal (assignment deadlines)
2. Enable hidden import for work calendar
3. Week view shows all deadlines + gaps
4. Gets "Study prep" suggestions for future gaps
5. Drag-to-create 30-min study blocks on Week timeline
6. Notifications remind him to start earlier

### Scenario 3: Social Butterfly

**Problem:** Carla wants to study with friends but schedules conflict

**Solution:**
1. Creates "Study Sprint Crew" friend group
2. Invites study partners (shares availability)
3. Sees gaps when all are free
4. Suggestion suggests time when group is available
5. Drag-to-create group study event
6. All see blocked time on Week view

---

## Tips & Tricks

- **Bulk Import**: Export calendar as iCal, import via Feed
- **Privacy First**: Use hidden imports for sensitive calendars
- **Mobile View**: Responsive design works on phones (landscape recommended for timeline)
- **Timezone**: Set timezone on registration; affects all times and scheduler
- **Demo Data**: Run `npm run seed:sample` to reset to demo accounts
- **Quick Setup**: `npm run start:easy` for one-command launch

---

## Limitations & Known Issues

1. **OAuth**: Google/Outlook integration scaffolded (requires credentials in `.env`)
2. **Bi-directional Sync**: Events added in VibeCalendar don't write back to source calendars
3. **Timezone**: Assumes server timezone for morning summary (7:30 AM). Per-user timezone for actual suggestion rendering but scheduler is server-based.
4. **Event Capacity**: Not tested with > 100 events per day (may have rendering performance issues)
5. **No Undo**: Deleted events can't be recovered (from DB only)
6. **Limited Mobile**: Touch support works but Week timeline is best on desktop (wider screen)

---

For more details, see [API.md](API.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
