import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { z } from 'zod';
import { config } from './config.js';
import { getDb } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { exchangeOauthCode, getOauthStartPayload, pullIcalEvents } from './services/calendarProviders.js';
import { createMorningSummaryNotification, createSuggestionNotifications } from './services/notificationEngine.js';
import { seedUserDataIfEmpty } from './services/seedData.js';
import { runSuggestionEngine } from './services/suggestionEngine.js';

const app = express();

app.use(cors({ origin: config.appUrl, credentials: true }));
app.use(express.json());

function makeToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name
        },
        config.jwtSecret,
        { expiresIn: '7d' }
    );
}

app.get('/api/health', async (_request, response) => {
    response.json({ ok: true, service: 'vibecalendar-api' });
});

app.post('/api/auth/register', async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        timezone: z.string().min(2).optional()
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
        return;
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', parsed.data.email.toLowerCase());
    if (existing) {
        response.status(409).json({ error: 'Email is already in use.' });
        return;
    }

    const now = new Date().toISOString();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await db.run(
        `INSERT INTO users (id, name, email, password_hash, timezone, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        userId,
        parsed.data.name,
        parsed.data.email.toLowerCase(),
        passwordHash,
        parsed.data.timezone || 'America/New_York',
        now,
        now
    );

    await db.run(
        `INSERT INTO privacy_consents (user_id, location_consent, social_consent, calendar_write_consent, updated_at)
		 VALUES (?, 0, 1, 0, ?)`,
        userId,
        now
    );

    await seedUserDataIfEmpty(db, userId);

    const token = makeToken({ id: userId, email: parsed.data.email.toLowerCase(), name: parsed.data.name });
    response.status(201).json({
        token,
        user: {
            id: userId,
            name: parsed.data.name,
            email: parsed.data.email.toLowerCase()
        }
    });
});

app.post('/api/auth/login', async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1)
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid credentials payload.' });
        return;
    }

    const user = await db.get(
        'SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ?',
        parsed.data.email.toLowerCase()
    );

    if (!user) {
        response.status(401).json({ error: 'Invalid email or password.' });
        return;
    }

    const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!validPassword) {
        response.status(401).json({ error: 'Invalid email or password.' });
        return;
    }

    const token = makeToken(user);
    response.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', requireAuth, async (request, response) => {
    const db = await getDb();
    const user = await db.get(
        `SELECT u.id, u.name, u.email, u.timezone,
						pc.location_consent AS locationConsent,
						pc.social_consent AS socialConsent,
						pc.calendar_write_consent AS calendarWriteConsent
		 FROM users u
		 LEFT JOIN privacy_consents pc ON pc.user_id = u.id
		 WHERE u.id = ?`,
        request.user.id
    );

    response.json(user);
});

app.put('/api/users/consent', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        locationConsent: z.boolean(),
        socialConsent: z.boolean(),
        calendarWriteConsent: z.boolean()
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid consent payload.' });
        return;
    }

    await db.run(
        `UPDATE privacy_consents
		 SET location_consent = ?, social_consent = ?, calendar_write_consent = ?, updated_at = ?
		 WHERE user_id = ?`,
        parsed.data.locationConsent ? 1 : 0,
        parsed.data.socialConsent ? 1 : 0,
        parsed.data.calendarWriteConsent ? 1 : 0,
        new Date().toISOString(),
        request.user.id
    );

    response.json({ ok: true });
});

app.get('/api/calendars', requireAuth, async (request, response) => {
    const db = await getDb();
    const calendars = await db.all(
        `SELECT id, provider, import_mode AS importMode, access_scope AS accessScope, status, sync_status AS syncStatus, last_synced_at AS lastSyncedAt
		 FROM connected_calendars
		 WHERE user_id = ?
		 ORDER BY created_at DESC`,
        request.user.id
    );

    response.json(calendars);
});

app.get('/api/calendars/oauth/:provider/start', requireAuth, async (request, response) => {
    const db = await getDb();
    const provider = request.params.provider;
    if (!['google', 'outlook'].includes(provider)) {
        response.status(400).json({ error: 'Unsupported provider.' });
        return;
    }

    const state = randomUUID();
    await db.run(
        'INSERT INTO oauth_states (state, user_id, provider, created_at) VALUES (?, ?, ?, ?)',
        state,
        request.user.id,
        provider,
        new Date().toISOString()
    );

    const payload = await getOauthStartPayload(provider, state);
    response.json(payload);
});

app.get('/api/calendars/oauth/:provider/callback', async (request, response) => {
    const db = await getDb();
    const provider = request.params.provider;
    const state = String(request.query.state || '');
    const code = String(request.query.code || '');

    const stateRow = await db.get(
        'SELECT state, user_id AS userId, provider FROM oauth_states WHERE state = ?',
        state
    );

    if (!stateRow || stateRow.provider !== provider) {
        response.status(400).send('OAuth state validation failed.');
        return;
    }

    const tokens = await exchangeOauthCode(provider, code);
    const now = new Date().toISOString();
    await db.run(
        `INSERT INTO connected_calendars (
			id, user_id, provider, provider_calendar_id, access_scope, import_mode,
			status, oauth_access_token, oauth_refresh_token, sync_status, created_at, updated_at
		) VALUES (?, ?, ?, ?, 'read', 'standard', 'connected', ?, ?, 'idle', ?, ?)`,
        randomUUID(),
        stateRow.userId,
        provider,
        `${provider}-primary`,
        tokens.accessToken,
        tokens.refreshToken,
        now,
        now
    );

    await db.run('DELETE FROM oauth_states WHERE state = ?', state);
    response.redirect(`${config.appUrl}?oauth=${provider}-connected`);
});

app.post('/api/calendars/ical/connect', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        url: z.string().url(),
        importMode: z.enum(['standard', 'hidden']).default('hidden')
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid iCal connection payload.' });
        return;
    }

    const now = new Date().toISOString();
    const calendarId = randomUUID();
    await db.run(
        `INSERT INTO connected_calendars (
			id, user_id, provider, provider_calendar_id, access_scope, import_mode, status,
			sync_status, created_at, updated_at
		) VALUES (?, ?, 'ical', ?, 'read', ?, 'connected', 'idle', ?, ?)`,
        calendarId,
        request.user.id,
        parsed.data.url,
        parsed.data.importMode,
        now,
        now
    );

    response.status(201).json({ id: calendarId, provider: 'ical', importMode: parsed.data.importMode });
});

app.post('/api/calendars/:id/sync', requireAuth, async (request, response) => {
    const db = await getDb();
    const calendar = await db.get(
        `SELECT id, provider, provider_calendar_id AS providerCalendarId, import_mode AS importMode
		 FROM connected_calendars
		 WHERE id = ? AND user_id = ?`,
        request.params.id,
        request.user.id
    );

    if (!calendar) {
        response.status(404).json({ error: 'Calendar not found.' });
        return;
    }

    if (calendar.provider !== 'ical') {
        await db.run(
            `UPDATE connected_calendars
			 SET sync_status = 'ok', last_synced_at = ?, updated_at = ?
			 WHERE id = ?`,
            new Date().toISOString(),
            new Date().toISOString(),
            calendar.id
        );
        response.json({ ok: true, imported: 0, note: 'OAuth sync scaffolded. Connect provider credentials to import events.' });
        return;
    }

    const importedEvents = await pullIcalEvents(calendar.providerCalendarId);
    const now = new Date().toISOString();
    let imported = 0;

    for (const event of importedEvents.slice(0, 30)) {
        await db.run(
            `INSERT INTO events (
				id, user_id, connected_calendar_id, title, description, location_text,
				start_at, end_at, source_visibility, is_busy_block_only, created_by, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'external', ?, ?)`,
            randomUUID(),
            request.user.id,
            calendar.id,
            calendar.importMode === 'hidden' ? null : event.title,
            calendar.importMode === 'hidden' ? null : event.description,
            calendar.importMode === 'hidden' ? null : event.locationText,
            event.startAt,
            event.endAt,
            calendar.importMode === 'hidden' ? 'hidden' : 'standard',
            calendar.importMode === 'hidden' ? 1 : 0,
            now,
            now
        );
        imported += 1;
    }

    await db.run(
        `UPDATE connected_calendars
		 SET sync_status = 'ok', last_synced_at = ?, updated_at = ?
		 WHERE id = ?`,
        now,
        now,
        calendar.id
    );

    response.json({ ok: true, imported });
});

app.get('/api/events', requireAuth, async (request, response) => {
    const db = await getDb();
    const events = await db.all(
        `SELECT id, COALESCE(title, 'Hidden calendar block') AS title, start_at AS startAt,
						end_at AS endAt, effort_level AS effortLevel, source_visibility AS sourceVisibility
		 FROM events
		 WHERE user_id = ?
		 ORDER BY start_at ASC`,
        request.user.id
    );
    response.json(events);
});

app.post('/api/events', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        title: z.string().min(1).optional(),
        startAt: z.string().min(1),
        endAt: z.string().min(1),
        sourceVisibility: z.enum(['standard', 'hidden']).optional(),
        isBusyBlockOnly: z.boolean().optional()
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid event payload.' });
        return;
    }

    const now = new Date().toISOString();
    const eventId = randomUUID();

    await db.run(
        `INSERT INTO events (
            id, user_id, connected_calendar_id, title, description, location_text,
            start_at, end_at, source_visibility, is_busy_block_only, effort_level, created_by, created_at, updated_at
        ) VALUES (?, ?, NULL, ?, NULL, NULL, ?, ?, ?, ?, NULL, 'user', ?, ?)`,
        eventId,
        request.user.id,
        parsed.data.title || null,
        parsed.data.startAt,
        parsed.data.endAt,
        parsed.data.sourceVisibility || 'standard',
        parsed.data.isBusyBlockOnly ? 1 : 0,
        now,
        now
    );

    const created = await db.get(
        `SELECT id, COALESCE(title, 'Hidden calendar block') AS title, start_at AS startAt, end_at AS endAt, effort_level AS effortLevel, source_visibility AS sourceVisibility
         FROM events WHERE id = ?`,
        eventId
    );

    response.status(201).json(created);
});

app.patch('/api/events/:id/effort', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        effortLevel: z.enum(['Low', 'Medium', 'High', 'Very High'])
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid effort payload.' });
        return;
    }

    await db.run(
        'UPDATE events SET effort_level = ?, updated_at = ? WHERE id = ? AND user_id = ?',
        parsed.data.effortLevel,
        new Date().toISOString(),
        request.params.id,
        request.user.id
    );

    response.json({ ok: true });
});

app.post('/api/suggestions/run', requireAuth, async (request, response) => {
    const db = await getDb();
    const created = await runSuggestionEngine(db, request.user.id);
    const notifications = await createSuggestionNotifications(db, request.user.id);
    response.json({ createdCount: created.length, notificationsCount: notifications.length });
});

app.get('/api/suggestions', requireAuth, async (request, response) => {
    const db = await getDb();
    const suggestions = await db.all(
        `SELECT id, type, title, rationale_text AS rationale, start_at AS startAt,
						end_at AS endAt, status, priority_score AS priority
		 FROM suggestions
		 WHERE user_id = ?
		 ORDER BY priority_score ASC, created_at DESC`,
        request.user.id
    );
    response.json(suggestions);
});

app.post('/api/suggestions/:id/action', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({ action: z.enum(['added', 'ignored']) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid suggestion action payload.' });
        return;
    }

    await db.run(
        `UPDATE suggestions
		 SET status = ?, acted_at = ?
		 WHERE id = ? AND user_id = ?`,
        parsed.data.action,
        new Date().toISOString(),
        request.params.id,
        request.user.id
    );

    response.json({ ok: true });
});

app.get('/api/morning-summary', requireAuth, async (request, response) => {
    const db = await getDb();
    const summaryNotification = await createMorningSummaryNotification(db, request.user.id);
    const topSuggestions = await db.all(
        `SELECT id, title, rationale_text AS rationale, priority_score AS priority
		 FROM suggestions
		 WHERE user_id = ? AND status = 'pending'
		 ORDER BY priority_score ASC, created_at DESC
		 LIMIT 3`,
        request.user.id
    );

    const eventCount = await db.get(
        `SELECT COUNT(*) AS total FROM events
		 WHERE user_id = ? AND date(start_at) = date('now')`,
        request.user.id
    );

    response.json({
        headline:
            (eventCount?.total || 0) > 4
                ? 'Today is packed. Prioritize recovery moments between classes.'
                : 'Your day looks manageable. Keep a light rhythm and protect focus windows.',
        topSuggestions,
        summaryNotificationCreated: Boolean(summaryNotification)
    });
});

app.get('/api/notifications', requireAuth, async (request, response) => {
    const db = await getDb();
    const notifications = await db.all(
        `SELECT id, notification_type AS type, title, body, action_taken AS actionTaken, sent_at AS sentAt
		 FROM notifications
		 WHERE user_id = ?
		 ORDER BY sent_at DESC
		 LIMIT 50`,
        request.user.id
    );
    response.json(notifications);
});

app.get('/api/groups', requireAuth, async (request, response) => {
    const db = await getDb();
    const groups = await db.all(
        `SELECT g.id, g.name, g.invite_code AS inviteCode
		 FROM friend_groups g
		 INNER JOIN friend_group_members m ON m.group_id = g.id
		 WHERE m.user_id = ?`,
        request.user.id
    );
    response.json(groups);
});

app.post('/api/groups', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({ name: z.string().min(2) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid group payload.' });
        return;
    }

    const groupId = randomUUID();
    const membershipId = randomUUID();
    const now = new Date().toISOString();
    const inviteCode = `vibe-${Math.random().toString(36).slice(2, 8)}`;

    await db.run(
        `INSERT INTO friend_groups (id, owner_user_id, name, invite_code, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
        groupId,
        request.user.id,
        parsed.data.name,
        inviteCode,
        now
    );

    await db.run(
        `INSERT INTO friend_group_members (id, group_id, user_id, role, sharing_mode, consent_given_at)
		 VALUES (?, ?, ?, 'owner', 'availability_only', ?)`,
        membershipId,
        groupId,
        request.user.id,
        now
    );

    response.status(201).json({ id: groupId, name: parsed.data.name, inviteCode });
});

