# User Guide

Welcome to VibeCalendar! This guide shows you how to use all features to build a healthier, more balanced schedule.

## Getting Started

### Registration

1. Open VibeCalendar app (http://localhost:5173)
2. Click "Create account"
3. Fill in:
   - **Name**: Your first and last name
   - **Email**: Your email address
   - **Password**: At least 8 characters
   - **Timezone**: Your local timezone
4. Click "Register"
5. You're logged in! Welcome to your dashboard.

### Login

1. If already registered, click "Sign in"
2. Enter email and password
3. Click "Login"
4. You'll see your Today view dashboard

---

## Understanding Your Dashboard

### Today Tab (Default)

**Your Daily Overview**

```
┌─────────────────────────────────┐
│   TODAY - April 28, 2026        │
├─────────────────────────────────┤
│ Total Events: 5  High-Effort: 2 │
│ Hidden Blocks: 1  Free Time: 6h │
├─────────────────────────────────┤
│ ⚡ Active Suggestions (3)        │
│ • Take a 15-min break (10:30am) │
│ • Study session (1:30pm)        │
│ • Recovery time (4:00pm)        │
├─────────────────────────────────┤
│ Morning Headline:                │
│ "Your day looks manageable.     │
│  Keep a light rhythm."           │
└─────────────────────────────────┘
```

**What It Shows:**
- Event count and effort distribution
- Active suggestions you can act on
- Daily message/summary

**What to Do:**
- Review suggestions (click "Add" or "Ignore")
- Click "Run suggestions" to generate new ideas
- Plan your day based on available time

---

## Connecting Your Calendars

### Why Connect?

VibeCalendar reads your existing calendars to:
- Show you all your commitments
- Suggest recovery and study time in real gaps
- Help you balance your schedule

### Connecting Google Calendar

1. Go to **Calendar Setup** tab
2. Scroll to "Connect Your Calendars"
3. Click "Connect Google"
4. You'll see Google's login screen
5. Sign in with your Google account
6. Click "Allow" when asked for permissions
7. You'll be redirected back to VibeCalendar
8. Your Google Calendar is now synced!

**What We Get:**
- Event titles, times, and durations
- Calendar color (for visual organization)
- Your recurring events

**What We Don't Get:**
- Descriptions or attachments
- Guest lists or RSVP status
- Your email

### Connecting Outlook Calendar

Same process as Google, but:
1. Click "Connect Outlook"
2. Use your Microsoft account
3. Grant calendar permissions

### Importing a Calendar Feed (iCal)

**Use for:**
- Personal calendar exports
- GitHub milestones calendar
- Trello board deadlines
- Any calendar with `.ics` feed

**Steps:**

1. **Get your iCal URL**
   - Google Calendar: Settings → Calendars → copy "Calendar address" → pick iCal format
   - Other calendars: Look for "Export" or "Share" options

2. **Add to VibeCalendar**
   - Go to **Calendar Setup** tab
   - Click "Add iCal Feed"
   - Paste your iCal URL
   - Choose import mode:
     - **Standard**: See event titles and details
     - **Hidden**: Only blocks off time (useful for sensitive calendars)
   - Click "Connect iCal"

3. **Sync**
   - Click "Sync now" to import events
   - Done! Events appear on your calendar

### Manual Effort Tagging

After connecting calendars, tag events' intensity:

1. Go to **Calendar Setup** tab
2. Scroll to "Manual Effort Tagging"
3. Find an event in the list
4. Click dropdown (shows: Low / Medium / High / Very High)
5. Select level
6. Saved automatically

**Why Effort Matters:**
- High-effort events (exams, presentations) get "Recovery" suggestions after
- Low-effort events get "Study" suggestions before
- Helps VibeCalendar understand your rhythm

---

## Using the Planner

### Month View (Full Overview)

**When to Use:** Planning your week or month ahead

**How:**
1. Click **Planner** tab
2. You'll see Month view (default)
3. Each day shows event count (e.g., "3 events")
4. Click a day to see events for that day
5. Use Previous/Next buttons to navigate months
6. Click "Today" to jump to current date

**What the Colors Mean:**
- **Light gray**: Days in previous/next month
- **White**: Current month
- **Blue outline**: Selected day
- **Bold**: Today's date

### Week View (Hour by Hour)

**When to Use:** Seeing your day in detail, creating quick events

**How:**
1. Click **Planner** tab
2. Click "Week" toggle
3. You'll see 7-day timeline with hours (midnight to 11pm)
4. Each column is one day
5. Colored blocks are your events

**Reading the Timeline:**
- **Left edge**: Hour markers (09:00, 10:00, etc.)
- **Colored block**: Event (shows title + time)
- **Gray area**: Free time
- **Thin line**: Current time (if viewing today)

**Stacking:**
- If events overlap, they stack left-to-right
- Each column shows full width (no overlap)
- Multi-day events show "→" arrow at end of day

---

## Creating Quick Events

**Perfect for:** On-the-fly scheduling (study, meals, breaks)

**Steps:**

1. Go to **Planner** → **Week** view
2. Find the time slot you want
3. Click and **drag** on the timeline column
4. A semi-transparent block follows your cursor
5. Release the mouse to finish dragging
6. **Quick-Create Modal** appears:
   ```
   Quick Event
   ─────────────────────
   2:30 PM - 3:00 PM (30 min)
   Title: [          ]
   [Add] [Cancel]
   ```
7. Type event title (or leave blank for "Quick Event")
8. Click **"Add"** to save

**What Happens:**
- Event added to your calendar
- Saved to VibeCalendar database
- Appears on timeline immediately
- Persists when you reload

**Snapping:**
- Times round to nearest 5-minute interval
- Minimum duration: 30 minutes

---

## Getting Suggestions

### What Are Suggestions?

Ideas for what to do in your free time:
- **Recovery**: Rest, walk, snack, meditation
- **Study**: Focused work, review, assignments
- **Social**: Study with friends, hang out
- **General**: Hydration breaks, meals

### Running Suggestions

1. Go to **Today** tab
2. Click "**Run suggestions**" button
3. Wait ~1 second for calculation
4. Results appear in "Active Suggestions" section

### Acting on Suggestions

Each suggestion shows:
- **Title**: What to do (e.g., "Take a 15-min break")
- **Time**: When to do it (e.g., "10:30am - 10:45am")
- **Buttons**:
  - **✓ Add**: You'll do it (marked as added)
  - **✗ Ignore**: Not interested (helps improve future suggestions)

### Morning Summary

**When:** Every day at 7:30 AM

**What You Get:**
- Headline about today's busyness
- Top 3 suggestions for today
- Encouragement message

**Where to Find It:**
- In notifications tab
- Or run suggestions manually to see today's summary

---

## Friend Groups (Study Partners)

### Why Use Groups?

- See when friends are free
- Coordinate study sessions
- Find group members with similar schedules
- Share availability (not event details by default)

### Creating a Group

1. Go to **Groups** tab
2. Click "Create New Group"
3. Enter group name (e.g., "Study Squad 2026")
4. Click "Create"
5. Group appears with:
   - Group name
   - **Invite Code** (e.g., `vibe-study1`)
   - Member count (starts with you)

### Joining a Group

1. Get invite code from friend (they share it with you)
2. Go to **Groups** tab
3. Find "Join a Group" section
4. Paste invite code
5. Choose sharing mode:
   - **Availability only** (default): Show when you're free
   - **Selected events**: Share specific event titles
6. Click "Join"
7. Group appears in "Your Groups"

### Using Groups

**See Group Details:**
1. Click on group name
2. View members + their availability
3. Find times when multiple people are free

**Sharing Availability (Future):**
- Currently groups show member list
- Future: See when members have free time

---

## Privacy & Settings

### Understanding Privacy

VibeCalendar respects your privacy:
- Your data never leaves our server
- Your password is encrypted
- Friends see only what you allow

### Adjusting Permissions

1. Go to **Settings** tab
2. You'll see three toggles:

**1. Location Context Sharing**
- [ ] Allow location sharing
- **Why**: Future: Local recommendations ("Cafe near campus?")
- **Now**: Off by default (not used yet)

**2. Friend Group Sharing**
- [x] Allow friend-group availability (ON by default)
- **Why**: Friends need to know when you're free
- **Turn off if**: You want complete privacy from groups

**3. Calendar Write-Back**
- [ ] Allow me to add suggestions to my calendar
- **Why**: Auto-add accepted suggestions to Google/Outlook
- **Status**: Not implemented yet

### Trust Notes

Below privacy settings, you'll see notes like:
- "No third-party cookies"
- "All data stored locally on our server"
- "You can delete your account anytime"

---

## Tips for Better Scheduling

### 1. Balance Effort

**Problem:** Back-to-back hard classes → burnout

**Solution:**
- Tag classes as "High" effort
- VibeCalendar suggests recovery time after
- Accept recovery suggestions

### 2. Plan Ahead

**Problem:** Always cramming last-minute

**Solution:**
- Connect assignment calendar (Google, Trello, etc.)
- Use Month view to see upcoming deadlines
- Create study blocks 3+ days before due date

### 3. Use Hidden Imports

**Problem:** Sharing calendar with roommate, don't want to share all details

**Solution:**
- Add their iCal as "Hidden" import
- See when they're busy, not what they're doing
- Prevents scheduling conflicts without invading privacy

### 4. Tag Effort Regularly

**Problem:** Suggestions not matching your reality

**Solution:**
- Tag events as you connect calendars
- Update tags if events change importance
- More data = better suggestions

### 5. Join Study Groups

**Problem:** Studying alone → hard to stay focused

**Solution:**
- Join "Study Sprint Crew" group
- See when other students are available
- Plan group study sessions

---

## Troubleshooting

### I Can't Sign In

**Check:**
1. Correct email address?
2. Correct password?
3. Account registered at this server?

**Solution:**
- Use "Create account" to register first
- Password must be 8+ characters

### Events Not Showing Up

**Check:**
1. Did you connect your calendar?
2. Did you click "Sync now"?
3. Is the calendar date range correct?

**Solution:**
- Go to Calendar Setup → click "Sync now"
- Wait a few seconds for sync to complete
- Refresh page (F5)

### Suggestions Not Appearing

**Causes:**
1. No free time today (fully booked)
2. Suggestion engine hasn't run yet
3. All previous suggestions ignored (suppression)

**Solution:**
- Click "Run suggestions" button manually
- Try a different day with more free time
- Add "Ignore" marks to specific suggestion types

### Times Are Wrong

**Problem:** Events showing at wrong time

**Cause:** Timezone mismatch

**Solution:**
- Go to Settings
- Verify your timezone is correct
- Log out and log back in
- Refresh page

### I See Demo Accounts, Not My Data

**Cause:** Database reset or seed data loaded

**Solution:**
1. Create a new account (you'll get empty calendar)
2. Or use demo accounts to test (alice@example.com / alice)

### Can't Connect Google/Outlook

**Cause:** OAuth app not configured

**Status:** This is a development limitation

**Workaround:** Use iCal import instead:
- Export your calendar as iCal
- Import the `.ics` file URL

---

## Keyboard Shortcuts

(Currently none implemented, but planned:)
- `T` → Go to Today
- `P` → Go to Planner
- `C` → Go to Calendar Setup
- `G` → Go to Groups
- `S` → Go to Settings
- `Esc` → Close modal/tour

---

## Accessibility

VibeCalendar works with:
- **Keyboard**: Tab to navigate, Enter to select
- **Screen readers**: (partial support, improving)
- **Mobile**: Responsive design (landscape recommended)
- **High contrast**: Use browser zoom if text too small

---

## Getting Help

- **In-App Tour**: Click "Start Tour" in Planner tab
- **Demo Mode**: Click "Start full demo" on login screen
- **Full Docs**: See [FEATURES.md](FEATURES.md) and [API.md](API.md)

---

## Next Steps

1. **Create account** with your email
2. **Connect a calendar** (Google, Outlook, or iCal)
3. **Sync events** by clicking "Sync now"
4. **Tag effort** on a few events
5. **Run suggestions** to see what VibeCalendar recommends
6. **Act on suggestions** (Add or Ignore)
7. **Create a quick event** by dragging on Week timeline
8. **Join a group** with friends (use demo code: vibe-study1)
9. **Adjust privacy** settings in Settings tab

---

Happy scheduling! 🌱

For developers: See [SETUP.md](SETUP.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [API.md](API.md).
