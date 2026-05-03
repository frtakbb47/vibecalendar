import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { config } from './config.js';

let database;

export async function getDb() {
    if (database) {
        return database;
    }

    const resolvedPath = path.resolve(config.dbPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

    database = await open({
        filename: resolvedPath,
        driver: sqlite3.Database
    });

    await database.exec('PRAGMA foreign_keys = ON;');
    await database.exec('PRAGMA journal_mode = WAL;');

    return database;
}
