import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    apiCalendars,
    apiCalendarSync,
    apiCreateGroup,
    apiEvents,
    apiCreateEvent,
    apiGroups,
    apiIcalConnect,
    apiJoinGroup,
    apiLogin,
    apiMe,
    apiMorningSummary,
    apiNotifications,
    apiOauthStart,
    apiRegister,
    apiRunSuggestions,
    apiSuggestionAction,
    apiSuggestions,
    apiUpdateConsent,
    apiUpdateEffort,
    CalendarConnection,
    EventItem,
    Group,
    NotificationItem,
    Suggestion,
    User
} from './api';

type TabId = 'today' | 'planner' | 'calendar' | 'groups' | 'settings';
type AuthMode = 'login' | 'register';

const DEMO_ACCOUNTS = [
    {
        label: 'Alice: full calendar + mixed effort',
        email: 'alice@student.edu',
        password: 'alicepass'
    },
    {
        label: 'Bob: hidden busy blocks only',
        email: 'bob@student.edu',
        password: 'bobpass'
    },
    {
        label: 'Carla: stacked day with overnight work',
        email: 'carla@student.edu',
        password: 'carlapass'
    }
];

const TOKEN_KEY = 'vibecalendar_token';

function formatLocalTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toDateKeyLocal(iso: string) {
    const date = new Date(iso);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function monthKeyFromDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function monthKeyToDate(monthKey: string) {
    const [yearText, monthText] = monthKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    return new Date(year, month - 1, 1);
}

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(null);
    const [tab, setTab] = useState<TabId>('today');
    const [authMode, setAuthMode] = useState<AuthMode>('register');
    const [error, setError] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');

    const [calendars, setCalendars] = useState<CalendarConnection[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [morningHeadline, setMorningHeadline] = useState('Your morning summary is loading.');
    const [demoAccountLabel, setDemoAccountLabel] = useState('');
    const [demoMode, setDemoMode] = useState(false);
    const [demoStep, setDemoStep] = useState(0);
    const [demoCompact, setDemoCompact] = useState(false);
    const [plannerMonth, setPlannerMonth] = useState(() => monthKeyFromDate(new Date()));
    const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKeyLocal(new Date().toISOString()));
    const [plannerView, setPlannerView] = useState<'month' | 'week'>('month');

    const [icalUrl, setIcalUrl] = useState('');
    const [icalHidden, setIcalHidden] = useState(true);
    const [newGroupName, setNewGroupName] = useState('Study Squad');
    const [joinCode, setJoinCode] = useState('');

    const [consent, setConsent] = useState({
        locationConsent: false,
        socialConsent: true,
        calendarWriteConsent: false
    });

    const pendingCount = useMemo(
        () => suggestions.filter((suggestion) => suggestion.status === 'pending').length,
        [suggestions]
    );

    const activeSuggestions = suggestions.filter((suggestion) => suggestion.status === 'pending').slice(0, 3);
    const hiddenBlocks = events.filter((eventItem) => eventItem.sourceVisibility === 'hidden').length;
    const highEffortEvents = events.filter((eventItem) => eventItem.effortLevel === 'High' || eventItem.effortLevel === 'Very High').length;
    const eventsByDateKey = useMemo(() => {
        const map = new Map<string, EventItem[]>();
        for (const item of events) {
            const key = toDateKeyLocal(item.startAt);
            const list = map.get(key) || [];
            list.push(item);
            map.set(key, list);
        }
        for (const list of map.values()) {
            list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        }
        return map;
    }, [events]);

    const monthDate = useMemo(() => monthKeyToDate(plannerMonth), [plannerMonth]);
    const monthLabel = useMemo(
        () => monthDate.toLocaleDateString([], { month: 'long', year: 'numeric' }),
        [monthDate]
    );
    const monthCells = useMemo(() => {
        const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const gridStart = new Date(firstOfMonth);
        gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

        return Array.from({ length: 42 }, (_, index) => {
            const cellDate = new Date(gridStart);
            cellDate.setDate(gridStart.getDate() + index);
            const key = toDateKeyLocal(cellDate.toISOString());
            const inMonth = cellDate.getMonth() === monthDate.getMonth();
            return {
                key,
                day: cellDate.getDate(),
                inMonth,
                eventCount: eventsByDateKey.get(key)?.length || 0,
                events: eventsByDateKey.get(key) || []
            };
        });
    }, [monthDate, eventsByDateKey]);

    const selectedDayEvents = useMemo(() => eventsByDateKey.get(selectedDateKey) || [], [eventsByDateKey, selectedDateKey]);
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const weekStartDate = useMemo(() => {
        const d = new Date(selectedDateKey + 'T00:00:00');
        const sunday = new Date(d);
        sunday.setDate(d.getDate() - d.getDay());
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    }, [selectedDateKey]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const dd = new Date(weekStartDate);
            dd.setDate(weekStartDate.getDate() + i);
            const key = toDateKeyLocal(dd.toISOString());
            return { date: dd, key, events: eventsByDateKey.get(key) || [] };
        });
    }, [weekStartDate, eventsByDateKey]);

    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
    // drag-to-create state
    const [dragPos, setDragPos] = useState<{ columnKey: string; startY: number; currentY: number } | null>(null);
    const [tempEventRange, setTempEventRange] = useState<{ startISO: string; endISO: string; columnKey: string } | null>(null);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [quickTitle, setQuickTitle] = useState('Quick Event');
    const HOUR_PX = 40;
    const [tourOpen, setTourOpen] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    useEffect(() => {
        // add a visual highlight to the week timeline during tour step 1
        const selector = '.planner-week-timeline';
        const el = document.querySelector(selector);
        if (!el) return;
        if (tourOpen && tourStep === 1) {
            el.classList.add('tour-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            el.classList.remove('tour-highlight');
        }
        return () => {
            el.classList.remove('tour-highlight');
        };
    }, [tourOpen, tourStep]);

    async function loadDashboard(activeToken: string) {
        const [me, calendarItems, eventItems, suggestionItems, summary, noticeItems, groupItems] = await Promise.all([
            apiMe(activeToken),
            apiCalendars(activeToken),
            apiEvents(activeToken),
            apiSuggestions(activeToken),
            apiMorningSummary(activeToken),
            apiNotifications(activeToken),
            apiGroups(activeToken)
        ]);

        setUser(me);
        setCalendars(calendarItems);
        setEvents(eventItems);
        setSuggestions(suggestionItems);
        setMorningHeadline(summary.headline);
        setNotifications(noticeItems);
        setGroups(groupItems);
        setConsent({
            locationConsent: Boolean(me.locationConsent),
            socialConsent: Boolean(me.socialConsent),
            calendarWriteConsent: Boolean(me.calendarWriteConsent)
        });
    }

    useEffect(() => {
        if (!token) {
            return;
        }

        loadDashboard(token).catch((loadError) => {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.');
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
        });
    }, [token]);

    async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setStatusMessage('');

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get('email') || '');
        const password = String(formData.get('password') || '');

        try {
            if (authMode === 'register') {
                const name = String(formData.get('name') || 'Student');
                const timezone = String(formData.get('timezone') || 'America/New_York');
                const response = await apiRegister({ name, email, password, timezone });
                setToken(response.token);
                localStorage.setItem(TOKEN_KEY, response.token);
            } else {
                const response = await apiLogin({ email, password });
                setToken(response.token);
                localStorage.setItem(TOKEN_KEY, response.token);
            }
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : 'Sign in failed.');
        }
    }

    function useDemoAccount(index: number) {
        const demo = DEMO_ACCOUNTS[index];
        setAuthMode('login');
        setDemoAccountLabel(demo.label);
        setError('');
        setStatusMessage('');

        const form = document.querySelector<HTMLFormElement>('.auth-form');
        if (!form) {
            return;
        }

        const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
        const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');
        if (emailInput) {
            emailInput.value = demo.email;
        }
        if (passwordInput) {
            passwordInput.value = demo.password;
        }
    }

    async function startDemo() {
        setError('');
        setStatusMessage('Starting demo...');
        try {
            // Auto-login as Alice for demo mode
            const resp = await apiLogin({ email: 'alice@student.edu', password: 'alicepass' });
            setToken(resp.token);
            localStorage.setItem(TOKEN_KEY, resp.token);
            setDemoMode(true);
            setDemoStep(1);
            setTab('today');
            setStatusMessage('Demo mode started. Follow the walkthrough.')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Demo start failed');
            setStatusMessage('');
        }
    }

    function advanceDemo() {
        const next = demoStep + 1;
        if (next === 2) setTab('calendar');
        if (next === 3) setTab('settings');
        if (next > 3) {
            // finish
            setDemoMode(false);
            setDemoStep(0);
            setStatusMessage('Demo finished. You can explore freely.');
            return;
        }
        setDemoStep(next);
    }

    function exitDemo() {
        setDemoMode(false);
        setDemoStep(0);
        setStatusMessage('Exited demo mode.');
    }

    function toggleCompact() {
        setDemoCompact((c) => {
            const next = !c;
            if (next) setTab('today');
            return next;
        });
    }

    function plannerMoveMonth(delta: number) {
        const current = monthKeyToDate(plannerMonth);
        const next = new Date(current.getFullYear(), current.getMonth() + delta, 1);
        setPlannerMonth(monthKeyFromDate(next));
    }

    function plannerJumpToToday() {
        const now = new Date();
        setPlannerMonth(monthKeyFromDate(now));
        setSelectedDateKey(toDateKeyLocal(now.toISOString()));
    }

    function handleColumnPointerDown(e: React.MouseEvent<HTMLDivElement>, d: { date: Date; key: string }) {
        if (e.button !== 0) return;
        const target = e.currentTarget as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const startY = e.clientY - rect.top;
        setDragPos({ columnKey: d.key, startY, currentY: startY });

        function onMove(ev: MouseEvent) {
            const y = ev.clientY - rect.top;
            setDragPos((prev) => (prev && prev.columnKey === d.key ? { ...prev, currentY: y } : prev));
        }

        function onUp(ev: MouseEvent) {
            const endY = ev.clientY - rect.top;
            setDragPos((prev) => (prev && prev.columnKey === d.key ? { ...prev, currentY: endY } : prev));

            // compute start/end times rounded to 5 minutes
            const startPx = Math.min(startY, endY);
            const endPx = Math.max(startY, endY);
            const startH = startPx / HOUR_PX;
            const endH = endPx / HOUR_PX;
            const startHour = Math.floor(startH);
            const startMin = Math.round((startH - startHour) * 60 / 5) * 5;
            const endHour = Math.floor(endH);
            const endMin = Math.round((endH - endHour) * 60 / 5) * 5;

            const sDate = new Date(d.date);
            sDate.setHours(startHour, startMin, 0, 0);
            const eDate = new Date(d.date);
            eDate.setHours(endHour, endMin, 0, 0);
            if (eDate <= sDate) eDate.setTime(sDate.getTime() + 30 * 60 * 1000);

            setTempEventRange({ startISO: sDate.toISOString(), endISO: eDate.toISOString(), columnKey: d.key });
            setShowQuickCreate(true);
            setDragPos(null);

            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    async function connectOauth(provider: 'google' | 'outlook') {
        if (!token) {
            return;
        }

        setError('');
        setStatusMessage('');

        try {
            const payload = await apiOauthStart(token, provider);
            if (payload.authUrl) {
                window.location.href = payload.authUrl;
                return;
            }

            setStatusMessage(payload.unavailableReason || 'Provider setup incomplete. Add environment variables.');
        } catch (connectError) {
            setError(connectError instanceof Error ? connectError.message : 'Failed to start OAuth flow.');
        }
    }

    async function connectIcal() {
        if (!token || !icalUrl.trim()) {
            return;
        }

        setError('');
        try {
            await apiIcalConnect(token, icalUrl.trim(), icalHidden ? 'hidden' : 'standard');
            setIcalUrl('');
            const refreshed = await apiCalendars(token);
            setCalendars(refreshed);
            setStatusMessage('iCal calendar connected. Run sync to import events.');
        } catch (connectError) {
            setError(connectError instanceof Error ? connectError.message : 'Failed to connect iCal.');
        }
    }

    async function syncCalendar(calendarId: string) {
        if (!token) {
            return;
        }

        setError('');
        try {
            const result = await apiCalendarSync(token, calendarId);
            const [refreshedCalendars, refreshedEvents] = await Promise.all([apiCalendars(token), apiEvents(token)]);
            setCalendars(refreshedCalendars);
            setEvents(refreshedEvents);
            setStatusMessage(result.note || `Sync complete: ${result.imported} events imported.`);
        } catch (syncError) {
            setError(syncError instanceof Error ? syncError.message : 'Failed to sync calendar.');
        }
    }

    async function updateEffort(eventId: string, effortLevel: 'Low' | 'Medium' | 'High' | 'Very High') {
        if (!token) {
            return;
        }

        setError('');
        try {
            await apiUpdateEffort(token, eventId, effortLevel);
            const refreshed = await apiEvents(token);
            setEvents(refreshed);
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : 'Failed to update effort level.');
        }
    }

    async function runSuggestionsNow() {
        if (!token) {
            return;
        }

        setError('');
        try {
            await apiRunSuggestions(token);
            const [refreshedSuggestions, refreshedNotifications, summary] = await Promise.all([
                apiSuggestions(token),
                apiNotifications(token),
                apiMorningSummary(token)
            ]);
            setSuggestions(refreshedSuggestions);
            setNotifications(refreshedNotifications);
            setMorningHeadline(summary.headline);
            setStatusMessage('Suggestions refreshed from your current schedule.');
        } catch (suggestionError) {
            setError(suggestionError instanceof Error ? suggestionError.message : 'Failed to run suggestion engine.');
        }
    }

    async function takeSuggestionAction(id: string, action: 'added' | 'ignored') {
        if (!token) {
            return;
        }

        setError('');
        try {
            await apiSuggestionAction(token, id, action);
            const refreshed = await apiSuggestions(token);
            setSuggestions(refreshed);
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : 'Failed to record suggestion action.');
        }
    }

    async function updateConsentValues() {
        if (!token) {
            return;
        }

        setError('');
        try {
            await apiUpdateConsent(token, consent);
            setStatusMessage('Privacy choices saved. You stay in control.');
        } catch (consentError) {
            setError(consentError instanceof Error ? consentError.message : 'Failed to update consent settings.');
        }
    }

    async function createGroup() {
        if (!token || !newGroupName.trim()) {
            return;
        }

        setError('');
        try {
            await apiCreateGroup(token, newGroupName.trim());
            const refreshed = await apiGroups(token);
            setGroups(refreshed);
            setStatusMessage('Friend group created. Invite code is ready to share.');
        } catch (groupError) {
            setError(groupError instanceof Error ? groupError.message : 'Failed to create group.');
        }
    }

    async function joinGroup() {
        if (!token || !joinCode.trim()) {
            return;
        }

        setError('');
        try {
            await apiJoinGroup(token, joinCode.trim(), 'availability_only');
            const refreshed = await apiGroups(token);
            setGroups(refreshed);
            setJoinCode('');
            setStatusMessage('Joined group successfully.');
        } catch (joinError) {
            setError(joinError instanceof Error ? joinError.message : 'Failed to join group.');
        }
    }

    function logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
    }

    if (!token || !user) {
        return (
            <div className="app-shell">
                <header className="hero-card auth-hero">
                    <div>
                        <p className="eyebrow">Student Calendar Assistant</p>
                        <h1>VibeCalendar</h1>
                        <p className="hero-copy">
                            Build healthy momentum from calendar gaps, one supportive nudge at a time.
                        </p>
                        <div className="story-strip">
                            <span>1. Connect your schedule</span>
                            <span>2. See the best next action</span>
                            <span>3. Keep privacy in control</span>
                        </div>
                    </div>
                    <div className="summary-chip pitch-chip">
                        <span className="chip-label">Vision</span>
                        <strong>Turn free time into recovery, focus, and momentum.</strong>
                    </div>
                </header>

                <main className="content-grid single-column">
                    <section className="panel auth-panel">
                        <h2>{authMode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
                        <p className="muted">Web MVP includes privacy-first calendar imports, suggestions, and friend groups.</p>
                        {demoAccountLabel && <p className="status-text">Loaded demo account: {demoAccountLabel}</p>}
                        <div className="demo-grid">
                            {DEMO_ACCOUNTS.map((account, index) => (
                                <button key={account.email} type="button" className="demo-card" onClick={() => useDemoAccount(index)}>
                                    <strong>{account.label}</strong>
                                    <span>{account.email}</span>
                                </button>
                            ))}
                            <button type="button" className="demo-card" onClick={startDemo}>
                                <strong>Start full demo</strong>
                                <span>Auto-login and guided walkthrough</span>
                            </button>
                        </div>
                        <form className="auth-form" onSubmit={onAuthSubmit}>
                            {authMode === 'register' && (
                                <>
                                    <label>
                                        Name
                                        <input name="name" defaultValue="Student" required />
                                    </label>
                                    <label>
                                        Timezone
                                        <input name="timezone" defaultValue="America/New_York" required />
                                    </label>
                                </>
                            )}
                            <label>
                                Email
                                <input name="email" type="email" required />
                            </label>
                            <label>
                                Password
                                <input name="password" type="password" minLength={8} required />
                            </label>
                            <button type="submit">{authMode === 'register' ? 'Create account' : 'Sign in'}</button>
                        </form>
                        <button
                            type="button"
                            className="ghost"
                            onClick={() => setAuthMode((current) => (current === 'register' ? 'login' : 'register'))}
                        >
                            {authMode === 'register' ? 'I already have an account' : 'I am new here'}
                        </button>
                        {error && <p className="error-text">{error}</p>}
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <header className="hero-card">
                <div>
                    <p className="eyebrow">Student Calendar Assistant</p>
                    <h1>VibeCalendar</h1>
                    <p className="hero-copy">Hi {user.name}, let us turn today&apos;s gaps into practical, healthy wins.</p>
                    <div className="story-strip compact">
                        <span>Focus on one recommendation at a time</span>
                        <span>Show why the suggestion exists</span>
                        <span>Keep sensitive details private</span>
                    </div>
                </div>
                <div className="summary-chip">
                    <span className="chip-label">Pending suggestions</span>
                    <strong>{pendingCount}</strong>
                    <button type="button" className="ghost" onClick={logout}>
                        Log out
                    </button>
                </div>
            </header>

            <nav className="tab-nav" aria-label="Primary navigation">
                {(() => {
                    const base = [
                        { id: 'today', label: 'Today' },
                        { id: 'planner', label: 'Full Planner' },
                        { id: 'calendar', label: 'Calendar Setup' },
                        { id: 'groups', label: 'Friend Groups' },
                        { id: 'settings', label: 'Settings' }
                    ];
                    let items = base;
                    if (demoMode && demoCompact) {
                        items = base.filter((i) => i.id === 'today');
                    }

                    return items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={tab === item.id ? 'tab active' : 'tab'}
                            onClick={() => setTab(item.id as TabId)}
                        >
                            {item.label}
                        </button>
                    ));
                })()}
            </nav>

            {(statusMessage || error) && (
                <>
                    <section className="panel status-panel">
                        {statusMessage && <p className="status-text">{statusMessage}</p>}
                        {error && <p className="error-text">{error}</p>}
                    </section>
                    {tourOpen && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h3>Planner Tour</h3>
                                {tourStep === 0 && (
                                    <div>
                                        <p>Welcome to the Planner tour. The Month view gives you a calendar heatmap of your schedule.</p>
                                        <p>Click Next to open the Week view and try drag-to-create.</p>
                                    </div>
                                )}
                                {tourStep === 1 && (
                                    <div>
                                        <p>The Week view shows an hour-by-hour timeline. Use click-and-drag to create a quick event.</p>
                                        <p>Try creating a short event now — it will persist to the backend during the presentation.</p>
                                    </div>
                                )}
                                <div className="actions">
                                    <button onClick={() => {
                                        if (tourStep === 0) {
                                            setTourStep(1);
                                            setPlannerView('week');
                                        } else {
                                            setTourOpen(false);
                                            setTourStep(0);
                                        }
                                    }}>
                                        {tourStep === 0 ? 'Next' : 'Finish'}
                                    </button>
                                    <button className="ghost" onClick={() => { setTourOpen(false); setTourStep(0); }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <main className="content-grid">
                {demoMode && (
                    <section className="panel demo-banner">
                        <div className="inline-row">
                            <div>
                                <strong>Demo mode</strong>
                                <p className="muted">Step {demoStep} of 3 — {demoStep === 1 ? 'Today: suggestions' : demoStep === 2 ? 'Calendar: imports' : demoStep === 3 ? 'Settings: privacy' : ''}</p>
                            </div>
                            <div className="row-actions">
                                <button onClick={advanceDemo}>Next</button>
                                <button className="ghost" onClick={exitDemo}>Exit demo</button>
                                <button className="ghost" onClick={toggleCompact}>{demoCompact ? 'Exit compact' : 'Compact demo'}</button>
                            </div>
                        </div>
                    </section>
                )}
                {tab === 'today' && (
                    <>
                        <section className="panel">
                            <h2>Today&apos;s story</h2>
                            <div className="metric-row">
                                <div className="metric-card">
                                    <strong>{events.length}</strong>
                                    <span>events on your schedule</span>
                                </div>
                                <div className="metric-card">
                                    <strong>{hiddenBlocks}</strong>
                                    <span>private blocks protected</span>
                                </div>
                                <div className="metric-card">
                                    <strong>{highEffortEvents}</strong>
                                    <span>high-effort anchors</span>
                                </div>
                            </div>
                        </section>

                        <section className="panel feature-callout">
                            <h2>How it helps</h2>
                            <p>
                                VibeCalendar does one thing well: it finds the right next action in the gaps between your commitments.
                                The product is designed to be easy to understand in a live demo, with privacy and user control visible at every step.
                            </p>
                            <div className="feature-pill-row">
                                <span>Gap-based suggestions</span>
                                <span>Privacy-preserving imports</span>
                                <span>Effort-aware timing</span>
                            </div>
                        </section>

                        <section className="panel">
                            <div className="inline-row">
                                <h2>Morning Summary</h2>
                                <button type="button" onClick={runSuggestionsNow}>
                                    Refresh suggestions
                                </button>
                            </div>
                            <p>{morningHeadline}</p>
                            <ul className="list">
                                {activeSuggestions.map((item) => (
                                    <li key={item.id}>
                                        <strong>{formatLocalTime(item.startAt)}</strong> - {item.title}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="panel">
                            <h2>Live Suggestions</h2>
                            <p className="muted">Notifications always offer two actions: Add to calendar or Ignore.</p>
                            <div className="stack">
                                {suggestions.map((suggestion) => (
                                    <article key={suggestion.id} className="suggestion-card">
                                        <div className="suggestion-head">
                                            <strong>{formatLocalTime(suggestion.startAt)}</strong>
                                            <span className={`badge state-${suggestion.status}`}>{suggestion.status}</span>
                                        </div>
                                        <h3>{suggestion.title}</h3>
                                        <p>{suggestion.rationale}</p>
                                        <div className="actions">
                                            <button
                                                type="button"
                                                onClick={() => takeSuggestionAction(suggestion.id, 'added')}
                                                disabled={suggestion.status !== 'pending'}
                                            >
                                                Add to calendar
                                            </button>
                                            <button
                                                type="button"
                                                className="ghost"
                                                onClick={() => takeSuggestionAction(suggestion.id, 'ignored')}
                                                disabled={suggestion.status !== 'pending'}
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="panel">
                            <h2>Notification History</h2>
                            <ul className="list">
                                {notifications.slice(0, 6).map((notice) => (
                                    <li key={notice.id}>
                                        <strong>{new Date(notice.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                        {' - '}
                                        {notice.title}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </>
                )}

                {tab === 'planner' && (
                    <>
                        <section className="panel planner-panel">
                            <div className="inline-row">
                                <h2>Full Calendar Planner</h2>
                                <div className="actions planner-nav-actions">
                                    <button type="button" className="ghost" onClick={() => plannerMoveMonth(-1)}>
                                        Previous
                                    </button>
                                    <button type="button" className="ghost" onClick={plannerJumpToToday}>
                                        Today
                                    </button>
                                    <button type="button" className="ghost" onClick={() => plannerMoveMonth(1)}>
                                        Next
                                    </button>
                                </div>
                                <div className="actions planner-view-toggle">
                                    <button
                                        type="button"
                                        className={`ghost ${plannerView === 'month' ? 'active' : ''}`}
                                        onClick={() => setPlannerView('month')}
                                    >
                                        Month
                                    </button>
                                    <button
                                        type="button"
                                        className={`ghost ${plannerView === 'week' ? 'active' : ''}`}
                                        onClick={() => setPlannerView('week')}
                                    >
                                        Week
                                    </button>
                                </div>
                                <div className="actions">
                                    <button type="button" className="ghost" onClick={() => { setTourOpen(true); setTourStep(0); }}>
                                        Start Tour
                                    </button>
                                </div>
                            </div>
                            <p className="muted">
                                Month view for your entire schedule. Hidden imports remain visible as protected busy blocks.
                            </p>
                            <h3 className="planner-month-label">{monthLabel}</h3>
                            {plannerView === 'month' && (
                                <>
                                    <div className="planner-weekdays">
                                        {weekdayLabels.map((weekday) => (
                                            <span key={weekday}>{weekday}</span>
                                        ))}
                                    </div>
                                    <div className="planner-grid">
                                        {monthCells.map((cell) => {
                                            const isSelected = selectedDateKey === cell.key;
                                            return (
                                                <button
                                                    type="button"
                                                    key={cell.key}
                                                    className={`planner-day ${cell.inMonth ? '' : 'is-outside'} ${isSelected ? 'is-selected' : ''}`}
                                                    onClick={() => setSelectedDateKey(cell.key)}
                                                >
                                                    <div className="planner-day-head">
                                                        <strong>{cell.day}</strong>
                                                        {cell.eventCount > 0 && <span>{cell.eventCount}</span>}
                                                    </div>
                                                    <div className="planner-day-events">
                                                        {cell.events.slice(0, 3).map((eventItem) => (
                                                            <span
                                                                key={eventItem.id}
                                                                className={`planner-pill ${eventItem.sourceVisibility === 'hidden' ? 'is-hidden' : ''}`}
                                                            >
                                                                {formatLocalTime(eventItem.startAt)} {eventItem.title}
                                                            </span>
                                                        ))}
                                                        {cell.events.length > 3 && (
                                                            <span className="planner-pill planner-more">+{cell.events.length - 3} more</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {plannerView === 'week' && (
                                <>
                                    <div className="planner-weekdays">
                                        {weekDays.map((d) => (
                                            <span key={d.key}>{new Date(d.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        ))}
                                    </div>
                                    <div className="planner-week-timeline">
                                        <div className="timeline-hours">
                                            {hours.map((h) => (
                                                <div key={h} className="timeline-hour">{`${h}:00`}</div>
                                            ))}
                                        </div>
                                        <div className="timeline-columns">
                                            {weekDays.map((d) => (
                                                <div key={d.key} className="timeline-column" onMouseDown={(e) => handleColumnPointerDown(e, d)}>
                                                    {(() => {
                                                        const dayStart = new Date(d.date);
                                                        dayStart.setHours(0, 0, 0, 0);

                                                        const evs = d.events
                                                            .map((ev) => {
                                                                const absStart = new Date(ev.startAt);
                                                                const absEnd = new Date(ev.endAt);
                                                                const clampedStart = absStart < dayStart ? new Date(dayStart) : absStart;
                                                                const clampedEnd = absEnd > new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) ? new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) : absEnd;
                                                                return { ev, absStart, absEnd, start: clampedStart, end: clampedEnd };
                                                            })
                                                            .sort((a, b) => a.start.getTime() - b.start.getTime());

                                                        const columnsEnd: number[] = [];
                                                        const placements: Map<string, { col: number; cols: number; top: number; height: number; continuesLeft?: boolean; continuesRight?: boolean }> = new Map();

                                                        for (const item of evs) {
                                                            const startOffsetH = item.start.getHours() + item.start.getMinutes() / 60;
                                                            const top = startOffsetH * HOUR_PX;
                                                            const height = Math.max(16, (item.end.getTime() - item.start.getTime()) / (1000 * 60 * 60) * HOUR_PX);

                                                            let assigned = -1;
                                                            for (let c = 0; c < columnsEnd.length; c++) {
                                                                if (item.start.getTime() >= columnsEnd[c]) {
                                                                    assigned = c;
                                                                    columnsEnd[c] = item.end.getTime();
                                                                    break;
                                                                }
                                                            }
                                                            if (assigned === -1) {
                                                                assigned = columnsEnd.length;
                                                                columnsEnd.push(item.end.getTime());
                                                            }

                                                            placements.set(item.ev.id, {
                                                                col: assigned,
                                                                cols: columnsEnd.length,
                                                                top,
                                                                height,
                                                                continuesLeft: item.absStart < dayStart,
                                                                continuesRight: item.absEnd > new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
                                                            });
                                                        }

                                                        return evs.map(({ ev, absStart, absEnd }) => {
                                                            const p = placements.get(ev.id)!;
                                                            const leftPct = (p.col / p.cols) * 100;
                                                            const widthPct = 100 / p.cols;
                                                            const continuesLeft = p.continuesLeft;
                                                            const continuesRight = p.continuesRight;
                                                            return (
                                                                <div
                                                                    key={ev.id}
                                                                    className={`timeline-event ${ev.sourceVisibility === 'hidden' ? 'is-hidden' : ''}`}
                                                                    style={{
                                                                        top: `${p.top}px`,
                                                                        height: `${p.height}px`,
                                                                        left: `calc(${leftPct}% + 6px)`,
                                                                        width: `calc(${widthPct}% - 12px)`
                                                                    }}
                                                                >
                                                                    <div className="timeline-event-title">
                                                                        {continuesLeft ? '← ' : ''}{ev.title || 'Busy'}{continuesRight ? ' →' : ''}
                                                                    </div>
                                                                    <div className="timeline-event-time muted">{formatLocalTime(absStart.toISOString())} - {formatLocalTime(absEnd.toISOString())}</div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}

                                                    {dragPos && dragPos.columnKey === d.key && (() => {
                                                        const top = Math.min(dragPos.startY, dragPos.currentY);
                                                        const bottom = Math.max(dragPos.startY, dragPos.currentY);
                                                        const height = Math.max(8, bottom - top);
                                                        return (
                                                            <div
                                                                className="timeline-event temp"
                                                                style={{ top: `${top}px`, height: `${height}px`, left: '6px', right: '6px' }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="panel">
                            <h2>Selected Day Details</h2>
                            <p className="muted">{new Date(`${selectedDateKey}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            {selectedDayEvents.length === 0 ? (
                                <p>No events on this day.</p>
                            ) : (
                                <div className="stack">
                                    {selectedDayEvents.map((eventItem) => (
                                        <article key={eventItem.id} className="event-row">
                                            <div>
                                                <strong>{eventItem.title}</strong>
                                                <p>
                                                    {formatLocalTime(eventItem.startAt)} - {formatLocalTime(eventItem.endAt)}
                                                </p>
                                            </div>
                                            <span className="muted">
                                                {eventItem.sourceVisibility === 'hidden' ? 'Private busy block' : eventItem.effortLevel || 'Unscored'}
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {showQuickCreate && tempEventRange && (
                            <div className="modal-overlay">
                                <div className="modal">
                                    <h3>Create quick event</h3>
                                    <p className="muted">{new Date(tempEventRange.startISO).toLocaleString()} - {new Date(tempEventRange.endISO).toLocaleString()}</p>
                                    <label>
                                        Title
                                        <input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} />
                                    </label>
                                    <div className="actions">
                                        <button
                                            onClick={async () => {
                                                setError('');
                                                try {
                                                    if (token) {
                                                        const created = await apiCreateEvent(token, {
                                                            title: quickTitle || undefined,
                                                            startAt: tempEventRange.startISO,
                                                            endAt: tempEventRange.endISO,
                                                            sourceVisibility: 'standard'
                                                        });
                                                        setEvents((prev) => [...prev, created]);
                                                    } else {
                                                        const evId = 'tmp-' + Math.random().toString(36).slice(2, 9);
                                                        const newEv: EventItem = {
                                                            id: evId,
                                                            title: quickTitle,
                                                            startAt: tempEventRange.startISO,
                                                            endAt: tempEventRange.endISO,
                                                            effortLevel: null,
                                                            sourceVisibility: 'standard'
                                                        };
                                                        setEvents((prev) => [...prev, newEv]);
                                                    }
                                                    setShowQuickCreate(false);
                                                    setTempEventRange(null);
                                                    setQuickTitle('Quick Event');
                                                    setSelectedDateKey(tempEventRange.columnKey);
                                                } catch (createError) {
                                                    setError(createError instanceof Error ? createError.message : 'Failed to create event.');
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                        <button className="ghost" onClick={() => { setShowQuickCreate(false); setTempEventRange(null); setQuickTitle('Quick Event'); }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {tab === 'calendar' && (
                    <>
                        <section className="panel">
                            <h2>Calendar Imports</h2>
                            <p className="muted">Hidden imports block time without exposing event details, which makes the privacy story easy to explain.</p>
                            <div className="actions">
                                <button type="button" onClick={() => connectOauth('google')}>
                                    Connect Google
                                </button>
                                <button type="button" className="ghost" onClick={() => connectOauth('outlook')}>
                                    Connect Outlook
                                </button>
                            </div>

                            <div className="invite-box">
                                <p>Add iCal URL</p>
                                <input
                                    value={icalUrl}
                                    onChange={(input) => setIcalUrl(input.target.value)}
                                    placeholder="https://example.com/calendar.ics"
                                />
                                <label className="switch-row">
                                    <input
                                        type="checkbox"
                                        checked={icalHidden}
                                        onChange={() => setIcalHidden((current) => !current)}
                                    />
                                    Hidden import mode
                                </label>
                                <button type="button" onClick={connectIcal}>
                                    Connect iCal
                                </button>
                            </div>

                            <div className="stack">
                                {calendars.map((calendar) => (
                                    <article key={calendar.id} className="connection-row">
                                        <div>
                                            <strong>{calendar.provider}</strong>
                                            <p>
                                                Mode: {calendar.importMode} | Sync: {calendar.syncStatus}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => syncCalendar(calendar.id)}>
                                            Sync now
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="panel">
                            <h2>Manual Effort Tagging</h2>
                            <p className="muted">Tag classes so suggestions can balance study and recovery time.</p>
                            <div className="stack">
                                {events.map((eventItem) => (
                                    <article key={eventItem.id} className="event-row">
                                        <div>
                                            <strong>{eventItem.title}</strong>
                                            <p>
                                                {formatLocalTime(eventItem.startAt)} - {formatLocalTime(eventItem.endAt)}
                                            </p>
                                        </div>
                                        <select
                                            value={eventItem.effortLevel || 'Low'}
                                            onChange={(input) =>
                                                updateEffort(
                                                    eventItem.id,
                                                    input.target.value as 'Low' | 'Medium' | 'High' | 'Very High'
                                                )
                                            }
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Very High</option>
                                        </select>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {tab === 'groups' && (
                    <>
                        <section className="panel">
                            <h2>Friend Groups</h2>
                            <p className="muted">Invite friends so matching gaps can suggest shared plans.</p>
                            <div className="invite-box">
                                <label>
                                    New group name
                                    <input value={newGroupName} onChange={(input) => setNewGroupName(input.target.value)} />
                                </label>
                                <button type="button" onClick={createGroup}>
                                    Create group
                                </button>
                            </div>
                            <div className="invite-box">
                                <label>
                                    Join with invite code
                                    <input value={joinCode} onChange={(input) => setJoinCode(input.target.value)} />
                                </label>
                                <button type="button" className="ghost" onClick={joinGroup}>
                                    Join group
                                </button>
                            </div>
                        </section>

                        <section className="panel">
                            <h2>Your groups</h2>
                            <ul className="list">
                                {groups.map((group) => (
                                    <li key={group.id}>
                                        <strong>{group.name}</strong> - invite code: {group.inviteCode}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </>
                )}

                {tab === 'settings' && (
                    <>
                        <section className="panel">
                            <h2>Privacy and Consent</h2>
                            <p className="muted">Choose what VibeCalendar can use. You can change this any time.</p>
                            <label className="switch-row">
                                <input
                                    type="checkbox"
                                    checked={consent.locationConsent}
                                    onChange={() =>
                                        setConsent((current) => ({ ...current, locationConsent: !current.locationConsent }))
                                    }
                                />
                                Allow coarse location context
                            </label>
                            <label className="switch-row">
                                <input
                                    type="checkbox"
                                    checked={consent.socialConsent}
                                    onChange={() =>
                                        setConsent((current) => ({ ...current, socialConsent: !current.socialConsent }))
                                    }
                                />
                                Allow friend-group availability suggestions
                            </label>
                            <label className="switch-row">
                                <input
                                    type="checkbox"
                                    checked={consent.calendarWriteConsent}
                                    onChange={() =>
                                        setConsent((current) => ({ ...current, calendarWriteConsent: !current.calendarWriteConsent }))
                                    }
                                />
                                Allow write-back when adding suggestions
                            </label>
                            <button type="button" onClick={updateConsentValues}>
                                Save consent
                            </button>
                        </section>

                        <section className="panel">
                            <h2>Trust Notes</h2>
                            <ul className="list">
                                <li>Hidden imports store only busy blocks and never show private event details.</li>
                                <li>Location defaults to optional, coarse context.</li>
                                <li>Suggestions are assistive. You remain in full control of every action.</li>
                            </ul>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
