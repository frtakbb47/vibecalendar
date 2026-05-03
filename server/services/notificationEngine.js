import { randomUUID } from 'node:crypto';

const MAX_DAILY_PUSHES = 4;

function formatSuggestionNotification(suggestion) {
    return {
        title: `Suggestion: ${suggestion.title}`,
        body: suggestion.rationaleText
    };
}

export async function createSuggestionNotifications(db, userId) {
    const sentCountRow = await db.get(
        `SELECT COUNT(*) AS total
     FROM notifications
     WHERE user_id = ?
       AND notification_type = 'suggestion'
       AND date(sent_at) = date('now')`,
        userId
    );

    const remaining = Math.max(0, MAX_DAILY_PUSHES - (sentCountRow?.total || 0));
    if (remaining === 0) {
        return [];
    }

    const suggestions = await db.all(
        `SELECT id, title, rationale_text AS rationaleText, priority_score AS priorityScore
     FROM suggestions
     WHERE user_id = ? AND status = 'pending'
     ORDER BY priority_score ASC, created_at ASC
     LIMIT ?`,
        userId,
        remaining
    );

    const now = new Date().toISOString();
    const created = [];

    for (const suggestion of suggestions) {
        const payload = formatSuggestionNotification(suggestion);
        const id = randomUUID();

        await db.run(
            `INSERT INTO notifications (
        id, user_id, notification_type, suggestion_id, title, body, channel, sent_at
      ) VALUES (?, ?, 'suggestion', ?, ?, ?, 'in_app', ?)`,
            id,
            userId,
            suggestion.id,
            payload.title,
            payload.body,
            now
        );

        created.push({
            id,
            suggestionId: suggestion.id,
            ...payload
        });
    }

    return created;
}

export async function createMorningSummaryNotification(db, userId) {
    const existing = await db.get(
        `SELECT id FROM notifications
     WHERE user_id = ?
       AND notification_type = 'morning_summary'
       AND date(sent_at) = date('now')`,
        userId
    );

    if (existing) {
        return null;
    }

    const todayEvents = await db.get(
        `SELECT COUNT(*) AS total FROM events
     WHERE user_id = ?
       AND date(start_at) = date('now')`,
        userId
    );

    const pending = await db.get(
        `SELECT COUNT(*) AS total FROM suggestions
     WHERE user_id = ? AND status = 'pending'`,
        userId
    );

    const body = `You have ${todayEvents?.total || 0} events and ${pending?.total || 0} open suggestions today.`;
    const id = randomUUID();
    const now = new Date().toISOString();

    await db.run(
        `INSERT INTO notifications (
      id, user_id, notification_type, title, body, channel, sent_at
    ) VALUES (?, ?, 'morning_summary', ?, ?, 'in_app', ?)`,
        id,
        userId,
        'Morning Summary',
        body,
        now
    );

    return { id, title: 'Morning Summary', body };
}
