# RTO (Return to Office) Planner - Project Plan

## Project Overview

A web-based tool to help Microsoft employees plan their return-to-office schedule while ensuring compliance with organizational requirements. The tool visualizes the entire year's calendar, allows users to mark office attendance days, and validates compliance against the 12-week sliding window rule.

---

## Business Rules

### The 12-Week Sliding Window Rule

1. For each sliding window of **12 consecutive weeks**:
   - Take the **best 8 weeks** out of those 12 weeks (by office attendance)
   - Calculate the **average daily attendance** across those 8 weeks
   - This average represents the "12-week result"

2. **Rounding Rule**: 
   - Round up to next whole number if decimal ≥ 0.5
   - Round down if decimal < 0.5
   - Examples: 3.4 → 3, 3.5 → 4, 2.9 → 3, 2.4 → 2

3. **Compliance**: Each 12-week result throughout the year must be ≥ org's required days

### Week Definition
- Week = Monday through Friday (5 possible workdays)
- Attendance = number of days (0-5) employee comes into office that week
- Weekends (Saturday/Sunday) are excluded from all calculations

---

## Features

### Phase 1: Core Features (MVP)

#### 1. Initial Setup Questions
- [ ] Day selection: Which days of the week (Mon-Fri) does the user typically come into office?
- [ ] Org requirement: How many days per week does the org require?

#### 2. Calendar View
- [ ] Display 12 monthly calendars for the current year (2026)
- [ ] Scrollable single-page layout
- [ ] Show Saturday/Sunday as disabled (greyed out, non-interactive)
- [ ] Weekdays are clickable/selectable
- [ ] Default selection based on initial day-of-week answer

#### 3. Selection Interaction
- [ ] Click to toggle day selection (selected = going to office)
- [ ] Visual distinction between selected/unselected days
- [ ] Changes are pending until confirmed
- [ ] Confirm button: Apply changes and run compliance check
- [ ] Cancel button: Revert to previous confirmed state

#### 4. Compliance Display
- [ ] Show initial setup answers in sidebar
- [ ] Display org requirement prominently
- [ ] Show compliance status after each confirmation
- [ ] List all non-compliant 12-week windows with details, the details show the result before rounding up.

### Phase 2: Future Enhancements (Out of Scope for MVP)
- [ ] Company holidays input (auto-unselect those dates)
- [ ] Local storage persistence
- [ ] Different day types (vacation, work trip, WFH)
- [ ] Export/share schedule
- [ ] Multiple year support

---

## Technical Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Components**: Web Components (Custom Elements) for reusable UI
- **Styling**: CSS3 with CSS Custom Properties for theming
- **Build**: No build step required (native ES modules)
- **Storage**: Session-based with abstraction layer for future local storage

### File Structure

```
rto-plan/
├── index.html                  # Main entry point
├── css/
│   ├── main.css               # Global styles, variables, layout
│   ├── calendar.css           # Calendar-specific styles
│   └── components.css         # Web component styles
├── js/
│   ├── app.js                 # Main application entry, orchestration
│   ├── state/
│   │   └── store.js           # State management & storage abstraction
│   ├── utils/
│   │   ├── date-utils.js      # Date manipulation helpers
│   │   └── compliance.js      # 12-week window calculation algorithm
│   └── components/
│       ├── setup-form.js      # Initial questions component
│       ├── calendar-view.js   # Main calendar container
│       ├── month-calendar.js  # Individual month component
│       ├── day-cell.js        # Individual day component
│       ├── sidebar.js         # Settings & compliance display
│       └── action-bar.js      # Confirm/Cancel buttons
├── PROJECT_PLAN.md            # This file
└── README.md                  # Setup and usage instructions
```

---

## Data Models

### Application State

```javascript
{
  // User's typical office days (0 = Monday, 4 = Friday)
  defaultOfficeDays: [1, 2, 3],  // e.g., Tue, Wed, Thu
  
  // Org requirement (days per week)
  requiredDays: 3,
  
  // Year being planned
  year: 2026,
  
  // Confirmed office attendance dates (Set of ISO date strings)
  confirmedDates: Set<string>,  // e.g., {"2026-01-06", "2026-01-07", ...}
  
  // Pending changes (before confirm/cancel)
  pendingDates: Set<string>,
  
  // Has pending changes flag
  hasPendingChanges: boolean,
  
  // Compliance results (recalculated on confirm)
  complianceResults: {
    isCompliant: boolean,
    windows: [
      {
        startDate: "2026-01-06",
        endDate: "2026-03-29",
        weekNumber: 1,           // Which sliding window (1-based)
        best8WeeksAverage: 2.875,
        roundedResult: 3,
        isCompliant: true
      },
      // ... more windows
    ],
    nonCompliantWindows: [...]   // Filtered list of failing windows
  }
}
```

### Storage Abstraction Interface

```javascript
// Storage interface (allows swapping session → local storage later)
const StorageAdapter = {
  save(key, data) { },
  load(key) { },
  clear(key) { }
}
```

---

## Algorithm Details

### Compliance Calculation

