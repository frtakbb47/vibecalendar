-- Idempotent sample/demo data for local development
-- Uses INSERT OR IGNORE so it's safe to run multiple times


-- Users
INSERT OR IGNORE INTO users (id, name, email, password_hash, timezone, created_at, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', 'Alice Johnson', 'alice@student.edu', '$2a$10$FcL6rni5L/NNfpt./QGJK.aTkjg7d7RTGL.f4yx2aFAGP2kgT95sq', 'America/New_York', datetime('now'), datetime('now')),
('22222222-2222-2222-2222-222222222222', 'Bob Chen', 'bob@student.edu', '$2a$10$McTuxvxQWlVbhAZJLMHlvuMwECTIh75o69VW2Ra8YRf1FVS348Nji', 'America/Los_Angeles', datetime('now'), datetime('now')),
('33333333-3333-3333-3333-333333333333', 'Carla Martinez', 'carla@student.edu', '$2a$10$KLm9S2eDefgBkkiqtacH5OIRtIicSX3Kwqe5ScyJg1EOMYjuz9fY2', 'America/Chicago', datetime('now'), datetime('now')),
('44444444-4444-4444-4444-444444444444', 'Danielle Ortiz', 'danielle@student.edu', '$2a$10$nEXG2cldvbuTIocCzA4or.alY1dSHHRNXcgpOm8HChSY8E6lRW15G', 'Europe/London', datetime('now'), datetime('now')),
('55555555-5555-5555-5555-555555555555', 'Eric Green', 'eric@student.edu', '$2a$10$HJP0L4BjFE71/7I2NvgIKOyln7jrasWfYs8KPqFtgjRF3Cm5SCA3O', 'America/New_York', datetime('now'), datetime('now')),
('66666666-6666-6666-6666-666666666666', 'Fiona Li', 'fiona@student.edu', '$2a$10$OHHZAZWdXNyHh3T3fJ6Bt.iiG8WH9R7VAAxl9GDfP.vcu67ZiaPd6', 'Asia/Hong_Kong', datetime('now'), datetime('now')),
('77777777-7777-7777-7777-777777777777', 'Grace Park', 'grace@student.edu', '$2a$10$egqSv1HJ9DnF3UXm9cOLJu5jT7HhjGmGpb2GyWLCf5sn1EzJKNnIK', 'America/New_York', datetime('now'), datetime('now'));

-- Privacy consents
INSERT OR IGNORE INTO privacy_consents (user_id, location_consent, social_consent, calendar_write_consent, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', 1, 1, 0, datetime('now')),
('22222222-2222-2222-2222-222222222222', 0, 1, 0, datetime('now')),
('33333333-3333-3333-3333-333333333333', 1, 0, 1, datetime('now')),
('44444444-4444-4444-4444-444444444444', 0, 1, 0, datetime('now')),
('55555555-5555-5555-5555-555555555555', 1, 1, 1, datetime('now')),
('66666666-6666-6666-6666-666666666666', 1, 1, 0, datetime('now')),
('77777777-7777-7777-7777-777777777777', 0, 0, 0, datetime('now'));

-- Connected calendars
INSERT OR IGNORE INTO connected_calendars (id, user_id, provider, provider_calendar_id, import_mode, status, created_at, updated_at)
VALUES
('c1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','google','alice.primary@gmail.com','standard','connected',datetime('now'),datetime('now')),
('c2222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222','ical','https://example.com/bob-campus.ics','hidden','connected',datetime('now'),datetime('now')),
('c3333333-3333-3333-3333-333333333333','33333333-3333-3333-3333-333333333333','outlook','carla@school.edu','standard','connected',datetime('now'),datetime('now')),
('c3333333-3333-3333-3333-333333333334','33333333-3333-3333-3333-333333333333','ical','https://feeds.example.com/carla-external.ics','standard','connected',datetime('now'),datetime('now')),
('c5555555-5555-5555-5555-555555555555','55555555-5555-5555-5555-555555555555','google','eric.personal@gmail.com','standard','connected',datetime('now'),datetime('now')),
('c6666666-6666-6666-6666-666666666666','66666666-6666-6666-6666-666666666666','ical','https://calendar.example.com/fiona.ics','standard','connected',datetime('now'),datetime('now'));

-- Events (some hidden / busy-only to exercise privacy paths)
INSERT OR IGNORE INTO events (id, user_id, connected_calendar_id, title, description, location_text, start_at, end_at, source_visibility, is_busy_block_only, effort_level, created_by, created_at, updated_at)
VALUES
('e1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','c1111111-1111-1111-1111-111111111111','Calculus Lecture',NULL,NULL,'2026-04-28T09:00:00Z','2026-04-28T10:15:00Z','standard',0,'High','external',datetime('now'),datetime('now')),
('e1111111-1111-1111-1111-111111111112','11111111-1111-1111-1111-111111111111','c1111111-1111-1111-1111-111111111111','Study: Linear Algebra',NULL,NULL,'2026-04-28T11:00:00Z','2026-04-28T12:00:00Z','standard',0,'Medium','external',datetime('now'),datetime('now')),
('e1111111-1111-1111-1111-111111111113','11111111-1111-1111-1111-111111111111','c1111111-1111-1111-1111-111111111111','Lunch with Sam',NULL,NULL,'2026-04-28T12:30:00Z','2026-04-28T13:15:00Z','standard',0,'Low','external',datetime('now'),datetime('now')),
('e1111111-1111-1111-1111-111111111114','11111111-1111-1111-1111-111111111111','c1111111-1111-1111-1111-111111111111',NULL,NULL,NULL,'2026-04-28T14:00:00Z','2026-04-28T15:00:00Z','hidden',1,NULL,'external',datetime('now'),datetime('now')),

('e2222222-2222-2222-2222-222222222221','22222222-2222-2222-2222-222222222222','c2222222-2222-2222-2222-222222222222',NULL,NULL,NULL,'2026-04-28T08:00:00Z','2026-04-28T09:30:00Z','hidden',1,NULL,'external',datetime('now'),datetime('now')),
('e2222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222','c2222222-2222-2222-2222-222222222222',NULL,NULL,NULL,'2026-04-28T10:00:00Z','2026-04-28T10:15:00Z','hidden',1,NULL,'external',datetime('now'),datetime('now')),

('e3333333-3333-3333-3333-333333333331','33333333-3333-3333-3333-333333333333','c3333333-3333-3333-3333-333333333333','Research Meeting',NULL,NULL,'2026-04-28T13:00:00Z','2026-04-28T14:30:00Z','standard',0,'High','external',datetime('now'),datetime('now')),
('e3333333-3333-3333-3333-333333333332','33333333-3333-3333-3333-333333333333','c3333333-3333-3333-3333-333333333334','Overnight Hackathon',NULL,NULL,'2026-04-28T23:30:00Z','2026-04-29T06:00:00Z','standard',0,'High','external',datetime('now'),datetime('now')),

('e4444444-4444-4444-4444-444444444441','44444444-4444-4444-4444-444444444444',NULL,'Part-time Job (Evening)',NULL,NULL,'2026-04-28T17:00:00Z','2026-04-28T21:00:00Z','standard',0,'Medium','external',datetime('now'),datetime('now')),

('e5555555-5555-5555-5555-555555555551','55555555-5555-5555-5555-555555555555','c5555555-5555-5555-5555-555555555555','Morning Run',NULL,NULL,'2026-04-28T05:30:00Z','2026-04-28T06:15:00Z','standard',0,'Low','external',datetime('now'),datetime('now')),
('e5555555-5555-5555-5555-555555555552','55555555-5555-5555-5555-555555555555','c5555555-5555-5555-5555-555555555555','Midterm Exam',NULL,NULL,'2026-04-28T14:00:00Z','2026-04-28T16:00:00Z','standard',0,'High','external',datetime('now'),datetime('now')),

('e6666666-6666-6666-6666-666666666661','66666666-6666-6666-6666-666666666666','c6666666-6666-6666-6666-666666666666','Thesis Work',NULL,NULL,'2026-04-28T09:00:00Z','2026-04-28T12:00:00Z','standard',0,'High','external',datetime('now'),datetime('now')),
('e6666666-6666-6666-6666-666666666662','66666666-6666-6666-6666-666666666666','c6666666-6666-6666-6666-666666666666','Coffee Break',NULL,NULL,'2026-04-28T12:15:00Z','2026-04-28T12:45:00Z','standard',0,'Low','external',datetime('now'),datetime('now')),

('e7777777-7777-7777-7777-777777777771','77777777-7777-7777-7777-777777777777',NULL,'Free Day',NULL,NULL,'2026-04-28T00:00:00Z','2026-04-28T23:59:00Z','standard',0,'Low','external',datetime('now'),datetime('now'));
