import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: Number(process.env.PORT || 8787),
    jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
    dbPath: process.env.DB_PATH || './server/vibecalendar.db',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
    serverUrl: process.env.SERVER_URL || 'http://localhost:8787',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri:
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8787/api/calendars/oauth/google/callback',
    outlookClientId: process.env.OUTLOOK_CLIENT_ID || '',
    outlookClientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
    outlookTenantId: process.env.OUTLOOK_TENANT_ID || 'common',
    outlookRedirectUri:
        process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:8787/api/calendars/oauth/outlook/callback'
};