app.post('/api/groups/join', requireAuth, async (request, response) => {
    const db = await getDb();
    const schema = z.object({
        inviteCode: z.string().min(4),
        sharingMode: z.enum(['availability_only', 'selected_events']).default('availability_only')
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid join payload.' });
        return;
    }

    const group = await db.get('SELECT id FROM friend_groups WHERE invite_code = ?', parsed.data.inviteCode);
    if (!group) {
        response.status(404).json({ error: 'Invite code not found.' });
        return;
    }

    await db.run(
        `INSERT OR IGNORE INTO friend_group_members (id, group_id, user_id, role, sharing_mode, consent_given_at)
		 VALUES (?, ?, ?, 'member', ?, ?)`,
        randomUUID(),
        group.id,
        request.user.id,
        parsed.data.sharingMode,
        new Date().toISOString()
    );

    response.json({ ok: true });
});

cron.schedule('30 7 * * *', async () => {
    const db = await getDb();
    const users = await db.all('SELECT id FROM users');
    for (const user of users) {
        await createMorningSummaryNotification(db, user.id);
    }
    console.log(`Morning summary scheduler ran for ${users.length} users.`);
});

cron.schedule('*/20 * * * *', async () => {
    const db = await getDb();
    const users = await db.all('SELECT id FROM users');
    for (const user of users) {
        await runSuggestionEngine(db, user.id);
        await createSuggestionNotifications(db, user.id);
    }
    console.log(`Suggestion scheduler ran for ${users.length} users.`);
});

async function start() {
    const db = await getDb();
    await db.exec('SELECT 1');

    app.listen(config.port, () => {
        console.log(`VibeCalendar API listening on http://localhost:${config.port}`);
    });
}

start().catch((error) => {
    console.error('Failed to start API:', error);
    process.exit(1);
});
