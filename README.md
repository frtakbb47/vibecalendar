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

## Support

- 📖 See [**USER_GUIDE.md**](USER_GUIDE.md) for how to use VibeCalendar
- 🛠️ See [**SETUP.md**](SETUP.md) for development help
- 🏗️ See [**ARCHITECTURE.md**](ARCHITECTURE.md) for system design
- 📡 See [**API.md**](API.md) for backend API details
- ✨ See [**FEATURES.md**](FEATURES.md) for complete feature list

---

**Let's help students find balance. 🌱**
