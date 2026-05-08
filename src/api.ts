export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export type User = {
    id: string;
    name: string;
    email: string;
    timezone?: string;
    locationConsent?: number;
    socialConsent?: number;
    calendarWriteConsent?: number;
};

export type CalendarConnection = {
    id: string;
    provider: string;
    importMode: 'standard' | 'hidden';
    accessScope: 'read' | 'read_write';
    status: string;
    syncStatus: string;
    lastSyncedAt: string | null;
};

export type EventItem = {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    effortLevel: 'Low' | 'Medium' | 'High' | 'Very High' | null;
    sourceVisibility: 'standard' | 'hidden';
    category: string | null;
};

export type Suggestion = {
    id: string;
    type: string;
    title: string;
    rationale: string;
    startAt: string;
    endAt: string;
    status: 'pending' | 'added' | 'ignored';
    priority: number;
};

export type NotificationItem = {
    id: string;
    type: string;
    title: string;
    body: string;
    actionTaken: string;
    sentAt: string;
};

export type Group = {
    id: string;
    name: string;
    inviteCode: string;
};

export type ConsentPayload = {
    locationConsent: boolean;
    socialConsent: boolean;
    calendarWriteConsent: boolean;
};

function buildQuery(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            search.set(key, value);
        }
    }
    const query = search.toString();
    return query ? `?${query}` : '';
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Request failed.' }));
        throw new Error(body.error || 'Request failed.');
    }

    return response.json();
}

export function apiRegister(input: {
    name: string;
    email: string;
    password: string;
    timezone: string;
}) {
    return request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function apiLogin(input: { email: string; password: string }) {
    return request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function apiMe(token: string) {
    return request<User>('/api/auth/me', {}, token);
}

export function apiUpdateConsent(token: string, payload: ConsentPayload) {
    return request<{ ok: boolean }>('/api/users/consent', {
        method: 'PUT',
        body: JSON.stringify(payload)
    }, token);
}

export function apiCalendars(token: string) {
    return request<CalendarConnection[]>('/api/calendars', {}, token);
}

export function apiIcalConnect(token: string, url: string, importMode: 'standard' | 'hidden') {
    return request<{ id: string }>('/api/calendars/ical/connect', {
        method: 'POST',
        body: JSON.stringify({ url, importMode })
    }, token);
}

export function apiCalendarSync(token: string, id: string) {
    return request<{ ok: boolean; imported: number; note?: string }>(`/api/calendars/${id}/sync`, {
        method: 'POST'
    }, token);
}

export function apiOauthStart(token: string, provider: 'google' | 'outlook') {
    return request<{ authUrl: string; unavailableReason?: string }>(`/api/calendars/oauth/${provider}/start`, {}, token);
}

export function apiEvents(token: string) {
    return request<EventItem[]>('/api/events', {}, token);
}

export function apiCreateEvent(token: string, input: { title?: string; startAt: string; endAt: string; sourceVisibility?: 'standard' | 'hidden'; isBusyBlockOnly?: boolean; category?: string | null }) {
    return request<EventItem>('/api/events', {
        method: 'POST',
        body: JSON.stringify(input)
    }, token);
}

export function apiUpdateCategory(token: string, eventId: string, category: string | null) {
    return request<{ ok: boolean }>(`/api/events/${eventId}/category`, {
        method: 'PATCH',
        body: JSON.stringify({ category })
    }, token);
}

export function apiUpdateEffort(token: string, eventId: string, effortLevel: 'Low' | 'Medium' | 'High' | 'Very High') {
    return request<{ ok: boolean }>(`/api/events/${eventId}/effort`, {
        method: 'PATCH',
        body: JSON.stringify({ effortLevel })
    }, token);
}

export function apiRunSuggestions(token: string, options?: { date?: string; refresh?: boolean }) {
    const query = buildQuery({
        date: options?.date,
        refresh: options?.refresh ? '1' : undefined
    });
    return request<{ createdCount: number; notificationsCount: number }>(`/api/suggestions/run${query}`, {
        method: 'POST'
    }, token);
}

export function apiSuggestions(token: string, date?: string) {
    const query = buildQuery({ date });
    return request<Suggestion[]>(`/api/suggestions${query}`, {}, token);
}

export function apiSuggestionAction(token: string, id: string, action: 'added' | 'ignored') {
    return request<{ ok: boolean; createdEvent?: EventItem | null }>(`/api/suggestions/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
    }, token);
}

export function apiMorningSummary(token: string, date?: string) {
    const query = buildQuery({ date });
    return request<{ headline: string; topSuggestions: Suggestion[] }>(`/api/morning-summary${query}`, {}, token);
}

export function apiNotifications(token: string) {
    return request<NotificationItem[]>('/api/notifications', {}, token);
}

export function apiGroups(token: string) {
    return request<Group[]>('/api/groups', {}, token);
}

export function apiCreateGroup(token: string, name: string) {
    return request<Group>('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name })
    }, token);
}

export function apiJoinGroup(token: string, inviteCode: string, sharingMode: 'availability_only' | 'selected_events') {
    return request<{ ok: boolean }>('/api/groups/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode, sharingMode })
    }, token);
}
