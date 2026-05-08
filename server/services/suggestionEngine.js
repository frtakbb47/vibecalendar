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

export function getDayRange(dateKey) {
    const base = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
    base.setHours(0, 0, 0, 0);
    const startDay = new Date(base);
    const endDay = new Date(base);
    endDay.setHours(23, 59, 59, 999);

    return {
        dateKey: startDay.toISOString().slice(0, 10),
        startDay: startDay.toISOString(),
        endDay: endDay.toISOString()
    };
}

function clampEventsToDay(events, range) {
    const startMs = new Date(range.startDay).getTime();
    const endMs = new Date(range.endDay).getTime();

    return events
        .map((ev) => {
            const start = Math.max(new Date(ev.startAt).getTime(), startMs);
            const end = Math.min(new Date(ev.endAt).getTime(), endMs);
            if (end <= start) {
                return null;
            }
            return {
                ...ev,
                startAt: new Date(start).toISOString(),
                endAt: new Date(end).toISOString()
            };
        })
        .filter(Boolean);
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

function shuffle(list) {
    const items = [...list];
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
    }
    return items;
}

function pushUnique(target, candidate) {
    if (!target.some((item) => item.type === candidate.type)) {
        target.push(candidate);
    }
}

function generateSuggestionsFromGap(gap, previousEffort, nextEffort) {
    const duration = minutesBetween(gap.startAt, gap.endAt);
    if (duration < MIN_GAP_MINUTES) {
        return [];
    }

    const candidates = [];

    if (previousEffort >= 3) {
        pushUnique(candidates, {
            type: 'recovery',
            title: '10-minute reset walk',
            rationale: 'You just finished a high-effort block. A short reset can reduce mental overload.'
        });
    }

    const startHour = new Date(gap.startAt).getHours();
    const endHour = new Date(gap.endAt).getHours();
    const anchorHour = startHour < 6 ? 9 : startHour;

    if (anchorHour >= 7 && anchorHour <= 10 && duration >= 30) {
        pushUnique(candidates, {
            type: 'focus',
            title: 'Morning focus block',
            rationale: 'Morning gaps are great for a single focused task before your day fills up.'
        });
    }

    if (anchorHour >= 11 && anchorHour <= 14 && duration >= 20) {
        pushUnique(candidates, {
            type: 'eat',
            title: 'Quick meal + hydration break',
            rationale: 'This gap is a good time to fuel up before your next block.'
        });
    }

    if (nextEffort >= 3 && duration >= 25) {
        pushUnique(candidates, {
            type: 'study',
            title: '20-minute prep sprint',
            rationale: 'A short prep now can lower stress for your next high-effort class.'
        });
    }

    if (anchorHour >= 15 && anchorHour <= 18 && duration >= 30) {
        pushUnique(candidates, {
            type: 'study',
            title: 'Focused study sprint',
            rationale: 'A mid-afternoon sprint keeps momentum without draining your evening.'
        });
    }

    if (anchorHour >= 18 && anchorHour <= 21 && duration >= 30) {
        pushUnique(candidates, {
            type: 'recovery',
            title: 'Evening decompression',
            rationale: 'Use this space to reset so you can end the day with energy.'
        });
    }

    if (duration >= 45 && endHour >= 12) {
        pushUnique(candidates, {
            type: 'focus',
            title: 'Quick admin sweep',
            rationale: 'Use a bigger gap to clear small tasks and reduce mental clutter.'
        });
    }

    if (candidates.length === 0) {
        candidates.push({
            type: 'meditate',
            title: '5-minute breathing reset',
            rationale: 'Small recovery breaks can stabilize focus across the day.'
        });
    }

    const maxCount = duration >= 120 ? 3 : duration >= 60 ? 2 : 1;
    const recovery = candidates.find((item) => item.type === 'recovery');
    const others = candidates.filter((item) => item.type !== 'recovery');
    const ordered = recovery ? [recovery, ...shuffle(others)] : shuffle(others);

    return ordered.slice(0, Math.min(maxCount, ordered.length));
}

async function getDayEvents(db, userId, range) {
    return db.all(
        `SELECT id, title, start_at AS startAt, end_at AS endAt, effort_level AS effortLevel
     FROM events
     WHERE user_id = ?
       AND start_at < ?
       AND end_at > ?
     ORDER BY start_at ASC`,
        userId,
        range.endDay,
        range.startDay
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

async function shouldSuppressSuggestion(db, userId, contextKey, type, allowRepeat) {
    if (!allowRepeat) {
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

export async function runSuggestionEngine(db, userId, options = {}) {
    const range = getDayRange(options.date);
    const events = clampEventsToDay(await getDayEvents(db, userId, range), range);
    const gaps = buildGapWindows(events);

    if (options.refresh) {
        await db.run(
            `DELETE FROM suggestions
       WHERE user_id = ?
         AND status = 'pending'
         AND start_at BETWEEN ? AND ?`,
            userId,
            range.startDay,
            range.endDay
        );
    }

    if (events.length === 0) {
        gaps.push({ startAt: range.startDay, endAt: range.endDay, previousEvent: null, nextEvent: null });
    } else {
        const first = events[0];
        const last = events[events.length - 1];
        if (new Date(first.startAt).getTime() > new Date(range.startDay).getTime()) {
            gaps.unshift({ startAt: range.startDay, endAt: first.startAt, previousEvent: null, nextEvent: first });
        }
        if (new Date(last.endAt).getTime() < new Date(range.endDay).getTime()) {
            gaps.push({ startAt: last.endAt, endAt: range.endDay, previousEvent: last, nextEvent: null });
        }
    }

    if (gaps.length === 0) {
        return [];
    }

    const created = [];

    for (const gap of gaps) {
        const previousEffort = effortWeight[gap.previousEvent?.effortLevel || 'Low'] || 1;
        const nextEffort = effortWeight[gap.nextEvent?.effortLevel || 'Low'] || 1;
        const suggestions = generateSuggestionsFromGap(gap, previousEffort, nextEffort);

        for (const suggestion of suggestions) {
            const contextKey = `${range.dateKey}:${gap.startAt}-${gap.endAt}:${suggestion.type}`;
            const suppressed = await shouldSuppressSuggestion(db, userId, contextKey, suggestion.type, Boolean(options.refresh));
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
    }

    return created;
}
