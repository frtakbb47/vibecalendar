# VibeCalendar 🌱

A student calendar assistant that helps you discover recovery and productive time in your schedule.

**Live Demo**: TBD
**GitHub**: [frtakbb47/vibecalendar](https://github.com/frtakbb47/vibecalendar)

---

## What is VibeCalendar?

VibeCalendar solves a real problem: **students don't see their free time**.

You can have 2 hours free between classes, but you don't *know* it. You're constantly in "crunch mode"—head down, grinding—missing opportunities for recovery, connection, and actually enjoying college.

**VibeCalendar changes this:**
1. **Imports** your existing calendars (Google, Outlook, iCal)
2. **Analyzes** gaps and suggests what to do (study, rest, socialize)
3. **Lets you plan** quick events right on your week view
4. **Shares availability** with study groups to find common free time

Result: You see your entire life in one place. You find time for what matters. You're less burned out.

---

## Try It Now

### Quick Start (1 command)

```bash
npm run start:easy
```

This automatically:
- Sets up your environment
- Creates the database
- Seeds demo accounts
- Starts the app

Then open http://localhost:5173 in your browser.

### Demo Accounts

Use any of these to test:

```
Alice Johnson      alice@example.com      password: alice
Bob Martinez       bob@example.com        password: bob
Carla Singh        carla@example.com      password: carla
```

(See [FEATURES.md](FEATURES.md) for all demo accounts)

---

## Features

### Core Functionality

✅ **Authentication**
- Register / Login with JWT tokens
- Privacy consent controls
- 7-day token expiry

✅ **Calendar Integration**
- Google Calendar (OAuth, read-only)
- Outlook Calendar (OAuth, read-only)
- iCal feed import (standard + hidden modes)
- Manual event creation (drag-to-create on week timeline)

✅ **Calendar Views**
- **Month View**: Full month grid with event counts
- **Week View**: Hour-by-hour timeline (7 days × 24 hours)
  - Drag-to-create events
  - Smart event stacking
  - Multi-day event clamping

✅ **Suggestions**
- Automatic gap analysis (finds free time)
- Priority-based recommendations:
  - Recovery (high-effort → rest)
  - Study (prep time → focus blocks)
  - Social (connection opportunities)
- Suppression rules (prevents notification fatigue)
- Max 4 suggestions/day

✅ **Notifications**
- In-app suggestion notifications
- Daily morning summary (7:30 AM)
- Notification history

✅ **Friend Groups**
- Create named groups (Study Squad, etc.)
- Invite friends via unique codes
- Share availability (not events)
- Seeded demo groups for testing

✅ **Privacy First**
- Hidden calendar mode (only see "busy" time)
- Consent toggles (location, social, write-back)
- All data stored server-side

✅ **Guided Tour**
- 2-step interactive walkthrough
- Element highlighting
- Keyboard navigation support

---

## What's Implemented

**Frontend (React 18 + TypeScript)**
- Complete UI (auth, dashboard, planner, settings)
- Responsive design (desktop + mobile)
- Drag-to-create events
- Quick-create modal
- Guided tour with CSS highlights
- State management (hooks)

**Backend (Node.js + Express)**
- Authentication (JWT + bcryptjs)
- Calendar sync (Google, Outlook, iCal)
- Event CRUD (create, read, update)
- Suggestion engine (gap analysis + priority)
- Notification engine (morning summary + suggestions)
- Friend groups (create, join, invite)
- Database (SQLite with migrations)

**Demo & Presentation**
- Pre-seeded accounts + calendars + events
- `npm run present` launches full demo
- Guided tour in app
- Presentation script included

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, TypeScript, Vite, CSS3 |
| **Backend** | Node.js (ESM), Express 4, SQLite |
| **Auth** | JWT, bcryptjs |
| **Schedulers** | node-cron (morning summary, suggestions) |
| **Calendar** | node-ical, googleapis, @azure/msal-node |
| **Validation** | zod |

---

## Documentation

| Guide | Purpose |
|-------|---------|
| [**SETUP.md**](SETUP.md) | Development environment, installation, troubleshooting |
| [**USER_GUIDE.md**](USER_GUIDE.md) | End-user guide, features, tips & tricks |
| [**ARCHITECTURE.md**](ARCHITECTURE.md) | System design, data model, API structure |
| [**API.md**](API.md) | Complete API reference with examples |
| [**FEATURES.md**](FEATURES.md) | Feature overview, use cases, limitations |
| [**CONTRIBUTING.md**](CONTRIBUTING.md) | Contribution guidelines, code style, workflows |

---

## Project Structure

```
VibeCalendar/
├── src/                      # React frontend
│   ├── App.tsx              # Main component (~1200 lines)
│   ├── api.ts               # API client wrapper
│   ├── App.css              # All styling
│   └── main.tsx             # Entry point
├── server/                  # Express API
│   ├── index.js             # Main server + routes
│   ├── db.js                # Database connection
│   ├── migrations/          # SQL schema
│   ├── services/            # Business logic
│   │   ├── suggestionEngine.js
│   │   ├── notificationEngine.js
│   │   └── calendarProviders.js
│   ├── middleware/          # Auth middleware
│   ├── sample_data/         # Demo accounts
│   └── seed_from_sample.js  # Idempotent seeder
├── tools/                   # Utilities
│   ├── present.mjs          # Demo launcher
│   └── setup-dev.mjs        # Dev setup script
├── dist/                    # Production build
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### For Users

1. Open http://localhost:5173
2. Register or use demo account (alice@example.com / alice)
3. Connect a calendar (Google, Outlook, or iCal)
4. Check out the **guided tour** (Planner tab)
5. See [**USER_GUIDE.md**](USER_GUIDE.md) for detailed help

### For Developers

1. Clone: `git clone https://github.com/frtakbb47/vibecalendar.git`
2. Install: `npm install`
3. Start: `npm run start:easy`
4. Read [**SETUP.md**](SETUP.md) for detailed setup & troubleshooting
5. See [**ARCHITECTURE.md**](ARCHITECTURE.md) for system design
6. Check [**API.md**](API.md) for backend endpoints
7. Review [**CONTRIBUTING.md**](CONTRIBUTING.md) before contributing

### For Presenters

```bash
npm run present
```

Automatically:
1. Seeds demo accounts + events
2. Prints demo credentials
3. Launches dev servers
4. Ready for demo walkthrough

---

## Planner Features (Core MVP)

### Month View
- Full 6-week grid
- Event count badges per day
- Quick navigation (Previous/Next/Today)
- Click day to drill down

### Week View
- Hour-by-hour timeline (00:00 - 23:59)
- 7-day columns (Sun - Sat)
- Drag-to-create events (5-min snapping)
- Smart event stacking (greedy columns)
- Multi-day event indicators (→ ←)
- Minute-accurate positioning (1px = 1.5 min)

### Quick-Create Modal
- Appears after drag on timeline
- Computes start/end times
- Title input (optional)
- Add / Cancel buttons
- Persists to backend

---

## Suggestion Engine

How suggestions work:

1. **Analyze** today's events + gaps
2. **Generate** suggestions per gap:
   - High-effort event → Recovery suggestion after
   - Morning → Study prep suggestion
   - Lunch time → Meal suggestion
3. **Score** by priority (lower = more urgent)
4. **Suppress** duplicates + ignored types
5. **Create** notifications (max 4/day)
6. **Store** in database for history

**Actions:**
- ✓ Add: User will do it (tracks behavior)
- ✗ Ignore: Not interested (improves future suggestions)

---

## Notification System

**Morning Summary (7:30 AM)**
- Headline: "Your day is packed. Find recovery time." vs. "Manageable day, plenty of focus time."
- Top 3 pending suggestions
- Encouragement message

**Suggestion Notifications**
- Generated when suggestions created
- Click to view full details
- Tracked (added/ignored/opened)

**Suppression Rules**
- Max 4/day per user
- No duplicate suggestions for same gap
- Don't suggest type if ignored 3+ times in 7 days

---

## Friend Groups

**Why Use:**
- See when study partners are free
- Coordinate group study sessions
- Share availability (not event details)

**How:**
1. **Create** group → Get invite code
2. **Invite** friends (share code)
3. **Friends join** → See each other's availability
4. **Plan** together on shared calendars

**Demo Groups** (seeded):
- Study Sprint Crew (`vibe-study1`)
- Gym + Recovery Buddies (`vibe-recover`)
- Project Night Owls (`vibe-night1`)

---

## Privacy

- ✅ **No third-party tracking**
- ✅ **Hidden calendar mode** (only mark time as busy)
- ✅ **Privacy consent toggles** (location, social, write-back)
- ✅ **All data server-side** (not in browser storage)
- ✅ **No password resets in plain email** (out of scope for MVP)

---

## Build & Deploy

### Production Build

```bash
npm run build
```

Creates optimized production build in `dist/`:
- ~32 JS modules (React + utils)
- ~170KB JS gzipped
- ~7.5KB CSS gzipped
- TypeScript type checking

### Start Production Server

```bash
NODE_ENV=production npm run dev:server
```

Configure `.env`:
```env
NODE_ENV=production
PORT=8787
JWT_SECRET=long-random-secret-here
APP_URL=https://your-domain.com
```

---

## Roadmap

### Completed ✅
- Full-stack MVP (React + Express + SQLite)
- Auth, privacy consent, calendar integrations
- Suggestion engine with priority + suppression
- Notification system (morning summary + suggestions)
- Friend groups (create/join/invite)
- Planner (month + week views)
- Drag-to-create + quick-create modal
- Guided tour
- Demo mode
- GitHub deployment
- Comprehensive documentation

### In Progress 🔄
- OAuth credential setup guide

### Planned 📋
- Real-time updates (WebSocket)
- Push notifications (service worker)
- Mobile app (React Native)
- AI recommendations (TensorFlow.js)
- Bi-directional calendar sync
- Dark mode
- Advanced accessibility

---

## Known Limitations

1. **OAuth**: Google/Outlook scaffolded (need `.env` config)
2. **Write-back**: Can't add suggestions back to source calendars
3. **Timezone**: Morning summary 7:30 AM server time (not per-user)
4. **Scalability**: Untested with > 100 events/day
5. **Mobile**: Week timeline best on desktop (needs wider screen)

---

## Contributing

We welcome contributions! See [**CONTRIBUTING.md**](CONTRIBUTING.md) for:
- Code style & standards
- Development workflow
- Pull request process
- Testing expectations

---

## License

(Add your license here, e.g., MIT)

---

## Team

Created by: Your Team / Organization
Contact: your-email@example.com

---

## Support

- 📖 See [**USER_GUIDE.md**](USER_GUIDE.md) for how to use VibeCalendar
- 🛠️ See [**SETUP.md**](SETUP.md) for development help
- 🏗️ See [**ARCHITECTURE.md**](ARCHITECTURE.md) for system design
- 📡 See [**API.md**](API.md) for backend API details
- ✨ See [**FEATURES.md**](FEATURES.md) for complete feature list

---

**Let's help students find balance. 🌱**
  - Use Week view to demonstrate scheduling conflicts, hidden busy blocks, and exact timing for suggestions.
5. Switch to Friend Groups and show seeded groups + invite codes.
4. Switch to Friend Groups and show seeded groups + invite codes.
5. Switch to Calendar Setup and show hidden imports.
6. Switch to Settings and show privacy controls.
7. Optional: show demo accounts on the login screen for quick switching.

Seeded demo friend groups:

- Study Sprint Crew (`vibe-study1`)
- Gym + Recovery Buddies (`vibe-recover`)
- Project Night Owls (`vibe-night1`)

Planner views

- Month: high-level month grid with counts per day and quick drill-down.
- Week: hour-by-hour timeline useful for showing overlaps and exact suggestion placement.

Quick demo button

On the login screen there is also a "Start full demo" button which will auto-login as Alice and run a short 3-step guided walkthrough (Today → Calendar → Settings). Use this for a fast in-person demo.

## Notification logic implemented

- Priority order:
  1. Recovery after high-effort blocks
  2. Eat/hydration windows
  3. Study prep opportunities
  4. General recovery
- Suppression:
  - No duplicate pending suggestion for same gap/context
  - Suppress suggestion types ignored 3+ times in last 7 days
  - Max 4 suggestion notifications per day
- Morning summary:
  - Generated once per day per user
  - Scheduler at 7:30 local server time

## API highlights

- Auth:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me
- Consent:
  - PUT /api/users/consent
- Calendars:
  - GET /api/calendars
  - GET /api/calendars/oauth/:provider/start
  - GET /api/calendars/oauth/:provider/callback
  - POST /api/calendars/ical/connect
  - POST /api/calendars/:id/sync
- Events:
  - GET /api/events
  - PATCH /api/events/:id/effort
- Suggestions:
  - POST /api/suggestions/run
  - GET /api/suggestions
  - POST /api/suggestions/:id/action
  - GET /api/morning-summary
- Notifications:
  - GET /api/notifications
- Friend groups:
  - GET /api/groups
  - POST /api/groups
  - POST /api/groups/join

## Notes

- Google/Outlook event import is scaffolded via OAuth; production event pull logic can be expanded after credentials are configured.
- iCal sync is fully functional for feed imports.
- Sample/demo data is available locally through `npm run seed:sample` and `npm run setup:dev`.

## Presenting the MVP (quick guide)

Use this minimal flow to present the app in 3–6 minutes with the key stories visible.

- Prepare (one-time on machine):

  1. Install and build:

     npm install
     npm run build

  2. Ensure demo data is present:

     npm run seed:sample

- Quick start (development / live demo):

  1. Start the app (API + frontend):

     npm run start:easy

  2. Open the app in a browser: http://localhost:5173

- Short present flow (3–6 minutes):

  1. Login as `alice@student.edu` / `alicepass` (or use the "Start full demo" button).
  2. Show the Today view and run `Run suggestions` for a live example.
  3. Open Planner → Month to show the full-calendar map.
  4. Switch Planner → Week to demo minute-accurate placement.
     - Click-and-drag on a timeline column to create a quick event (temporary; the modal will appear). This demonstrates scheduling UX and exact timing without persisting to the backend.
  5. Open Friend Groups to show seeded groups and invite codes (e.g., `vibe-study1`).
  6. Open Calendar Setup to highlight hidden iCal imports and privacy controls.

- Notes & talking points:

  - Privacy-first imports: hidden imports only block time, never reveal private event details.
  - Suggestion engine: morning summary + gap-based suggestions; suppression rules prevent noise.
  - Demo limitations: quick-create currently adds the event in-memory for demo only; I can add backend persistence on request.

If you'd like, I can (pick one):

- Add persistence for quick-create so created events save to the backend during presentation.
- Implement the guided tour that walks attendees through the Week view and Planner features.
- Add a single `npm run present` script that seeds data, runs the app, and prints suggested login credentials.
