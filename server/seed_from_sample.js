import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const DEMO_GROUPS = [
    {
        name: 'Study Sprint Crew',
        inviteCode: 'vibe-study1',
        ownerEmail: 'alice@student.edu',
        members: [
            { email: 'alice@student.edu', role: 'owner', sharingMode: 'availability_only' },
            { email: 'bob@student.edu', role: 'member', sharingMode: 'availability_only' },
            { email: 'carla@student.edu', role: 'member', sharingMode: 'selected_events' }
        ]
    },
    {
        name: 'Gym + Recovery Buddies',
        inviteCode: 'vibe-recover',
        ownerEmail: 'eric@student.edu',
        members: [
            { email: 'eric@student.edu', role: 'owner', sharingMode: 'availability_only' },
            { email: 'alice@student.edu', role: 'member', sharingMode: 'availability_only' },
            { email: 'fiona@student.edu', role: 'member', sharingMode: 'selected_events' }
        ]
    },
    {
        name: 'Project Night Owls',
        inviteCode: 'vibe-night1',
        ownerEmail: 'carla@student.edu',
        members: [
            { email: 'carla@student.edu', role: 'owner', sharingMode: 'selected_events' },
            { email: 'danielle@student.edu', role: 'member', sharingMode: 'availability_only' },
            { email: 'grace@student.edu', role: 'member', sharingMode: 'availability_only' }
        ]
    }
];

async function seedDemoGroups(db) {
    const users = await db.all(
        `SELECT id, email
         FROM users
         WHERE email IN (
           'alice@student.edu',
           'bob@student.edu',
           'carla@student.edu',
           'danielle@student.edu',
           'eric@student.edu',
           'fiona@student.edu',
           'grace@student.edu'
         )`
    );
    const userByEmail = new Map(users.map((user) => [user.email, user.id]));

    for (const group of DEMO_GROUPS) {
        const ownerUserId = userByEmail.get(group.ownerEmail);
        if (!ownerUserId) {
            continue;
        }

        const now = new Date().toISOString();
        let groupId;
        const existing = await db.get('SELECT id FROM friend_groups WHERE invite_code = ?', group.inviteCode);
        if (existing) {
            groupId = existing.id;
            await db.run('UPDATE friend_groups SET name = ? WHERE id = ?', [group.name, groupId]);
        } else {
            groupId = uuidv4();
            await db.run(
                `INSERT INTO friend_groups (id, owner_user_id, name, invite_code, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [groupId, ownerUserId, group.name, group.inviteCode, now]
            );
        }

        for (const member of group.members) {
            const memberUserId = userByEmail.get(member.email);
            if (!memberUserId) {
                continue;
            }

            await db.run(
                `INSERT OR IGNORE INTO friend_group_members (id, group_id, user_id, role, sharing_mode, consent_given_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), groupId, memberUserId, member.role, member.sharingMode, now]
            );
        }
    }
}

async function seed() {
    const dbPath = path.resolve('./server/sample_data/example_accounts.json');
    if (!fs.existsSync(dbPath)) {
        console.error('Sample data file not found:', dbPath);
        process.exit(1);
    }

    const raw = fs.readFileSync(dbPath, 'utf8');
    const users = JSON.parse(raw);

    const db = await getDb();

    for (const u of users) {
        const now = new Date().toISOString();

        // Skip if user already exists
        const existing = await db.get('SELECT id FROM users WHERE email = ?', u.email);
        if (existing) {
            console.log('Skipping existing user:', u.email);
            continue;
        }

        const userId = uuidv4();
        const password = u.password || 'demo-pass';
        const passwordHash = await bcrypt.hash(password, 10);

        await db.run(
            `INSERT INTO users (id, name, email, password_hash, timezone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, u.name, u.email, passwordHash, u.timezone || 'UTC', now, now]
        );

        // privacy_consents
        const pc = u.privacy_consents || { location_consent: 0, social_consent: 1, calendar_write_consent: 0 };
        await db.run(
            `INSERT INTO privacy_consents (user_id, location_consent, social_consent, calendar_write_consent, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
            [userId, pc.location_consent || 0, pc.social_consent ?? 1, pc.calendar_write_consent || 0, now]
        );

        // connected_calendars
        const calendarIdMap = {};
        if (Array.isArray(u.connected_calendars)) {
            for (const cal of u.connected_calendars) {
                const ccId = uuidv4();
                calendarIdMap[cal.provider_calendar_id || ccId] = ccId;
                await db.run(
                    `INSERT INTO connected_calendars (id, user_id, provider, provider_calendar_id, import_mode, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [ccId, userId, cal.provider, cal.provider_calendar_id || null, cal.import_mode || 'standard', cal.status || 'connected', now, now]
                );
            }
        }

        // events
        if (Array.isArray(u.events)) {
            for (const ev of u.events) {
                const evId = uuidv4();
                const connectedCalendarId = ev.connected_calendar_id
                    ? calendarIdMap[ev.connected_calendar_id]
                    : ev.connected_calendar_provider_id
                        ? calendarIdMap[ev.connected_calendar_provider_id]
                        : null;

                await db.run(
                    `INSERT INTO events (id, user_id, connected_calendar_id, title, description, location_text, start_at, end_at, source_visibility, is_busy_block_only, effort_level, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        evId,
                        userId,
                        connectedCalendarId,
                        ev.title,
                        ev.description || null,
                        ev.location_text || null,
                        ev.start_at,
                        ev.end_at,
                        ev.source_visibility || (ev.title ? 'standard' : 'hidden'),
                        ev.is_busy_block_only ? 1 : 0,
                        ev.effort_level || null,
                        ev.created_by || 'external',
                        now,
                        now
                    ]
                );
            }
        }

        console.log('Seeded user:', u.email);
    }

    await seedDemoGroups(db);

    console.log('Seeding complete.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
