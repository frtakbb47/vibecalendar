import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function main() {
    const db = await open({
        filename: path.resolve('./server/vibecalendar.db'),
        driver: sqlite3.Database
    });

    const users = await db.all(
        `SELECT email, name
         FROM users
         WHERE email IN (
           'alice@student.edu',
           'bob@student.edu',
           'carla@student.edu',
           'danielle@student.edu',
           'eric@student.edu',
           'fiona@student.edu',
           'grace@student.edu'
         )
         ORDER BY email`
    );

    const counts = {
        users: await db.get('SELECT COUNT(*) AS total FROM users'),
        calendars: await db.get('SELECT COUNT(*) AS total FROM connected_calendars'),
        events: await db.get('SELECT COUNT(*) AS total FROM events'),
        groups: await db.get('SELECT COUNT(*) AS total FROM friend_groups'),
        memberships: await db.get('SELECT COUNT(*) AS total FROM friend_group_members')
    };

    const demoGroups = await db.all(
        `SELECT g.name, g.invite_code AS inviteCode, COUNT(m.id) AS memberCount
         FROM friend_groups g
         LEFT JOIN friend_group_members m ON m.group_id = g.id
         GROUP BY g.id
         ORDER BY g.name ASC`
    );

    console.log(JSON.stringify({
        expectedDemoUsers: 7,
        foundDemoUsers: users.length,
        counts: {
            users: counts.users?.total || 0,
            calendars: counts.calendars?.total || 0,
            events: counts.events?.total || 0,
            groups: counts.groups?.total || 0,
            memberships: counts.memberships?.total || 0
        },
        demoUsers: users,
        demoGroups
    }, null, 2));

    await db.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
