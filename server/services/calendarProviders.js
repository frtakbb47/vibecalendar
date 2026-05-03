import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';
import ical from 'node-ical';
import { config } from '../config.js';

function makeGoogleClient() {
    if (!config.googleClientId || !config.googleClientSecret) {
        return null;
    }

    return new google.auth.OAuth2(
        config.googleClientId,
        config.googleClientSecret,
        config.googleRedirectUri
    );
}

function makeMsalClient() {
    if (!config.outlookClientId || !config.outlookClientSecret) {
        return null;
    }

    return new ConfidentialClientApplication({
        auth: {
            clientId: config.outlookClientId,
            clientSecret: config.outlookClientSecret,
            authority: `https://login.microsoftonline.com/${config.outlookTenantId}`
        }
    });
}

export async function getOauthStartPayload(provider, state) {
    if (provider === 'google') {
        const client = makeGoogleClient();
        if (!client) {
            return {
                authUrl: '',
                unavailableReason: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
            };
        }

        return {
            authUrl: client.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/calendar.readonly'],
                state,
                prompt: 'consent'
            })
        };
    }

    if (provider === 'outlook') {
        const msal = makeMsalClient();
        if (!msal) {
            return {
                authUrl: '',
                unavailableReason: 'Outlook OAuth is not configured. Add OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET.'
            };
        }

        const authUrl = await msal.getAuthCodeUrl({
            scopes: ['Calendars.Read'],
            redirectUri: config.outlookRedirectUri,
            state
        });

        return { authUrl };
    }

    return { authUrl: '', unavailableReason: 'Unsupported provider.' };
}

export async function exchangeOauthCode(provider, code) {
    if (!code) {
        return { accessToken: `dev-token-${randomUUID()}`, refreshToken: '' };
    }

    if (provider === 'google') {
        const client = makeGoogleClient();
        if (!client) {
            return { accessToken: `dev-token-${randomUUID()}`, refreshToken: '' };
        }

        const { tokens } = await client.getToken(code);
        return {
            accessToken: tokens.access_token || `dev-token-${randomUUID()}`,
            refreshToken: tokens.refresh_token || ''
        };
    }

    if (provider === 'outlook') {
        const msal = makeMsalClient();
        if (!msal) {
            return { accessToken: `dev-token-${randomUUID()}`, refreshToken: '' };
        }

        const result = await msal.acquireTokenByCode({
            code,
            scopes: ['Calendars.Read'],
            redirectUri: config.outlookRedirectUri
        });

        return {
            accessToken: result?.accessToken || `dev-token-${randomUUID()}`,
            refreshToken: ''
        };
    }

    return { accessToken: `dev-token-${randomUUID()}`, refreshToken: '' };
}

export async function pullIcalEvents(url) {
    const parsed = await ical.async.fromURL(url);
    const events = [];

    for (const value of Object.values(parsed)) {
        if (value.type !== 'VEVENT') {
            continue;
        }

        const start = value.start instanceof Date ? value.start.toISOString() : null;
        const end = value.end instanceof Date ? value.end.toISOString() : null;
        if (!start || !end) {
            continue;
        }

        events.push({
            title: value.summary || 'Calendar event',
            description: value.description || null,
            locationText: value.location || null,
            startAt: start,
            endAt: end
        });
    }

    return events;
}
