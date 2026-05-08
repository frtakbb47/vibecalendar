import { randomUUID } from 'node:crypto';

const effortWeight = {
    Low: 1,
    Medium: 2,
    High: 3,
    'Very High': 4
};

const MIN_GAP_MINUTES = 20;
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 21;

const DURATION_BY_TYPE = {
    recovery: 20,
    eat: 30,
    focus: 45,
    study: 45,
    meditate: 10
};

const TIME_BUCKETS = [
    { id: 'morning', start: 8, end: 11 },
    { id: 'midday', start: 11, end: 14 },
    { id: 'afternoon', start: 14, end: 18 },
    { id: 'evening', start: 18, end: 21 }
];

const EVENT_CATEGORIES = [
    'class',
    'study',
    'work',
    'meeting',
    'personal',
    'wellness',
    'meal',
    'social',
    'errand',
    'travel',
    'other'
];

const TITLE_CATEGORY_MAP = [
    { category: 'class', tokens: ['class', 'lecture', 'lab', 'seminar', 'tutorial', 'studio', 'recitation'] },
    { category: 'study', tokens: ['study', 'library', 'homework', 'assignment', 'project', 'thesis', 'research', 'reading', 'paper'] },
    { category: 'meeting', tokens: ['meeting', 'standup', 'sync', 'check-in', 'advising', 'office hours'] },
    { category: 'work', tokens: ['work', 'shift', 'job', 'internship', 'client'] },
    { category: 'wellness', tokens: ['gym', 'workout', 'run', 'yoga', 'meditation', 'therapy', 'doctor', 'dentist'] },
    { category: 'meal', tokens: ['breakfast', 'lunch', 'dinner', 'brunch', 'snack', 'coffee'] },
    { category: 'social', tokens: ['hangout', 'party', 'social', 'club', 'game', 'friends', 'date'] },
    { category: 'errand', tokens: ['errand', 'grocery', 'shopping', 'pickup', 'drop off', 'bank'] },
    { category: 'travel', tokens: ['travel', 'commute', 'flight', 'bus', 'train'] }
];

const TEMPLATE_LIBRARY = [
    {
        id: 'reset-walk',
        type: 'recovery',
        title: 'Reset walk to clear your head',
        rationale: 'After a heavy block, a short walk helps your brain reset and lower stress.',
        min: 20,
        duration: 20,
        buckets: ['morning', 'midday', 'afternoon', 'evening'],
        requires: { afterHeavy: true }
    },
    {
        id: 'lunch-hydrate',
        type: 'eat',
        title: 'Grab lunch + hydrate',
        rationale: 'This gap is perfect for food and water so you do not crash later.',
        min: 20,
        duration: 30,
        buckets: ['midday'],
        anchorHour: 12
    },
    {
        id: 'snack-break',
        type: 'eat',
        title: 'Snack + water break',
        rationale: 'A short refuel now keeps your energy steady for the next block.',
        min: 15,
        duration: 20,
        buckets: ['afternoon', 'evening'],
        anchorHour: 15
    },
    {
        id: 'preview-notes',
        type: 'study',
        title: 'Preview notes for the next session',
        rationale: 'A quick preview now makes the next session feel easier to jump into.',
        min: 20,
        duration: 25,
        buckets: ['morning', 'midday', 'afternoon'],
        requires: { beforeCategory: ['class', 'study'] }
    },
    {
        id: 'problem-set',
        type: 'study',
        title: 'Study sprint: one problem set',
        rationale: 'Use this gap to finish one concrete task and keep momentum.',
        min: 40,
        duration: 45,
        buckets: ['afternoon', 'evening']
    },
    {
        id: 'start-outline',
        type: 'focus',
        title: 'Start an assignment outline',
        rationale: 'Drafting an outline now makes the final write-up faster later.',
        min: 30,
        duration: 40,
        buckets: ['morning', 'afternoon']
    },
    {
        id: 'admin-sweep',
        type: 'focus',
        title: 'Campus admin clean-up',
        rationale: 'Use a longer gap to reply to emails, plan the week, or check deadlines.',
        min: 45,
        duration: 45,
        buckets: ['midday', 'afternoon']
    },
    {
        id: 'office-hours-prep',
        type: 'focus',
        title: 'Office hours prep',
        rationale: 'Jot 2-3 questions now so you get more value from office hours later.',
        min: 20,
        duration: 25,
        buckets: ['morning', 'midday']
    },
    {
        id: 'library-block',
        type: 'study',
        title: 'Library focus block',
        rationale: 'A longer gap is a good chance to lock in a deep focus session.',
        min: 60,
        duration: 60,
        buckets: ['afternoon', 'evening']
    },
    {
        id: 'stretch-reset',
        type: 'recovery',
        title: 'Stretch + reset',
        rationale: 'A short stretch break keeps energy steady between blocks.',
        min: 15,
        duration: 15,
        buckets: ['morning', 'midday', 'afternoon', 'evening']
    },
    {
        id: 'breathing-reset',
        type: 'meditate',
        title: '5-minute breathe + reset',
        rationale: 'Short recovery breaks keep focus steady between blocks.',
        min: 10,
        duration: 10,
        buckets: ['morning', 'midday', 'afternoon', 'evening']
    }
];

