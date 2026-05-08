import { randomUUID } from 'node:crypto';

export async function seedUserDataIfEmpty(db, userId) {
    const eventCount = await db.get('SELECT COUNT(*) AS total FROM events WHERE user_id = ?', userId);
    if ((eventCount?.total || 0) > 0) {
        return;
    }

    const now = new Date();
    const iso = (hour, minute) => {
        const value = new Date(now);
        value.setHours(hour, minute, 0, 0);
        return value.toISOString();
    };

    const events = [
        {
            id: randomUUID(),
            title: 'Data Structures Lecture',
            startAt: iso(9, 0),
            endAt: iso(10, 30),
            effort: 'High',
            category: 'class'
        },
        {
            id: randomUUID(),
            title: 'Project Team Standup',
            startAt: iso(12, 0),
            endAt: iso(12, 30),
            effort: 'Medium',
            category: 'meeting'
        },
        {
            id: randomUUID(),
            title: 'Design Critique',
            startAt: iso(14, 0),
            endAt: iso(15, 15),
            effort: 'Medium',
            category: 'study'
        }
    ];

    for (const event of events) {
        await db.run(
            `INSERT INTO events (
        id, user_id, title, start_at, end_at, source_visibility,
        is_busy_block_only, effort_level, category, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'standard', 0, ?, ?, 'manual', ?, ?)`,
            event.id,
            userId,
            event.title,
            event.startAt,
            event.endAt,
            event.effort,
            event.category || null,
            new Date().toISOString(),
            new Date().toISOString()
        );
    }
}