```
FUNCTION calculateCompliance(year, confirmedDates, requiredDays):
    
    1. Build weekly attendance map:
       - For each week in the year (Mon-Fri):
         - Count how many days in that week are in confirmedDates
         - Store as weeklyAttendance[weekNumber] = count (0-5)
    
    2. Calculate all 12-week sliding windows:
       - totalWeeks = number of weeks in year (52 or 53)
       - For windowStart = 1 to (totalWeeks - 11):
         
         a. Get attendance for weeks windowStart to windowStart+11
         
         b. Sort these 12 weeks by attendance (descending)
         
         c. Take top 8 weeks
         
         d. Calculate average: sum(top8) / 8
         
         e. Apply rounding rule:
            - If (average - floor(average)) >= 0.5: round UP
            - Else: round DOWN
         
         f. Check compliance: roundedResult >= requiredDays
         
         g. Store window result
    
    3. Return:
       - Overall compliance (all windows pass)
       - List of all windows with details
       - Filtered list of non-compliant windows
```

### Week Number Calculation

```
FUNCTION getWeekNumber(date):
    - Use ISO week numbering (week starts Monday)
    - Week 1 is the week of 1/26/2026.
    - Handle edge cases for dates in week 52/53 of previous year
```

### Default Date Population

```
FUNCTION populateDefaultDates(year, defaultOfficeDays):
    - For each date in year:
      - If date.dayOfWeek is in defaultOfficeDays:
        - Add date to confirmedDates
    - Exclude weekends automatically
```

---

## UI Components Specification

### 1. SetupForm (`<setup-form>`)

**Purpose**: Collect initial user preferences

**UI Elements**:
- Checkbox group for days of week (Mon-Fri)
- Number input or dropdown for required days (1-5)
- "Continue" button

**Events Emitted**:
- `setup-complete`: { defaultOfficeDays: number[], requiredDays: number }

---

### 2. CalendarView (`<calendar-view>`)

**Purpose**: Container for all 12 month calendars

**UI Elements**:
- Scrollable container
- 12 `<month-calendar>` components
- Optional: Quick navigation to specific month

**Props**:
- `year`: number
- `selected-dates`: Set<string>
- `pending-dates`: Set<string>

---

### 3. MonthCalendar (`<month-calendar>`)

**Purpose**: Display single month grid

**UI Elements**:
- Month/Year header
- Day-of-week headers (Mon-Sun)
- Grid of `<day-cell>` components
- Weekend days visually disabled

**Props**:
- `year`: number
- `month`: number (0-11)
- `selected-dates`: Set<string>
- `pending-dates`: Set<string>

---

### 4. DayCell (`<day-cell>`)

**Purpose**: Individual day with selection state

**UI Elements**:
- Day number
- Visual states: selected, unselected, pending-add, pending-remove, disabled (weekend)

**Props**:
- `date`: string (ISO format)
- `selected`: boolean
- `pending`: boolean
- `disabled`: boolean

**Events Emitted**:
- `day-toggle`: { date: string }

---

### 5. Sidebar (`<sidebar-panel>`)

**Purpose**: Display settings and compliance results

**UI Elements**:
- Current settings display (default days, required days)
- "Edit Settings" button (optional, for Phase 2)
- Compliance status indicator (✓ Compliant / ✗ Non-Compliant)
- List of non-compliant windows with details:
  - Window date range
  - Calculated average
  - Rounded result vs requirement

---

### 6. ActionBar (`<action-bar>`)

**Purpose**: Confirm or cancel pending changes

**UI Elements**:
- Confirm button (disabled when no pending changes)
- Cancel button (disabled when no pending changes)
- Optional: Count of pending changes

**Events Emitted**:
- `confirm-changes`
- `cancel-changes`

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RTO Planner - 2026                                                     │
├─────────────────────────────────────────────────────────────┬───────────┤
│                                                             │  SIDEBAR  │
│  ┌─────────────────────┐  ┌─────────────────────┐          │           │
│  │     January 2026    │  │    February 2026    │          │  Default  │
│  │ Mo Tu We Th Fr Sa Su│  │ Mo Tu We Th Fr Sa Su│          │  Days:    │
│  │        1  2  3  4   │  │                    1│          │  Tue,Wed, │
│  │  5  6  7  8  9 10 11│  │  2  3  4  5  6  7  8│          │  Thu      │
│  │ 12 13 14 15 16 17 18│  │  9 10 11 12 13 14 15│          │           │
│  │ 19 20 21 22 23 24 25│  │ 16 17 18 19 20 21 22│          │  Required │
│  │ 26 27 28 29 30 31   │  │ 23 24 25 26 27 28   │          │  Days: 3  │
│  └─────────────────────┘  └─────────────────────┘          │           │
│                                                             │───────────│
│  ┌─────────────────────┐  ┌─────────────────────┐          │ COMPLIANCE│
│  │      March 2026     │  │      April 2026     │          │           │
│  │ Mo Tu We Th Fr Sa Su│  │ Mo Tu We Th Fr Sa Su│          │ ✓ All     │
│  │                    1│  │        1  2  3  4  5│          │ windows   │
│  │  2  3  4  5  6  7  8│  │  6  7  8  9 10 11 12│          │ compliant │
│  │  ...                │  │  ...                │          │           │
│  └─────────────────────┘  └─────────────────────┘          │ OR        │
│                                                             │           │
│  ... (8 more months, scrollable) ...                       │ ✗ 2 win-  │
│                                                             │ dows non- │
│                                                             │ compliant │
│                                                             │           │
│                                                             │ • Week 5- │
│                                                             │   16: 2.8 │
│                                                             │   → 3 < 4 │
├─────────────────────────────────────────────────────────────┴───────────┤
│  [ Confirm Changes ]  [ Cancel ]                    3 days modified     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Calendar Day Legend

