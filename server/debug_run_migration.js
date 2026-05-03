import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function debug() {
    const db = await open({ filename: path.resolve('./server/vibecalendar.db'), driver: sqlite3.Database });
    const sql = fs.readFileSync(path.resolve('./server/migrations/002_sample_data.sql'), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < statements.length; i++) {
        const st = statements[i];
        try {
            console.log(`RUNNING [${i + 1}/${statements.length}]`, st.replace(/\n/g, ' ').slice(0, 200));
            await db.exec(st + ';');
        } catch (err) {
            console.error(`STATEMENT FAILED [${i + 1}]`, err.message);
            break;
        }
    }
    await db.close();
}

debug().catch((e) => { console.error(e); process.exit(1) });
