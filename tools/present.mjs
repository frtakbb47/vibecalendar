#!/usr/bin/env node
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function runSeed() {
    console.log('Seeding demo data...');
    const res = spawnSync(process.execPath, [path.join('server', 'seed_from_sample.js')], { stdio: 'inherit' });
    if (res.status !== 0) {
        console.error('Seeding failed.');
        process.exit(res.status || 1);
    }
}

function printCredentials() {
    const samplePath = path.join('server', 'sample_data', 'example_accounts.json');
    if (!fs.existsSync(samplePath)) return;
    const raw = fs.readFileSync(samplePath, 'utf8');
    try {
        const arr = JSON.parse(raw);
        console.log('\nDemo accounts:');
        for (const a of arr) {
            console.log(`- ${a.email} / ${a.password}  (${a.name || ''})`);
        }
        console.log('\nSeeded friend groups: vibe-study1, vibe-recover, vibe-night1');
    } catch (e) {
        // ignore
    }
}

function startPresent() {
    console.log('\nStarting app (API + frontend)...');
    try {
        const child = spawn('npm', ['run', 'dev:full'], { stdio: 'inherit', shell: true });
        child.on('exit', (code) => {
            process.exit(code ?? 0);
        });
    } catch (err) {
        console.error('Failed to start dev server. Run `npm run dev:full` manually.');
        process.exit(1);
    }
}

// main
runSeed();
printCredentials();
startPresent();