function normalizeCategory(value) {
    if (!value) return null;
    const cleaned = String(value).trim().toLowerCase();
    if (EVENT_CATEGORIES.includes(cleaned)) {
        return cleaned;
    }
    return null;
}

function inferCategoryFromTitle(title) {
    if (!title) return null;
    const lowered = title.toLowerCase();
    for (const entry of TITLE_CATEGORY_MAP) {
        if (entry.tokens.some((token) => lowered.includes(token))) {
            return entry.category;
        }
    }
    return null;
}

function resolveEventCategory(event) {
    if (!event) return null;
    return normalizeCategory(event.category) || inferCategoryFromTitle(event.title) || 'other';
}

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

function getWorkWindow(range) {
    const start = new Date(range.startDay);
    const end = new Date(range.startDay);
    start.setHours(WORK_START_HOUR, 0, 0, 0);
    end.setHours(WORK_END_HOUR, 0, 0, 0);
    return { start, end };
}

function roundToStep(date, stepMinutes) {
    const stepMs = stepMinutes * 60 * 1000;
    return new Date(Math.round(date.getTime() / stepMs) * stepMs);
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

function bucketForHour(hour) {
    return TIME_BUCKETS.find((bucket) => hour >= bucket.start && hour < bucket.end)?.id || 'evening';
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

function buildSuggestionWindow(gap, template, indexOffset) {
    const gapMinutes = minutesBetween(gap.startAt, gap.endAt);
    const duration = Math.min(template.duration, gapMinutes);
    const gapStart = new Date(gap.startAt);
    const gapEnd = new Date(gap.endAt);

    let start = new Date(gapStart);
    if (template.anchorHour !== undefined) {
        const anchor = new Date(gapStart);
        anchor.setHours(template.anchorHour, template.anchorMinute || 0, 0, 0);
        if (anchor >= gapStart && anchor <= new Date(gapEnd.getTime() - duration * 60 * 1000)) {
            start = anchor;
        }
    }

    if (start.getTime() === gapStart.getTime()) {
        const offsetMinutes = Math.min(indexOffset * 20, Math.max(0, gapMinutes - duration));
        start = new Date(gapStart.getTime() + offsetMinutes * 60 * 1000);
    }

    const roundedStart = roundToStep(start, 5);
    let roundedEnd = roundToStep(new Date(roundedStart.getTime() + duration * 60 * 1000), 5);

    if (roundedEnd > gapEnd) {
        roundedEnd = new Date(gapEnd);
    }

    return {
        startAt: roundedStart.toISOString(),
        endAt: roundedEnd.toISOString()
    };
}

function buildCandidates(context, prefs, allowShuffle) {
    const candidates = [];
    const bucketScore = prefs.bucketScore || {};
    const typeScore = prefs.typeScore || {};

    for (const template of TEMPLATE_LIBRARY) {
        if (context.duration < template.min) {
            continue;
        }

        if (template.requires?.afterHeavy && !context.afterHeavy) {
            continue;
        }

        if (template.requires?.beforeHeavy && !context.beforeHeavy) {
            continue;
        }

        if (template.requires?.afterCategory) {
            if (!context.previousCategory || !template.requires.afterCategory.includes(context.previousCategory)) {
                continue;
            }
        }

        if (template.requires?.beforeCategory) {
            if (!context.nextCategory || !template.requires.beforeCategory.includes(context.nextCategory)) {
                continue;
            }
        }

        let score = 0;
        if (template.buckets?.includes(context.bucket)) {
            score += 2;
        } else {
            score -= 1;
        }

        if (context.afterHeavy && template.type === 'recovery') {
            score += 3;
        }

        if (context.beforeHeavy && (template.type === 'study' || template.type === 'focus')) {
            score += 2;
        }

        if (context.dayLoad >= 7 && template.type === 'recovery') {
            score += 2;
        }

        if (context.dayLoad <= 3 && template.type === 'study') {
            score += 1;
        }

        if (typeScore[template.type]) {
            score += typeScore[template.type] * 2;
        }

        if (bucketScore[context.bucket]) {
            score += bucketScore[context.bucket] * 1.5;
        }

        const durationDelta = Math.abs(context.duration - template.duration);
        if (durationDelta <= 10) {
            score += 1;
        } else if (durationDelta <= 25) {
            score += 0.5;
        }

        if (allowShuffle) {
            score += (Math.random() - 0.5) * 0.6;
        }

        candidates.push({ template, score });
    }

    candidates.sort((a, b) => b.score - a.score);

    const maxCount = context.duration >= 150 ? 3 : context.duration >= 60 ? 2 : 1;
    const selected = [];
    const usedTypes = new Set();

    for (const item of candidates) {
        if (selected.length >= maxCount) {
            break;
        }

        if (usedTypes.has(item.template.type)) {
            continue;
        }

        selected.push(item.template);
        usedTypes.add(item.template.type);
    }

    return selected;
}

async function getDayEvents(db, userId, range) {
    return db.all(
        `SELECT id, title, start_at AS startAt, end_at AS endAt, effort_level AS effortLevel, category
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

function clampGapToWorkHours(gap, range) {
    const workWindow = getWorkWindow(range);
    const start = Math.max(new Date(gap.startAt).getTime(), workWindow.start.getTime());
    const end = Math.min(new Date(gap.endAt).getTime(), workWindow.end.getTime());

    if (end <= start) {
        return null;
    }

    const minutes = Math.round((end - start) / 60000);
    if (minutes < MIN_GAP_MINUTES) {
        return null;
    }

    return {
        ...gap,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString()
    };
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
       AND created_at >= datetime('now', '-21 days')`,
        userId,
        type
    );

    return (ignoredCount?.total || 0) >= 4;
}

async function getPreferenceStats(db, userId) {
    const typeRows = await db.all(
        `SELECT type,
                SUM(CASE WHEN status = 'added' THEN 1 ELSE 0 END) AS added,
                SUM(CASE WHEN status = 'ignored' THEN 1 ELSE 0 END) AS ignored
         FROM suggestions
         WHERE user_id = ?
           AND created_at >= datetime('now', '-21 days')
         GROUP BY type`,
        userId
    );

    const typeScore = {};
    for (const row of typeRows) {
        const total = (row.added || 0) + (row.ignored || 0);
        typeScore[row.type] = total ? (row.added - row.ignored) / total : 0;
    }

    const hourRows = await db.all(
        `SELECT CAST(strftime('%H', start_at) AS INTEGER) AS hour,
                SUM(CASE WHEN status = 'added' THEN 1 ELSE 0 END) AS added,
                SUM(CASE WHEN status = 'ignored' THEN 1 ELSE 0 END) AS ignored
         FROM suggestions
         WHERE user_id = ?
           AND created_at >= datetime('now', '-21 days')
         GROUP BY hour`,
        userId
    );

    const bucketTotals = {};
    const bucketScore = {};
    for (const row of hourRows) {
        const bucket = bucketForHour(row.hour);
        if (!bucketTotals[bucket]) {
            bucketTotals[bucket] = { added: 0, ignored: 0 };
        }
        bucketTotals[bucket].added += row.added || 0;
        bucketTotals[bucket].ignored += row.ignored || 0;
    }

    for (const bucket of TIME_BUCKETS.map((item) => item.id)) {
        const totals = bucketTotals[bucket] || { added: 0, ignored: 0 };
        const total = totals.added + totals.ignored;
        bucketScore[bucket] = total ? (totals.added - totals.ignored) / total : 0;
    }

    return { typeScore, bucketScore };
}

function computeDayLoad(events) {
    if (events.length === 0) return 0;
    let load = 0;
    for (const event of events) {
        const durationHours = minutesBetween(event.startAt, event.endAt) / 60;
        const weight = effortWeight[event.effortLevel || 'Low'] || 1;
        load += durationHours * weight;
    }
    return Number(load.toFixed(1));
}

export async function runSuggestionEngine(db, userId, options = {}) {
    const range = getDayRange(options.date);
    const events = clampEventsToDay(await getDayEvents(db, userId, range), range);
    let gaps = buildGapWindows(events);

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
        const workWindow = getWorkWindow(range);
        const midday = new Date(workWindow.start);
        midday.setHours(12, 0, 0, 0);
        const afternoon = new Date(workWindow.start);
        afternoon.setHours(15, 30, 0, 0);
        gaps = [
            { startAt: workWindow.start.toISOString(), endAt: midday.toISOString(), previousEvent: null, nextEvent: null },
            { startAt: afternoon.toISOString(), endAt: workWindow.end.toISOString(), previousEvent: null, nextEvent: null }
        ];
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

    gaps = gaps.map((gap) => clampGapToWorkHours(gap, range)).filter(Boolean);

    if (gaps.length === 0) {
        return [];
    }

    const prefs = await getPreferenceStats(db, userId);
    const dayLoad = computeDayLoad(events);
    const created = [];

    for (const gap of gaps) {
        const previousEffort = effortWeight[gap.previousEvent?.effortLevel || 'Low'] || 1;
        const nextEffort = effortWeight[gap.nextEvent?.effortLevel || 'Low'] || 1;
        const gapDuration = minutesBetween(gap.startAt, gap.endAt);
        const startHour = new Date(gap.startAt).getHours();
        const previousCategory = resolveEventCategory(gap.previousEvent);
        const nextCategory = resolveEventCategory(gap.nextEvent);
        const context = {
            duration: gapDuration,
            bucket: bucketForHour(startHour),
            afterHeavy: previousEffort >= 3,
            beforeHeavy: nextEffort >= 3,
            dayLoad,
            previousCategory,
            nextCategory
        };

        const templates = buildCandidates(context, prefs, Boolean(options.refresh));

        for (const [index, template] of templates.entries()) {
            const window = buildSuggestionWindow(gap, template, index);
            const contextKey = `${range.dateKey}:${window.startAt}-${window.endAt}:${template.type}`;
            const suppressed = await shouldSuppressSuggestion(db, userId, contextKey, template.type, Boolean(options.refresh));
            if (suppressed) {
                continue;
            }

            const id = randomUUID();
            const createdAt = new Date().toISOString();
            const priorityScore = scorePriority(template.type, previousEffort);

            await db.run(
                `INSERT INTO suggestions (
        id, user_id, type, title, rationale_text, start_at, end_at,
        confidence_score, priority_score, status, context_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
                id,
                userId,
                template.type,
                template.title,
                template.rationale,
                window.startAt,
                window.endAt,
                0.86,
                priorityScore,
                contextKey,
                createdAt
            );

            created.push({ id, ...template, startAt: window.startAt, endAt: window.endAt, priorityScore });
        }
    }

    return created;
}
