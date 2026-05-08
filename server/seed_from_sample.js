import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const OCCURRENCE_WEEKS = 8;
const seedBaseDate = new Date();

function startOfUtcDay(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function startOfUtcWeek(date) {
    const d = startOfUtcDay(date);
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
}

function nextWeekdayDate(weekday, fromDate) {
    const base = startOfUtcWeek(fromDate);
    const target = new Date(base);
    target.setUTCDate(base.getUTCDate() + weekday);
    if (target < startOfUtcDay(fromDate)) {
        target.setUTCDate(target.getUTCDate() + 7);
    }
    return target;
}

function withUtcTimeFromDate(date, template) {
    const d = new Date(date);
    d.setUTCHours(
        template.getUTCHours(),
        template.getUTCMinutes(),
        template.getUTCSeconds(),
        0
    );
    return d;
}

const JITTER_MINUTES = [-30, -15, 0, 15, 30, 45];
const DURATION_DELTAS = [-15, 15, 30];

const EXTRA_TEMPLATES = [
    { title: 'Library Study Block', weekday: 1, hour: 16, minute: 0, durationMins: 90, effort_level: 'High' },
    { title: 'Gym Session', weekday: 2, hour: 18, minute: 30, durationMins: 60, effort_level: 'Low' },
    { title: 'Club Meeting', weekday: 3, hour: 19, minute: 0, durationMins: 60, effort_level: 'Medium' },
    { title: 'Office Hours', weekday: 4, hour: 15, minute: 0, durationMins: 60, effort_level: 'Medium' },
    { title: 'Coffee Break', weekday: 5, hour: 10, minute: 30, durationMins: 30, effort_level: 'Low' },
    { title: 'Weekend Brunch', weekday: 6, hour: 11, minute: 0, durationMins: 60, effort_level: 'Low' },
    { title: 'Campus Job Shift', weekday: 0, hour: 17, minute: 0, durationMins: 120, effort_level: 'Medium' }
];

function hashString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), t | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleWithRng(list, rng) {
    for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = list[i];
        list[i] = list[j];
        list[j] = tmp;
    }
    return list;
}

function pickFrom(list, rng) {
    return list[Math.floor(rng() * list.length)];
}

function getUserExtraPool(email) {
    const rng = mulberry32(hashString(`${email}:extra-pool`));
    const shuffled = shuffleWithRng([...EXTRA_TEMPLATES], rng);
    return shuffled.slice(0, 4);
}

// Expand template events into weekly occurrences with small, realistic variations.
function buildOccurrences(ev, email) {
    if (!ev.start_at || !ev.end_at) return [];
    const origStart = new Date(ev.start_at);
    const origEnd = new Date(ev.end_at);
    const baseDurationMs = origEnd.getTime() - origStart.getTime();
    if (!Number.isFinite(baseDurationMs) || baseDurationMs <= 0) return [];

    const eventKey = `${email}:${ev.title || 'busy'}:${ev.start_at}:${ev.end_at}`;
    const firstDay = nextWeekdayDate(origStart.getUTCDay(), seedBaseDate);
    const occurrences = [];

    for (let week = 0; week < OCCURRENCE_WEEKS; week += 1) {
        const rng = mulberry32(hashString(`${eventKey}:${week}`));
        if (rng() < 0.12) {
            continue;
        }

        const day = new Date(firstDay);
        day.setUTCDate(firstDay.getUTCDate() + week * 7);
        let start = withUtcTimeFromDate(day, origStart);
        const jitter = pickFrom(JITTER_MINUTES, rng);
        start = new Date(start.getTime() + jitter * 60 * 1000);

        let durationMs = baseDurationMs;
        if (rng() < 0.35) {
            const deltaMinutes = pickFrom(DURATION_DELTAS, rng);
            durationMs = Math.max(30 * 60 * 1000, durationMs + deltaMinutes * 60 * 1000);
        }

        const end = new Date(start.getTime() + durationMs);

        occurrences.push({
            ...ev,
            start_at: start.toISOString(),
            end_at: end.toISOString()
        });
    }

    return occurrences;
}

function buildWeeklyExtras(email, weekIndex, weekStart, extraPool) {
    const rng = mulberry32(hashString(`${email}:extras:${weekIndex}`));
    if (rng() < 0.35) {
        return [];
    }

    const count = rng() < 0.7 ? 1 : 2;
    const pool = shuffleWithRng([...extraPool], rng).slice(0, count);
    const extras = [];

    for (const template of pool) {
        const day = new Date(weekStart);
        day.setUTCDate(weekStart.getUTCDate() + template.weekday);
        day.setUTCHours(template.hour, template.minute, 0, 0);
        const jitter = pickFrom([-15, 0, 15], rng);
        const start = new Date(day.getTime() + jitter * 60 * 1000);
        const end = new Date(start.getTime() + template.durationMins * 60 * 1000);

        extras.push({
            title: template.title,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            effort_level: template.effort_level
        });
    }

    return extras;
}

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
                const occurrences = buildOccurrences(ev, u.email);
                if (occurrences.length === 0) {
                    continue;
                }

                for (const occurrence of occurrences) {
                    const evId = uuidv4();
                    const connectedCalendarId = occurrence.connected_calendar_id
                        ? calendarIdMap[occurrence.connected_calendar_id]
                        : occurrence.connected_calendar_provider_id
                            ? calendarIdMap[occurrence.connected_calendar_provider_id]
                            : null;

                    await db.run(
                        `INSERT INTO events (id, user_id, connected_calendar_id, title, description, location_text, start_at, end_at, source_visibility, is_busy_block_only, effort_level, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            evId,
                            userId,
                            connectedCalendarId,
                            occurrence.title,
                            occurrence.description || null,
                            occurrence.location_text || null,
                            occurrence.start_at,
                            occurrence.end_at,
                            occurrence.source_visibility || (occurrence.title ? 'standard' : 'hidden'),
                            occurrence.is_busy_block_only ? 1 : 0,
                            occurrence.effort_level || null,
                            occurrence.created_by || 'external',
                            now,
                            now
                        ]
                    );
                }
            }
        }

        const extraPool = getUserExtraPool(u.email);
        const baseWeekStart = startOfUtcWeek(seedBaseDate);
        for (let week = 0; week < OCCURRENCE_WEEKS; week += 1) {
            const weekStart = new Date(baseWeekStart);
            weekStart.setUTCDate(baseWeekStart.getUTCDate() + week * 7);
            const extras = buildWeeklyExtras(u.email, week, weekStart, extraPool);
            for (const extra of extras) {
                const evId = uuidv4();
                await db.run(
                    `INSERT INTO events (id, user_id, connected_calendar_id, title, description, location_text, start_at, end_at, source_visibility, is_busy_block_only, effort_level, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        evId,
                        userId,
                        null,
                        extra.title,
                        null,
                        null,
                        extra.start_at,
                        extra.end_at,
                        'standard',
                        0,
                        extra.effort_level || null,
                        'external',
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
