# Copilot Instructions — RTO Planner

## Build & Run

```bash
npm install          # first-time setup
npm run build        # bundle with esbuild → js/app.bundle.js
npm run watch        # auto-rebuild on changes
```

No dev server required — open `index.html` directly in a browser (works with `file://`). The app loads `js/app.bundle.js` (IIFE bundle), not ES modules directly.

There are no tests or linters configured.

## Architecture

**Vanilla JS + Web Components** — no framework. All UI is built with Custom Elements (`HTMLElement` subclasses) registered via `customElements.define()`.

### Entry flow

1. `index.html` loads `js/app.bundle.js` (built from `js/app.js`)
2. `app.js` creates `RTOPlannerApp` which orchestrates two phases:
   - **Setup phase**: `<setup-form>` collects default office days and org requirement
   - **Planning phase**: calendar view + sidebar + action bar for schedule editing

### State management

`js/state/store.js` — singleton `Store` class with pub/sub pattern:
- `store.getState()` / `store.setState(updates)` — returns copies of arrays to prevent mutation
- `store.subscribe(callback)` — notified on every state change
- Persists to `sessionStorage` via swappable storage adapters (`SessionStorageAdapter`, `LocalStorageAdapter`, `MemoryStorageAdapter`)
- Only a subset of state is persisted (setup info + confirmed dates); compliance results are recalculated on load

### Key data representations

- **Dates**: ISO strings (`"2026-03-15"`) stored as `string[]` arrays (not `Set` or `Date` objects)
- **Weekdays**: 0 = Monday, 4 = Friday (differs from JS `Date.getDay()` where 0 = Sunday). Use `jsDateDayToWeekday()` / `weekdayToJsDateDay()` to convert.
- **Display range**: Rolling 12-month window (3 months back + 9 forward from today), computed via `getDisplayRange()`. Replaces the old fixed single-year model.
- **`populatedMonths`**: Tracks which months have been auto-populated with default office days (prevents re-populating months the user has already edited). Stored as `"YYYY-MM"` strings.
- **Pending vs confirmed**: `pendingDates` tracks uncommitted edits; `confirmedDates` is the last-confirmed state. Users click "Confirm" to apply or "Cancel" to revert.

## Core Business Logic

The compliance algorithm (`js/utils/compliance.js`) implements a **12-week sliding window** rule:
1. For each window of 12 consecutive weeks, take the **best 8 weeks** by attendance
2. Average those 8 weeks, then round (≥0.5 up, <0.5 down) via `policyRound()`
3. Result must meet the org's required days/week

The algorithm works across year boundaries using `getWeeksInRange()`. Policy enforcement starts from `POLICY_START_DATE` (`2026-01-26`), defined in `js/utils/date-utils.js`. Company holidays are hardcoded in `COMPANY_HOLIDAYS` (2026 and 2027) in the same file.

## Component Conventions

- Components use **light DOM** (no Shadow DOM) — styles come from global CSS files in `css/`
- Components communicate via **custom DOM events** dispatched on `document` (e.g., `setup-complete`, `day-toggle`, `confirm-changes`, `reset-requested`)
- Components subscribe to the store directly for state updates
- Templates are defined as `document.createElement('template')` literals inside each component file
