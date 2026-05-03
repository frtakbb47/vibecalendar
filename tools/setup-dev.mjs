import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('Created .env from .env.example');
} else if (!fs.existsSync(envExamplePath)) {
    console.warn('Missing .env.example. Skipping env bootstrap.');
} else {
    console.log('.env already exists.');
}

const npmCli = process.env.npm_execpath;
const nodeExecutable = process.execPath;

if (!npmCli) {
    console.error('Cannot locate npm executable from this environment.');
    process.exit(1);
}

const migrateResult = spawnSync(nodeExecutable, [npmCli, 'run', 'db:migrate'], {
    stdio: 'inherit'
});

if (migrateResult.status !== 0) {
    process.exit(migrateResult.status || 1);
}
// Optionally seed sample/demo data for local development.
// Set SEED_SAMPLE_DATA=false to skip seeding. Defaults to enabled in non-production.
const shouldSeed = process.env.SEED_SAMPLE_DATA !== 'false' && process.env.NODE_ENV !== 'production';
if (shouldSeed) {
    console.log('Seeding sample data (SEED_SAMPLE_DATA is not false)...');
    const seedResult = spawnSync(nodeExecutable, [npmCli, 'run', 'seed:sample'], { stdio: 'inherit' });
    if (seedResult.status !== 0) {
        console.error('Seeding sample data failed.');
        process.exit(seedResult.status || 1);
    }
}

console.log('Dev setup complete.');
