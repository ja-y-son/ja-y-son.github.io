# RTO Planner

A web-based tool to help plan your return-to-office schedule while ensuring compliance with organizational requirements.

## Quick Start

1. Open `index.html` in a modern web browser
2. Select your typical office days (Monday-Friday)
3. Enter your org's required days per week
4. Click "Start Planning"
5. Use the calendar to adjust your schedule
6. Click "Confirm Changes" to validate compliance

## Features

- **12-Month Calendar View**: See your entire year at a glance
- **Click-to-Toggle**: Easily mark days as office or remote
- **Pending Changes**: Preview changes before confirming
- **Compliance Checking**: Real-time validation against the 12-week sliding window rule
- **Non-Compliant Window Details**: See exactly which periods need adjustment

## The 12-Week Sliding Window Rule

Microsoft's RTO policy uses a rolling 12-week window to calculate compliance:

1. For each 12-week period, the **best 8 weeks** are selected
2. The average daily attendance across those 8 weeks is calculated
3. The average is rounded (≥0.5 rounds up, <0.5 rounds down)
4. This rounded value must meet or exceed your org's requirement

## Technology

- Vanilla JavaScript (ES6+)
- Web Components for reusable UI
- No build step required
- No server required - works by opening index.html directly
- Session storage for state persistence

## Browser Support

Works in all modern browsers that support:
- Custom Elements (Web Components)
- CSS Custom Properties

## Project Structure

```
rto-plan/
├── index.html          # Main entry point
├── package.json        # Build scripts
├── css/
│   ├── main.css        # Global styles
│   ├── calendar.css    # Calendar styles
│   └── components.css  # Component styles
├── js/
│   ├── app.js          # Application entry
│   ├── app.bundle.js   # Built output (generated)
│   ├── state/
│   │   └── store.js    # State management
│   ├── utils/
│   │   ├── date-utils.js    # Date helpers
│   │   └── compliance.js    # Compliance algorithm
│   └── components/
│       ├── setup-form.js    # Initial setup
│       ├── calendar-view.js # Calendar container
│       ├── month-calendar.js # Month grid
│       ├── day-cell.js      # Day component
│       ├── sidebar.js       # Settings & results
│       └── action-bar.js    # Confirm/Cancel
├── PROJECT_PLAN.md     # Detailed project plan
└── README.md           # This file
```

## Development

### First-time setup
```bash
npm install
```

### Build for deployment
```bash
npm run build
```

### Watch mode (auto-rebuild on changes)
```bash
npm run watch
```

Then just open `index.html` in your browser - no server required!

### Optional: Local server with auto-reload

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

## Future Enhancements

- Company holidays input
- Local storage persistence
- Export/share schedule
- Multiple day types (vacation, work trip, WFH)
- Multi-year planning
