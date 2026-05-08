import { randomUUID } from 'node:crypto';

const effortWeight = {
    Low: 1,
    Medium: 2,
    High: 3,
    'Very High': 4
};

const MIN_GAP_MINUTES = 20;

function minutesBetween(startIso, endIso) {
    return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

function toIsoFromDate(baseDate, hour, minute) {
    const value = new Date(baseDate);
    value.setHours(hour, minute, 0, 0);
    return value.toISOString();
}

function scorePriority(type, beforeEffort) {
    if (type === 'recovery') {
        return 1;
    }

    if (type === 'eat' || type === 'focus') {
        return 2;
    }

    if (beforeEffort >= 3) {
        return 2;
    }

    return 3;
}

function generateSuggestionFromGap(gap, previousEffort, nextEffort) {
    const duration = minutesBetween(gap.startAt, gap.endAt);
    if (duration < MIN_GAP_MINUTES) {
        return null;
    }

    if (previousEffort >= 3) {
        return {
            type: 'recovery',
            title: '10-minute reset walk',
            rationale: 'You just finished a high-effort block. A short reset can reduce mental overload.'
        };
    }

    const startHour = new Date(gap.startAt).getHours();
    const endHour = new Date(gap.endAt).getHours();
    const anchorHour = startHour < 6 ? 9 : startHour;

    if (anchorHour >= 7 && anchorHour <= 10 && duration >= 30) {
        return {
            type: 'focus',
            title: 'Morning focus block',
            rationale: 'Morning gaps are great for a single focused task before your day fills up.'
        };
    }

    if (anchorHour >= 11 && anchorHour <= 14 && duration >= 20) {
        return {
            type: 'eat',
            title: 'Quick meal + hydration break',
            rationale: 'This gap is a good time to fuel up before your next block.'
        };
    }

    if (nextEffort >= 3 && duration >= 25) {
        return {
            type: 'study',
            title: '20-minute prep sprint',
            rationale: 'A short prep now can lower stress for your next high-effort class.'
        };
    }

    if (anchorHour >= 15 && anchorHour <= 18 && duration >= 30) {
        return {
            type: 'study',
            title: 'Focused study sprint',
            rationale: 'A mid-afternoon sprint keeps momentum without draining your evening.'
        };
    }

    if (anchorHour >= 18 && anchorHour <= 21 && duration >= 30) {
        return {
            type: 'recovery',
            title: 'Evening decompression',
            rationale: 'Use this space to reset so you can end the day with energy.'
        };
    }

    if (duration >= 45 && endHour >= 12) {
        return {
            type: 'focus',
            title: 'Quick admin sweep',
            rationale: 'Use a bigger gap to clear small tasks and reduce mental clutter.'
        };
    }

    return {
        type: 'meditate',
        title: '5-minute breathing reset',
        rationale: 'Small recovery breaks can stabilize focus across the day.'
    };
}

async function getTodayEvents(db, userId) {
    const now = new Date();
    const startDay = toIsoFromDate(now, 0, 0);
    const endDay = toIsoFromDate(now, 23, 59);

    return db.all(
        `SELECT id, title, start_at AS startAt, end_at AS endAt, effort_level AS effortLevel
     FROM events
     WHERE user_id = ? AND start_at BETWEEN ? AND ?
     ORDER BY start_at ASC`,
        userId,
        startDay,
        endDay
    );
}

function buildGapWindows(events) {
    if (events.length < 2) {
        return [];
    }

    const gaps = [];
    for (let index = 0; index < events.length - 1; index += 1) {
        const current = events[index];
        const next = events[index + 1];
        const currentEnd = new Date(current.endAt).getTime();
        const nextStart = new Date(next.startAt).getTime();

        if (nextStart <= currentEnd) {
            continue;
        }

        gaps.push({
            startAt: current.endAt,
            endAt: next.startAt,
            previousEvent: current,
            nextEvent: next
        });
    }

    return gaps;
}

async function shouldSuppressSuggestion(db, userId, contextKey, type) {
    const duplicate = await db.get(
        `SELECT id FROM suggestions
     WHERE user_id = ? AND context_key = ? AND type = ? AND status = 'pending'`,
        userId,
        contextKey,
        type
    );

    if (duplicate) {
        return true;
    }

    const ignoredCount = await db.get(
        `SELECT COUNT(*) AS total
     FROM suggestions
     WHERE user_id = ?
       AND type = ?
       AND status = 'ignored'
       AND created_at >= datetime('now', '-7 days')`,
        userId,
        type
    );

    return (ignoredCount?.total || 0) >= 3;
}

export async function runSuggestionEngine(db, userId) {
    const events = await getTodayEvents(db, userId);
    const now = new Date();
    const startDay = toIsoFromDate(now, 0, 0);
    const endDay = toIsoFromDate(now, 23, 59);
    const gaps = buildGapWindows(events);

    if (events.length === 0) {
        gaps.push({ startAt: startDay, endAt: endDay, previousEvent: null, nextEvent: null });
    } else {
        const first = events[0];
        const last = events[events.length - 1];
        if (new Date(first.startAt).getTime() > new Date(startDay).getTime()) {
            gaps.unshift({ startAt: startDay, endAt: first.startAt, previousEvent: null, nextEvent: first });
        }
        if (new Date(last.endAt).getTime() < new Date(endDay).getTime()) {
            gaps.push({ startAt: last.endAt, endAt: endDay, previousEvent: last, nextEvent: null });
        }
    }

    if (gaps.length === 0) {
        return [];
    }

    const created = [];

    for (const gap of gaps) {
        const previousEffort = effortWeight[gap.previousEvent?.effortLevel || 'Low'] || 1;
        const nextEffort = effortWeight[gap.nextEvent?.effortLevel || 'Low'] || 1;
        const contextKey = `${gap.startAt}-${gap.endAt}`;

        const suggestion = generateSuggestionFromGap(gap, previousEffort, nextEffort);
        if (!suggestion) {
            continue;
        }

        const suppressed = await shouldSuppressSuggestion(db, userId, contextKey, suggestion.type);
        if (suppressed) {
            continue;
        }

        const id = randomUUID();
        const createdAt = new Date().toISOString();
        const priorityScore = scorePriority(suggestion.type, previousEffort);

        await db.run(
            `INSERT INTO suggestions (
        id, user_id, type, title, rationale_text, start_at, end_at,
        confidence_score, priority_score, status, context_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
            id,
            userId,
            suggestion.type,
            suggestion.title,
            suggestion.rationale,
            gap.startAt,
            gap.endAt,
            0.78,
            priorityScore,
            contextKey,
            createdAt
        );

        created.push({ id, ...suggestion, startAt: gap.startAt, endAt: gap.endAt, priorityScore });
    }

    return created;
}
