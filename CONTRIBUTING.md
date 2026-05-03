# Contributing to VibeCalendar

Thank you for your interest in contributing to VibeCalendar! This guide helps you get started.

## Code of Conduct

Be respectful, inclusive, and professional. We're building a tool for students' wellbeing.

## Ways to Contribute

- **Bug Reports**: Found a bug? [Open an issue](https://github.com/frtakbb47/vibecalendar/issues)
- **Feature Requests**: Have an idea? [Discuss it in issues](https://github.com/frtakbb47/vibecalendar/issues)
- **Documentation**: Improve README, API docs, or code comments
- **Code**: Fix bugs, implement features, refactor for clarity
- **Testing**: Write tests, manual test workflows
- **Design**: UI/UX suggestions, accessibility improvements

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Follow [SETUP.md](SETUP.md) to set up your development environment
4. Create a feature branch: `git checkout -b feature/my-feature`
5. Make your changes
6. Run `npm run build` to verify TypeScript and bundling
7. Commit with clear messages: `git commit -m "feat: add my feature"`
8. Push to your fork: `git push origin feature/my-feature`
9. Open a Pull Request with a description of your changes

## Development Workflow

### Install Dependencies
```bash
npm install
```

### Start Dev Servers
```bash
npm run dev:full
```

Frontend: http://localhost:5173
API: http://localhost:8787

### Build & Check
```bash
npm run build
```

### Run Linting (if added)
Currently no linter configured. Consider adding ESLint + Prettier.

### Database Reset
```bash
rm server/vibecalendar.db
npm run db:migrate
npm run seed:sample
```

## Code Style & Standards

### TypeScript
- Strict mode enabled in `tsconfig.json`
- Type all function parameters and returns
- Use interfaces for object shapes
- Avoid `any` type; use generics or unions instead

Example:
```typescript
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}
```

### JavaScript (Backend)
- Use ES6+ (const/let, arrow functions, template strings)
- Validate input with zod schemas
- Handle errors explicitly (try/catch or .catch)
- Use async/await (not callback hell)

Example:
```javascript
app.post('/api/example', requireAuth, async (request, response) => {
  try {
    const schema = z.object({ name: z.string().min(1) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Invalid' });
      return;
    }
    // ...
    response.json({ ok: true });
  } catch (err) {
    response.status(500).json({ error: 'Server error' });
  }
});
```

### CSS
- Use custom properties (CSS variables) for colors
- Prefer Flexbox/Grid for layout
- Mobile-first responsive design
- Class names: kebab-case (`.modal-overlay`, `.timeline-event`)

Example:
```css
.component {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--card);
  color: var(--text);
}
```

### Comments
- Comment the "why", not the "what"
- Document complex algorithms (e.g., event stacking)
- Add TODOs for future work: `// TODO: add rate limiting`

## Branch Naming

- Feature: `feature/user-authentication`, `feature/calendar-sync`
- Bug fix: `bugfix/typo-in-modal`, `bugfix/timezone-calculation`
- Refactor: `refactor/suggest-engine`, `refactor/css-variables`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add drag-to-create for quick events
fix: correct timezone offset calculation
docs: update API reference
refactor: simplify suggestion engine
test: add tests for event overlap
```

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring (no functionality change)
- `test`: Add/update tests
- `chore`: Dependency updates, build config, etc.

## Pull Request Process

1. **Title**: Follow commit message format (e.g., "feat: add dark mode")
2. **Description**: Explain what changed and why
3. **Link issues**: "Closes #123" or "Fixes #456"
4. **Testing**: Describe how you tested the changes
5. **Screenshots/Video**: Include if UI changes

Example PR description:
```markdown
## Description
Adds drag-to-create for quick events on Week view timeline.

## Changes
- Added `handleColumnPointerDown` handler
- Implemented pixel-to-time conversion with 5-min snapping
- Added quick-create modal with title input
- Persists to backend via POST /api/events

## Testing
- Manual: Drag on timeline from 14:00 to 14:30, modal appears, event created
- Verified: Events persist after page reload
- Tested edge cases: multi-day events, midnight, events < 5 min

## Related
Closes #45
```

## Testing Expectations

### Frontend
- Manually test all tabs: Today, Planner (month/week), Calendar, Groups, Settings
- Test with demo accounts (different event patterns)
- Test responsive layout (desktop, tablet, mobile)
- Test error scenarios (network failure, invalid input)

### Backend
- Manual API testing (Postman, curl, fetch)
- Verify database state after operations
- Test auth (token validation, expiry)
- Test edge cases (empty calendar, timezone handling, overlaps)

### Demo Flow
- Run `npm run present` and test the guided presentation
- Verify all demo accounts have correct seeded data
- Check friend groups are joinable

## File Organization

### Adding a New Feature

Backend:
```
server/
  ├─ index.js (add route handler)
  ├─ services/ (add business logic if complex)
  └─ migrations/ (add DB schema if needed)
```

Frontend:
```
src/
  ├─ App.tsx (add state, UI, API calls)
  ├─ api.ts (add API function if new endpoint)
  └─ App.css (add styles)
```

### Adding a Migration

1. Create `server/migrations/NNN_description.sql`
2. Number sequentially (e.g., `003_add_user_preferences.sql`)
3. Use `CREATE TABLE IF NOT EXISTS` for idempotency
4. Run `npm run db:migrate`

## Documentation

- Keep README.md up to date with setup steps
- Update ARCHITECTURE.md if you change system design
- Update API.md if you add/change endpoints
- Add inline comments for complex logic
- Document breaking changes in a CHANGELOG (if added)

## Reporting Bugs

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, browser, Node version)
- Logs/screenshots if applicable

Example:
```markdown
## Description
Week view timeline shows negative height for events < 1 minute

## Steps to Reproduce
1. Create event from 14:00 to 14:02 on Week view
2. Observe timeline

## Expected
Event block visible with minimum height (16px)

## Actual
Event not displayed or shows red error

## Environment
- Node 18.16.0
- Chrome 125
- macOS 14.4
```

## Performance & Accessibility

- **Performance**: Keep bundle size small; use React.useMemo for expensive computations
- **Accessibility**:
  - Add `alt` text to images
  - Use semantic HTML (button, nav, main, section)
  - Ensure color contrast ≥ 4.5:1
  - Test keyboard navigation

## Questions?

- Open an issue for questions or discussion
- Comment on PRs with clarifications
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Read [API.md](API.md) for endpoint details

## License

By contributing, you agree your code is under the same license as the project (MIT, if applicable).

---

Thank you for contributing to VibeCalendar! 🌱