```
┌────┐ Selected (going to office) - filled/highlighted
│ 15 │
└────┘

┌────┐ Unselected (not going) - outline only
│ 15 │
└────┘

┌────┐ Pending Add - dotted border + fill
│ 15 │
└────┘

┌────┐ Pending Remove - strikethrough or different indicator
│ 15 │
└────┘

┌────┐ Disabled (weekend) - greyed out, no interaction
│ 15 │
└────┘
```

---

## Implementation Milestones

### Milestone 1: Project Setup & Core Utilities (Day 1)
- [ ] Create project structure and files
- [ ] Implement date utilities (week numbers, date ranges, etc.)
- [ ] Implement storage abstraction layer
- [ ] Create basic HTML structure and CSS variables

### Milestone 2: State Management (Day 1-2)
- [ ] Implement central state store
- [ ] Add state change subscriptions
- [ ] Implement pending vs confirmed state logic

### Milestone 3: Setup Flow (Day 2)
- [ ] Build `<setup-form>` component
- [ ] Handle form submission
- [ ] Populate default dates based on user selection

### Milestone 4: Calendar Components (Day 2-3)
- [ ] Build `<day-cell>` component with all states
- [ ] Build `<month-calendar>` component
- [ ] Build `<calendar-view>` container
- [ ] Implement click-to-toggle interaction

### Milestone 5: Action Bar & Pending Changes (Day 3)
- [ ] Build `<action-bar>` component
- [ ] Implement confirm logic (apply pending → confirmed)
- [ ] Implement cancel logic (discard pending)

### Milestone 6: Compliance Algorithm (Day 3-4)
- [ ] Implement weekly attendance calculation
- [ ] Implement sliding window logic
- [ ] Implement best-8-of-12 selection
- [ ] Implement rounding rules
- [ ] Unit test the algorithm with known scenarios

### Milestone 7: Sidebar & Results Display (Day 4)
- [ ] Build `<sidebar-panel>` component
- [ ] Display user settings
- [ ] Display compliance results
- [ ] Show non-compliant window details

### Milestone 8: Polish & Testing (Day 5)
- [ ] End-to-end testing
- [ ] Edge case handling (year boundaries, etc.)
- [ ] Visual polish and responsive design
- [ ] Write README with usage instructions

---

## Test Scenarios

### Algorithm Tests

1. **All default days selected**: Should be compliant if default matches requirement
2. **Remove 1 day from many weeks**: Verify recalculation
3. **Heavy vacation period**: 4 weeks with 0 days - test best 8 of 12 logic
4. **Edge window**: First and last 12-week windows of the year
5. **Rounding boundary**: Create scenarios with 3.4 vs 3.5 averages

### UI Tests

1. **Initial load**: Default days are pre-selected
2. **Toggle day**: Visual feedback before confirm
3. **Confirm**: Changes persist, compliance recalculates
4. **Cancel**: Changes revert
5. **Weekend clicks**: No response/no state change

---

## Open Questions / Future Considerations

1. **Year Boundary**: How to handle if someone wants to plan across year boundary?
2. **Partial Year**: What if starting mid-year (e.g., new hire)?
3. **Holidays API**: Potential integration with Microsoft holiday calendar
4. **Team View**: Could managers see aggregate compliance for their team?

---

## Appendix: Example Calculation

**Scenario**: 
- Required days: 3
- 12-week window from Week 1-12
- Weekly attendance: [3, 3, 3, 0, 0, 3, 3, 3, 2, 3, 3, 3]

**Calculation**:
1. Sort descending: [3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0]
2. Take best 8: [3, 3, 3, 3, 3, 3, 3, 3]
3. Average: 24 / 8 = 3.0
4. Rounded: 3
5. Compliance: 3 ≥ 3 ✓ **COMPLIANT**

**Scenario 2** (Non-compliant):
- Weekly attendance: [2, 2, 3, 0, 0, 2, 3, 2, 2, 2, 2, 2]

**Calculation**:
1. Sort descending: [3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0]
2. Take best 8: [3, 3, 2, 2, 2, 2, 2, 2]
3. Average: 18 / 8 = 2.25
4. Rounded: 2 (since 0.25 < 0.5)
5. Compliance: 2 ≥ 3 ✗ **NON-COMPLIANT**
