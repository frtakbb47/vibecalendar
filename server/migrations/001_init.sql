CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  default_location_label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS privacy_consents (
  user_id TEXT PRIMARY KEY,
  location_consent INTEGER NOT NULL DEFAULT 0,
  social_consent INTEGER NOT NULL DEFAULT 1,
  calendar_write_consent INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connected_calendars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_calendar_id TEXT,
  access_scope TEXT NOT NULL DEFAULT 'read',
  import_mode TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'connected',
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  sync_status TEXT NOT NULL DEFAULT 'idle',
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  connected_calendar_id TEXT,
  title TEXT,
  description TEXT,
  location_text TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  source_visibility TEXT NOT NULL DEFAULT 'standard',
  is_busy_block_only INTEGER NOT NULL DEFAULT 0,
  effort_level TEXT,
  created_by TEXT NOT NULL DEFAULT 'external',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connected_calendar_id) REFERENCES connected_calendars(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale_text TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  priority_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  context_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  acted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  suggestion_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  action_taken TEXT NOT NULL DEFAULT 'none',
  sent_at TEXT NOT NULL,
  opened_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS friend_groups (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  sharing_mode TEXT NOT NULL DEFAULT 'availability_only',
  consent_given_at TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES friend_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
