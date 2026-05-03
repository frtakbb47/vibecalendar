import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './db.js';

async function runMigrations() {
    const db = await getDb();
    const migrationsDir = path.resolve('./server/migrations');
    const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

    await db.exec('CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');

    for (const file of files) {
        const alreadyApplied = await db.get('SELECT id FROM _migrations WHERE id = ?', file);
        if (alreadyApplied) {
            continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await db.exec('BEGIN;');
        try {
            await db.exec(sql);
            await db.run('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)', file, new Date().toISOString());
            await db.exec('COMMIT;');
            console.log(`Applied migration ${file}`);
        } catch (error) {
            await db.exec('ROLLBACK;');
            throw error;
        }
    }

    console.log('Migrations complete.');
}

runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
