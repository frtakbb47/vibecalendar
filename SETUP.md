# Development Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- SQLite (usually included with Node.js sqlite3 package)
- A code editor (VS Code recommended)

## Quick Start (One Command)

```bash
npm run start:easy
```

This automatically:
1. Creates `.env` from `.env.example` if missing
2. Runs database migrations
3. Starts both API and frontend dev servers
4. Seeds demo data

## Manual Setup

### 1. Clone and Install

```bash
git clone https://github.com/frtakbb47/vibecalendar.git
cd vibecalendar
npm install
```

### 2. Environment Configuration

Copy the template and customize:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```
NODE_ENV=development
PORT=8787
JWT_SECRET=your-secret-key-here
APP_URL=http://localhost:5173

# OAuth (optional, for real Google/Outlook integration)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
```

### 3. Database Setup

Initialize the database:

```bash
npm run db:migrate
```

This creates `server/vibecalendar.db` with all required tables.

### 4. Seed Demo Data (Optional)

```bash
npm run seed:sample
```

Creates 7 demo user accounts and 3 seeded friend groups.

### 5. Start Development Servers

**Option A: Combined (recommended)**
```bash
npm run dev:full
```

**Option B: Separate terminals**

Terminal 1 - API server:
```bash
npm run dev:server
```

Terminal 2 - Frontend dev server:
```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8787

### 6. Build for Production

```bash
npm run build
```

Creates optimized builds in `dist/` (frontend).

## Project Structure

```
VibeCalendar/
├── src/                          # React frontend
│   ├── App.tsx                   # Main component
│   ├── App.css                   # Styles
│   ├── api.ts                    # API client wrapper
│   └── main.tsx                  # Entry point
│
├── server/                       # Express API
│   ├── index.js                  # Main server / route handlers
│   ├── db.js                     # SQLite connection
│   ├── config.js                 # Configuration from .env
│   ├── migrate.js                # Migration runner
│   ├── migrations/               # SQL migration files
│   ├── services/                 # Business logic
│   │   ├── suggestionEngine.js
│   │   ├── notificationEngine.js
│   │   ├── seedData.js
│   │   └── calendarProviders.js
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── sample_data/
│   │   └── example_accounts.json # Demo accounts
│   └── seed_from_sample.js      # Idempotent seeder
│
├── tools/                        # Utility scripts
│   ├── present.mjs              # Demo launcher (seeds + runs app)
│   ├── setup-dev.mjs            # Dev environment setup
│   └── verify-demo-data.mjs     # Verify seeded data
│
├── dist/                         # Production build (generated)
├── node_modules/                 # Dependencies (gitignored)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
└── README.md                     # This file

```

## Common Tasks

### Run Tests

Currently no automated tests. Manual testing via:
```bash
npm run verify:demo  # Verify demo data integrity
npm run build        # Build and check for errors
```

### Reset Database

```bash
rm server/vibecalendar.db
npm run db:migrate
npm run seed:sample
```

### View Database

Using SQLite CLI:
```bash
sqlite3 server/vibecalendar.db
.tables
.schema events
SELECT * FROM users;
```

### Build Only

```bash
npm run build
```

Compiles TypeScript and bundles frontend via Vite.

## Troubleshooting

**Port already in use:**
- Change `PORT` in `.env` (default: 8787 for API, 5173 for frontend)
- Or kill the process: `lsof -i :8787` (macOS/Linux) or use Task Manager (Windows)

**Database locked:**
- Ensure no other process is using `server/vibecalendar.db`
- Restart the dev server

**TypeScript errors:**
- Run `npm run build` to see full error output
- Check `tsconfig.json` and ensure all types are installed

**Dependencies missing:**
```bash
rm package-lock.json node_modules
npm install
```

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [API.md](API.md) for endpoint documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Review [FEATURES.md](FEATURES.md) for feature details
