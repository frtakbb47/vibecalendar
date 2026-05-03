# VibeCalendar

Web-first MVP for a student calendar assistant that turns schedule gaps into healthy, practical next actions.

## Product story

VibeCalendar helps students recover time, not just manage it.

The MVP is built around one clear loop:

1. Connect a calendar.
2. See the best next action in a free gap.
3. Act with full privacy control.

What makes it easy to present:

- One visible outcome: useful suggestions in the gaps between commitments.
- Privacy is part of the demo, not hidden in settings.
- Sample accounts show different schedule patterns, from hidden blocks to overloaded days.

## What is implemented

- Full-stack web MVP (React + Express + SQLite)
- Authentication (register/login/JWT)
- Privacy consent management (location/social/write-back)
- Calendar integrations
  - Google OAuth scaffold (real flow when env vars are set)
  - Outlook OAuth scaffold (real flow when env vars are set)
  - iCal import + sync (real parsing of .ics feeds)
- Hidden calendar imports (busy blocks only)
- Effort tagging on events
- Suggestion engine with priority + suppression rules
- Notification engine with daily caps + morning summary
- Friend groups create/join with invite codes
- Full Planner month view (entire calendar at once with per-day drill-down)

## Run locally

Fastest option (one command):

1. Run:

  npm run start:easy

This command will:

- Create .env from .env.example if missing
- Run database migrations
- Start API and frontend together

Windows double-click option:

- Run start-vibecalendar.cmd

Manual option:

1. Install dependencies:

  npm install

2. Copy env template and customize:

  cp .env.example .env

3. Run migrations:

  npm run db:migrate

4. Start API + frontend:

  npm run dev:full

Frontend runs at http://localhost:5173.
API runs at http://localhost:8787.

## Demo accounts

The repository includes seeded sample accounts for presentation and testing:

- alice@student.edu / alicepass
- bob@student.edu / bobpass
- carla@student.edu / carlapass
- danielle@student.edu / daniellepass
- eric@student.edu / ericpass
- fiona@student.edu / fionapass
- grace@student.edu / gracepass

Best accounts for demoing different stories:

- Alice: full calendar with mixed effort levels.
- Bob: hidden calendar blocks only.
- Carla: stacked day with an overnight work block.
- Grace: sparse schedule for showing recovery and planning suggestions.

Recommended live demo flow:

1. Sign in with Alice or Carla.
2. Open Today and run suggestions.
3. Switch to Full Planner and show the whole month view.
4. Toggle to Week view in Planner to show an hour-by-hour timeline.
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
