(() => {
  // js/state/store.js
  var SessionStorageAdapter = {
    save(key, data) {
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error("SessionStorage save error:", e);
        return false;
      }
    },
    load(key) {
      try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.error("SessionStorage load error:", e);
        return null;
      }
    },
    clear(key) {
      try {
        if (key) {
          sessionStorage.removeItem(key);
        } else {
          sessionStorage.clear();
        }
        return true;
      } catch (e) {
        console.error("SessionStorage clear error:", e);
        return false;
      }
    }
  };
  var STORAGE_KEY = "rto-planner-state";
  var storageAdapter = SessionStorageAdapter;
  var initialState = {
    // Setup phase completed
    setupComplete: false,
    // User's typical office days (0 = Monday, 4 = Friday)
    defaultOfficeDays: [],
    // Org requirement (days per week)
    requiredDays: 3,
    // Year being planned
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    // Confirmed office attendance dates (array of ISO date strings)
    confirmedDates: [],
    // Pending changes (array of ISO date strings)
    pendingDates: [],
    // Compliance results
    complianceResults: null
  };
  var Store = class {
    constructor() {
      this._state = { ...initialState };
      this._subscribers = /* @__PURE__ */ new Set();
      this._loadFromStorage();
    }
    /**
     * Get current state (returns a copy)
     */
    getState() {
      return {
        ...this._state,
        confirmedDates: [...this._state.confirmedDates],
        pendingDates: [...this._state.pendingDates],
        defaultOfficeDays: [...this._state.defaultOfficeDays]
      };
    }
    /**
     * Get a specific value from state
     */
    get(key) {
      const value = this._state[key];
      if (Array.isArray(value)) {
        return [...value];
      }
      if (value && typeof value === "object") {
        return { ...value };
      }
      return value;
    }
    /**
     * Update state
     * @param {Partial<typeof initialState>} updates 
     */
    setState(updates) {
      const prevState = this._state;
      this._state = {
        ...this._state,
        ...updates
      };
      this._saveToStorage();
      this._notify(prevState);
    }
    /**
     * Subscribe to state changes
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
      this._subscribers.add(callback);
      return () => this._subscribers.delete(callback);
    }
    /**
     * Reset state to initial
     */
    reset() {
      this._state = { ...initialState, year: (/* @__PURE__ */ new Date()).getFullYear() };
      storageAdapter.clear(STORAGE_KEY);
      this._notify({});
    }
    /**
     * Check if there are pending changes
     */
    hasPendingChanges() {
      const confirmed = new Set(this._state.confirmedDates);
      const pending = new Set(this._state.pendingDates);
      if (confirmed.size !== pending.size)
        return true;
      for (const date of confirmed) {
        if (!pending.has(date))
          return true;
      }
      return false;
    }
    /**
     * Get pending changes details
     */
    getPendingChanges() {
      const confirmed = new Set(this._state.confirmedDates);
      const pending = new Set(this._state.pendingDates);
      const added = [];
      const removed = [];
      for (const date of pending) {
        if (!confirmed.has(date)) {
          added.push(date);
        }
      }
      for (const date of confirmed) {
        if (!pending.has(date)) {
          removed.push(date);
        }
      }
      return { added, removed, total: added.length + removed.length };
    }
    // Private methods
    _notify(prevState) {
      const currentState = this.getState();
      this._subscribers.forEach((callback) => {
        try {
          callback(currentState, prevState);
        } catch (e) {
          console.error("Store subscriber error:", e);
        }
      });
    }
    _saveToStorage() {
      const persistedState = {
        setupComplete: this._state.setupComplete,
        defaultOfficeDays: this._state.defaultOfficeDays,
        requiredDays: this._state.requiredDays,
        year: this._state.year,
        confirmedDates: this._state.confirmedDates
      };
      storageAdapter.save(STORAGE_KEY, persistedState);
    }
    _loadFromStorage() {
      const saved = storageAdapter.load(STORAGE_KEY);
      if (saved) {
        this._state = {
          ...this._state,
          ...saved,
          // Initialize pending to match confirmed
          pendingDates: saved.confirmedDates || []
        };
      }
    }
  };
  var store = new Store();
  if (typeof window !== "undefined") {
    window.__RTO_STORE__ = store;
  }

  // js/utils/date-utils.js
  var DAY_ABBRS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  var WEEKDAY_ABBRS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  var MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  var POLICY_START_DATE = "2026-01-26";
  function jsDateDayToWeekday(jsDay) {
    return jsDay === 0 ? 6 : jsDay - 1;
  }
  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }
  function toISODateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function parseISODateString(isoString) {
    const [year, month, day] = isoString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function getWeekEnd(date) {
    const monday = getWeekStart(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
  }
  function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d - yearStart) / 864e5 + 1) / 7);
    return weekNum;
  }
  function getISOWeekYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
  }
  function getFirstWeekStart(year) {
    const jan4 = new Date(year, 0, 4);
    return getWeekStart(jan4);
  }
  function getLastWeekEnd(year) {
    const dec28 = new Date(year, 11, 28);
    return getWeekEnd(dec28);
  }
  function getWeeksInYear(year) {
    const weeks = [];
    let current = getFirstWeekStart(year);
    const lastDay = getLastWeekEnd(year);
    while (current <= lastDay) {
      const weekNumber = getISOWeekNumber(current);
      const weekYear = getISOWeekYear(current);
      if (weekYear === year) {
        weeks.push({
          weekNumber,
          start: new Date(current),
          end: getWeekEnd(current)
        });
      }
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }
  function getMonthCalendarGrid(year, month) {
    const grid = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      grid.push(new Date(year, month, d));
    }
    while (grid.length % 7 !== 0) {
      grid.push(null);
    }
    return grid;
  }
  function generateDefaultOfficeDates(year, daysOfWeek) {
    const dates = [];
    const date = new Date(year, 0, 1);
    const daysSet = new Set(daysOfWeek);
    while (date.getFullYear() === year) {
      const dateStr = toISODateString(date);
      const weekday = jsDateDayToWeekday(date.getDay());
      if (daysSet.has(weekday) && dateStr >= POLICY_START_DATE) {
        dates.push(dateStr);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  }
  function isToday(isoString) {
    return isoString === toISODateString(/* @__PURE__ */ new Date());
  }
  function isBeforePolicyStart(isoString) {
    return isoString < POLICY_START_DATE;
  }
  function formatDateRange(start, end) {
    const startMonth = MONTH_NAMES[start.getMonth()].slice(0, 3);
    const endMonth = MONTH_NAMES[end.getMonth()].slice(0, 3);
    if (start.getFullYear() !== end.getFullYear()) {
      return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    } else if (start.getMonth() !== end.getMonth()) {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    }
  }

  // js/utils/compliance.js
  function calculateWeeklyAttendance(year, selectedDates) {
    const weeklyAttendance = /* @__PURE__ */ new Map();
    const selectedSet = new Set(selectedDates);
    const weeks = getWeeksInYear(year);
    for (const week of weeks) {
      const weekStartKey = toISODateString(week.start);
      let count = 0;
      const current = new Date(week.start);
      for (let i = 0; i < 5; i++) {
        const dateStr = toISODateString(current);
        if (selectedSet.has(dateStr)) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      weeklyAttendance.set(weekStartKey, count);
    }
    return weeklyAttendance;
  }
  function policyRound(value) {
    const decimal = value - Math.floor(value);
    return decimal >= 0.5 ? Math.ceil(value) : Math.floor(value);
  }
  function calculateWindowResult(weeklyValues) {
    if (weeklyValues.length !== 12) {
      throw new Error(`Expected 12 weeks, got ${weeklyValues.length}`);
    }
    const sorted = [...weeklyValues].sort((a, b) => b - a);
    const best8 = sorted.slice(0, 8);
    const sum = best8.reduce((acc, val) => acc + val, 0);
    const average = sum / 8;
    const rounded = policyRound(average);
    return { average, rounded, best8 };
  }
  function calculateCompliance(year, selectedDates, requiredDays) {
    const weeklyAttendance = calculateWeeklyAttendance(year, selectedDates);
    const weeks = getWeeksInYear(year);
    const policyStartWeekIndex = weeks.findIndex((w) => toISODateString(w.start) >= POLICY_START_DATE);
    if (policyStartWeekIndex === -1) {
      return {
        year,
        requiredDays,
        totalWindows: 0,
        isCompliant: true,
        windows: [],
        nonCompliantWindows: [],
        stats: calculateStats(selectedDates, weeklyAttendance, year)
      };
    }
    const weekKeys = weeks.map((w) => toISODateString(w.start));
    const windows = [];
    const nonCompliantWindows = [];
    const totalWeeks = weekKeys.length;
    const numWindows = totalWeeks - 11;
    for (let i = policyStartWeekIndex; i < numWindows; i++) {
      const windowWeeks = weekKeys.slice(i, i + 12);
      const weeklyValues = windowWeeks.map((key) => weeklyAttendance.get(key) || 0);
      const { average, rounded, best8 } = calculateWindowResult(weeklyValues);
      const isCompliant = rounded >= requiredDays;
      const startWeek = weeks[i];
      const endWeek = weeks[i + 11];
      const windowResult = {
        windowIndex: i + 1,
        startDate: toISODateString(startWeek.start),
        endDate: toISODateString(endWeek.end),
        startWeekNumber: startWeek.weekNumber,
        endWeekNumber: endWeek.weekNumber,
        weeklyValues,
        best8Weeks: best8,
        average,
        rounded,
        isCompliant,
        requiredDays
      };
      windows.push(windowResult);
      if (!isCompliant) {
        nonCompliantWindows.push(windowResult);
      }
    }
    return {
      year,
      requiredDays,
      totalWindows: windows.length,
      isCompliant: nonCompliantWindows.length === 0,
      windows,
      nonCompliantWindows,
      stats: calculateStats(selectedDates, weeklyAttendance, year)
    };
  }
  function calculateStats(selectedDates, weeklyAttendance, year) {
    const totalOfficeDays = selectedDates.filter((d) => d.startsWith(String(year))).length;
    const weeklyValues = Array.from(weeklyAttendance.values());
    const totalWeeks = weeklyValues.length;
    const avgPerWeek = totalWeeks > 0 ? totalOfficeDays / totalWeeks : 0;
    return {
      totalOfficeDays,
      totalWeeks,
      averagePerWeek: Math.round(avgPerWeek * 10) / 10
    };
  }
  function formatWindowForDisplay(window2) {
    const startDate = parseISODateString(window2.startDate);
    const endDate = parseISODateString(window2.endDate);
    return {
      dateRange: formatDateRange(startDate, endDate),
      weekRange: `Weeks ${window2.startWeekNumber}-${window2.endWeekNumber}`,
      average: window2.average.toFixed(2),
      rounded: window2.rounded,
      required: window2.requiredDays,
      isCompliant: window2.isCompliant,
      deficit: window2.isCompliant ? 0 : window2.requiredDays - window2.rounded
    };
  }

  // js/components/setup-form.js
  var template = document.createElement("template");
  template.innerHTML = `
    <div class="setup-card">
        <h2 class="setup-title">Plan Your Return to Office</h2>
        <p class="setup-subtitle">
            Set up your typical office schedule and organization requirements to start planning.
        </p>
        
        <form class="setup-form" id="setupForm">
            <div class="form-group">
                <label class="form-label">Which days do you typically come to the office?</label>
                <div class="day-checkbox-group" id="dayCheckboxGroup">
                    <!-- Days will be rendered here -->
                </div>
                <p class="form-hint">Select the days you normally plan to be in the office.</p>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="requiredDays">
                    How many days per week does your org require?
                </label>
                <div class="required-days-input">
                    <input 
                        type="number" 
                        id="requiredDays" 
                        class="number-input" 
                        min="1" 
                        max="5" 
                        value="3"
                        required
                    >
                    <span class="input-suffix">days per week</span>
                </div>
                <p class="form-hint">This is the minimum average required by your organization.</p>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg setup-submit">
                Start Planning
            </button>
        </form>
    </div>
`;
  var SetupForm = class extends HTMLElement {
    constructor() {
      super();
      this._selectedDays = /* @__PURE__ */ new Set([1, 2, 3]);
    }
    connectedCallback() {
      this.appendChild(template.content.cloneNode(true));
      this._renderDayCheckboxes();
      this._setupEventListeners();
    }
    disconnectedCallback() {
    }
    _renderDayCheckboxes() {
      const container = this.querySelector("#dayCheckboxGroup");
      container.innerHTML = "";
      for (let i = 0; i < 5; i++) {
        const isChecked = this._selectedDays.has(i);
        const dayEl = document.createElement("label");
        dayEl.className = `day-checkbox${isChecked ? " checked" : ""}`;
        dayEl.innerHTML = `
                <input type="checkbox" name="day" value="${i}" ${isChecked ? "checked" : ""}>
                <span class="day-abbr">${WEEKDAY_ABBRS[i]}</span>
                <span class="day-full">${WEEKDAY_NAMES[i]}</span>
            `;
        container.appendChild(dayEl);
      }
    }
    _setupEventListeners() {
      const form = this.querySelector("#setupForm");
      const checkboxGroup = this.querySelector("#dayCheckboxGroup");
      checkboxGroup.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
          const day = parseInt(e.target.value, 10);
          const label = e.target.closest(".day-checkbox");
          if (e.target.checked) {
            this._selectedDays.add(day);
            label.classList.add("checked");
          } else {
            this._selectedDays.delete(day);
            label.classList.remove("checked");
          }
        }
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const requiredDays = parseInt(this.querySelector("#requiredDays").value, 10);
        const defaultOfficeDays = Array.from(this._selectedDays).sort((a, b) => a - b);
        if (defaultOfficeDays.length === 0) {
          alert("Please select at least one day of the week.");
          return;
        }
        if (requiredDays < 1 || requiredDays > 5) {
          alert("Required days must be between 1 and 5.");
          return;
        }
        this.dispatchEvent(new CustomEvent("setup-complete", {
          bubbles: true,
          composed: true,
          detail: {
            defaultOfficeDays,
            requiredDays
          }
        }));
      });
    }
  };
  customElements.define("setup-form", SetupForm);

  // js/components/day-cell.js
  var DayCell = class extends HTMLElement {
    static get observedAttributes() {
      return ["date", "selected", "pending-add", "pending-remove", "disabled"];
    }
    constructor() {
      super();
      this._date = null;
    }
    connectedCallback() {
      this._render();
      this._setupEventListeners();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this._updateState();
      }
    }
    get date() {
      return this.getAttribute("date");
    }
    set date(value) {
      if (value) {
        this.setAttribute("date", value);
      } else {
        this.removeAttribute("date");
      }
    }
    get selected() {
      return this.hasAttribute("selected");
    }
    set selected(value) {
      if (value) {
        this.setAttribute("selected", "");
      } else {
        this.removeAttribute("selected");
      }
    }
    get pendingAdd() {
      return this.hasAttribute("pending-add");
    }
    set pendingAdd(value) {
      if (value) {
        this.setAttribute("pending-add", "");
      } else {
        this.removeAttribute("pending-add");
      }
    }
    get pendingRemove() {
      return this.hasAttribute("pending-remove");
    }
    set pendingRemove(value) {
      if (value) {
        this.setAttribute("pending-remove", "");
      } else {
        this.removeAttribute("pending-remove");
      }
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(value) {
      if (value) {
        this.setAttribute("disabled", "");
      } else {
        this.removeAttribute("disabled");
      }
    }
    _render() {
      const dateStr = this.date;
      if (!dateStr) {
        this.innerHTML = '<div class="day-cell empty"></div>';
        return;
      }
      const date = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
      const dayNum = date.getDate();
      this.innerHTML = `<div class="day-cell">${dayNum}</div>`;
      this._updateState();
    }
    _updateState() {
      const cell = this.querySelector(".day-cell");
      if (!cell || !this.date)
        return;
      const date = /* @__PURE__ */ new Date(this.date + "T00:00:00");
      cell.className = "day-cell";
      if (isWeekend(date)) {
        cell.classList.add("weekend", "disabled");
        return;
      }
      if (isBeforePolicyStart(this.date)) {
        cell.classList.add("before-policy", "disabled");
        return;
      }
      if (isToday(this.date)) {
        cell.classList.add("today");
      }
      if (this.pendingAdd) {
        cell.classList.add("pending-add");
      } else if (this.pendingRemove) {
        cell.classList.add("pending-remove");
      } else if (this.selected) {
        cell.classList.add("selected");
      }
      if (this.disabled) {
        cell.classList.add("disabled");
      }
    }
    _setupEventListeners() {
      this.addEventListener("click", (e) => {
        const dateStr = this.date;
        if (!dateStr)
          return;
        const date = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
        if (isWeekend(date) || isBeforePolicyStart(dateStr) || this.disabled)
          return;
        this.dispatchEvent(new CustomEvent("day-toggle", {
          bubbles: true,
          composed: true,
          detail: { date: dateStr }
        }));
      });
    }
  };
  customElements.define("day-cell", DayCell);

  // js/components/month-calendar.js
  var MonthCalendar = class extends HTMLElement {
    static get observedAttributes() {
      return ["year", "month"];
    }
    constructor() {
      super();
      this._confirmedDates = /* @__PURE__ */ new Set();
      this._pendingDates = /* @__PURE__ */ new Set();
    }
    connectedCallback() {
      this._render();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this._render();
      }
    }
    get year() {
      return parseInt(this.getAttribute("year"), 10);
    }
    set year(value) {
      this.setAttribute("year", value);
    }
    get month() {
      return parseInt(this.getAttribute("month"), 10);
    }
    set month(value) {
      this.setAttribute("month", value);
    }
    /**
     * Update the dates displayed in this month
     * @param {Set<string>} confirmedDates 
     * @param {Set<string>} pendingDates 
     */
    updateDates(confirmedDates, pendingDates) {
      this._confirmedDates = confirmedDates;
      this._pendingDates = pendingDates;
      this._updateDayCells();
    }
    _render() {
      const year = this.year;
      const month = this.month;
      if (isNaN(year) || isNaN(month))
        return;
      const monthName = MONTH_NAMES[month];
      const grid = getMonthCalendarGrid(year, month);
      this.innerHTML = `
            <div class="month-calendar">
                <div class="month-header">${monthName} ${year}</div>
                <div class="weekday-headers">
                    ${DAY_ABBRS.map((day, i) => `
                        <div class="weekday-header${i === 0 || i === 6 ? " weekend" : ""}">${day}</div>
                    `).join("")}
                </div>
                <div class="days-grid" id="daysGrid">
                    ${grid.map((date) => this._renderDayCell(date)).join("")}
                </div>
            </div>
        `;
      this._updateDayCells();
    }
    _renderDayCell(date) {
      if (!date) {
        return "<day-cell></day-cell>";
      }
      const dateStr = toISODateString(date);
      return `<day-cell date="${dateStr}"></day-cell>`;
    }
    _updateDayCells() {
      const cells = this.querySelectorAll("day-cell[date]");
      cells.forEach((cell) => {
        const dateStr = cell.date;
        if (!dateStr)
          return;
        const date = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
        if (isWeekend(date))
          return;
        const isConfirmed = this._confirmedDates.has(dateStr);
        const isPending = this._pendingDates.has(dateStr);
        cell.selected = false;
        cell.pendingAdd = false;
        cell.pendingRemove = false;
        if (isConfirmed && isPending) {
          cell.selected = true;
        } else if (isConfirmed && !isPending) {
          cell.pendingRemove = true;
        } else if (!isConfirmed && isPending) {
          cell.pendingAdd = true;
        }
      });
    }
  };
  customElements.define("month-calendar", MonthCalendar);

  // js/components/calendar-view.js
  var CalendarView = class extends HTMLElement {
    constructor() {
      super();
      this._unsubscribe = null;
    }
    connectedCallback() {
      this._render();
      this._setupEventListeners();
      this._unsubscribe = store.subscribe(() => {
        this._updateMonthCalendars();
      });
      this._updateMonthCalendars();
    }
    disconnectedCallback() {
      if (this._unsubscribe) {
        this._unsubscribe();
      }
    }
    _render() {
      const state = store.getState();
      const year = state.year;
      this.innerHTML = `
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-swatch selected"></div>
                    <span>Going to office</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch unselected"></div>
                    <span>Not going</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch pending-add"></div>
                    <span>Adding (pending)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch pending-remove"></div>
                    <span>Removing (pending)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch weekend"></div>
                    <span>Weekend</span>
                </div>
            </div>
            <div class="calendar-grid" id="calendarGrid">
                ${this._renderMonths(year)}
            </div>
        `;
    }
    _renderMonths(year) {
      let html = "";
      for (let month = 0; month < 12; month++) {
        html += `<month-calendar year="${year}" month="${month}"></month-calendar>`;
      }
      return html;
    }
    _setupEventListeners() {
      this.addEventListener("day-toggle", (e) => {
        const { date } = e.detail;
        this._toggleDate(date);
      });
    }
    _toggleDate(dateStr) {
      const state = store.getState();
      const pendingDates = new Set(state.pendingDates);
      if (pendingDates.has(dateStr)) {
        pendingDates.delete(dateStr);
      } else {
        pendingDates.add(dateStr);
      }
      store.setState({
        pendingDates: Array.from(pendingDates)
      });
    }
    _updateMonthCalendars() {
      const state = store.getState();
      const confirmedDates = new Set(state.confirmedDates);
      const pendingDates = new Set(state.pendingDates);
      const monthCalendars = this.querySelectorAll("month-calendar");
      monthCalendars.forEach((cal) => {
        cal.updateDates(confirmedDates, pendingDates);
      });
    }
  };
  customElements.define("calendar-view", CalendarView);

  // js/components/sidebar.js
  var SidebarPanel = class extends HTMLElement {
    constructor() {
      super();
      this._unsubscribe = null;
    }
    connectedCallback() {
      this._render();
      this._unsubscribe = store.subscribe(() => {
        this._render();
      });
    }
    disconnectedCallback() {
      if (this._unsubscribe) {
        this._unsubscribe();
      }
    }
    _render() {
      const state = store.getState();
      const { defaultOfficeDays, requiredDays, complianceResults } = state;
      const daysDisplay = defaultOfficeDays.map((d) => WEEKDAY_ABBRS[d]).join(", ") || "None selected";
      this.innerHTML = `
            <div class="sidebar-content">
                <!-- Settings Section -->
                <section class="sidebar-section">
                    <h3 class="sidebar-section-title">Your Settings</h3>
                    <div class="settings-list">
                        <div class="setting-item">
                            <span class="setting-label">Default Office Days</span>
                            <span class="setting-value">${daysDisplay}</span>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">Org Requirement</span>
                            <span class="setting-value">${requiredDays} days/week</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm reset-btn" id="resetBtn">
                        Reset & Reconfigure
                    </button>
                </section>
                
                <!-- Compliance Section -->
                <section class="sidebar-section">
                    <h3 class="sidebar-section-title">Compliance Status</h3>
                    ${this._renderComplianceStatus(complianceResults)}
                </section>
                
                <!-- Non-Compliant Windows -->
                ${this._renderNonCompliantWindows(complianceResults)}
                
                <!-- Statistics Section -->
                ${this._renderStats(complianceResults)}
            </div>
        `;
      this._setupEventListeners();
    }
    _setupEventListeners() {
      const resetBtn = this.querySelector("#resetBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (confirm("Are you sure you want to reset? All your selections will be lost.")) {
            store.reset();
            this.dispatchEvent(new CustomEvent("reset-requested", {
              bubbles: true,
              composed: true
            }));
          }
        });
      }
    }
    _renderComplianceStatus(results) {
      if (!results) {
        return `
                <div class="compliance-status compliant">
                    <span class="compliance-icon">\u23F3</span>
                    <span class="compliance-text">Calculating...</span>
                </div>
            `;
      }
      if (results.isCompliant) {
        return `
                <div class="compliance-status compliant">
                    <span class="compliance-icon">\u2713</span>
                    <span class="compliance-text">All ${results.totalWindows} windows compliant</span>
                </div>
            `;
      } else {
        return `
                <div class="compliance-status non-compliant">
                    <span class="compliance-icon">\u2717</span>
                    <span class="compliance-text">${results.nonCompliantWindows.length} of ${results.totalWindows} windows non-compliant</span>
                </div>
            `;
      }
    }
    _renderNonCompliantWindows(results) {
      if (!results || results.isCompliant) {
        return "";
      }
      const windows = results.nonCompliantWindows.slice(0, 10);
      const hasMore = results.nonCompliantWindows.length > 10;
      return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Non-Compliant Windows</h3>
                <div class="windows-list">
                    ${windows.map((w) => this._renderWindowItem(w)).join("")}
                    ${hasMore ? `<p class="form-hint">...and ${results.nonCompliantWindows.length - 10} more</p>` : ""}
                </div>
            </section>
        `;
    }
    _renderWindowItem(window2) {
      const formatted = formatWindowForDisplay(window2);
      return `
            <div class="window-item">
                <div class="window-dates">${formatted.weekRange}</div>
                <div class="window-details">${formatted.dateRange}</div>
                <div class="window-result">
                    <span>Average: ${formatted.average} \u2192 ${formatted.rounded}</span>
                    <span class="result-value">Need: ${formatted.required}</span>
                </div>
            </div>
        `;
    }
    _renderStats(results) {
      if (!results || !results.stats) {
        return "";
      }
      const { totalOfficeDays, totalWeeks, averagePerWeek } = results.stats;
      return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${totalOfficeDays}</div>
                        <div class="stat-label">Total Office Days</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${averagePerWeek}</div>
                        <div class="stat-label">Avg Days/Week</div>
                    </div>
                </div>
            </section>
        `;
    }
  };
  customElements.define("sidebar-panel", SidebarPanel);

  // js/components/action-bar.js
  var ActionBar = class extends HTMLElement {
    constructor() {
      super();
      this._unsubscribe = null;
    }
    connectedCallback() {
      this._render();
      this._setupEventListeners();
      this._unsubscribe = store.subscribe(() => {
        this._updateState();
      });
    }
    disconnectedCallback() {
      if (this._unsubscribe) {
        this._unsubscribe();
      }
    }
    _render() {
      this.innerHTML = `
            <div class="action-bar-content">
                <div class="pending-indicator hidden" id="pendingIndicator">
                    <span class="pending-count" id="pendingCount">0</span>
                    <span>changes pending</span>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary" id="cancelBtn" disabled>
                        Cancel
                    </button>
                    <button class="btn btn-primary" id="confirmBtn" disabled>
                        Confirm Changes
                    </button>
                </div>
            </div>
        `;
      this._updateState();
    }
    _setupEventListeners() {
      this.addEventListener("click", (e) => {
        if (e.target.id === "confirmBtn") {
          this._handleConfirm();
        } else if (e.target.id === "cancelBtn") {
          this._handleCancel();
        }
      });
    }
    _updateState() {
      const hasPending = store.hasPendingChanges();
      const changes = store.getPendingChanges();
      const confirmBtn = this.querySelector("#confirmBtn");
      const cancelBtn = this.querySelector("#cancelBtn");
      const indicator = this.querySelector("#pendingIndicator");
      const countEl = this.querySelector("#pendingCount");
      if (confirmBtn)
        confirmBtn.disabled = !hasPending;
      if (cancelBtn)
        cancelBtn.disabled = !hasPending;
      if (indicator) {
        indicator.classList.toggle("hidden", !hasPending);
      }
      if (countEl) {
        countEl.textContent = changes.total;
      }
    }
    _handleConfirm() {
      const state = store.getState();
      const newConfirmedDates = [...state.pendingDates];
      const complianceResults = calculateCompliance(
        state.year,
        newConfirmedDates,
        state.requiredDays
      );
      store.setState({
        confirmedDates: newConfirmedDates,
        pendingDates: newConfirmedDates,
        complianceResults
      });
      this.dispatchEvent(new CustomEvent("changes-confirmed", {
        bubbles: true,
        composed: true,
        detail: { complianceResults }
      }));
    }
    _handleCancel() {
      const state = store.getState();
      store.setState({
        pendingDates: [...state.confirmedDates]
      });
      this.dispatchEvent(new CustomEvent("changes-cancelled", {
        bubbles: true,
        composed: true
      }));
    }
  };
  customElements.define("action-bar", ActionBar);

  // js/app.js
  var RTOPlannerApp = class {
    constructor() {
      this.setupSection = document.getElementById("setupSection");
      this.plannerSection = document.getElementById("plannerSection");
      this.yearBadge = document.getElementById("yearBadge");
      this._initialize();
    }
    _initialize() {
      const state = store.getState();
      this.yearBadge.textContent = state.year;
      if (state.setupComplete && state.confirmedDates.length > 0) {
        this._recalculateCompliance();
        this._showPlanner();
      } else {
        this._showSetup();
      }
      document.addEventListener("setup-complete", (e) => {
        this._handleSetupComplete(e.detail);
      });
      document.addEventListener("reset-requested", () => {
        this._handleReset();
      });
      document.addEventListener("changes-confirmed", (e) => {
        console.log("Changes confirmed:", e.detail);
      });
    }
    _recalculateCompliance() {
      const state = store.getState();
      const complianceResults = calculateCompliance(
        state.year,
        state.confirmedDates,
        state.requiredDays
      );
      store.setState({ complianceResults });
    }
    _showSetup() {
      this.setupSection.classList.remove("hidden");
      this.plannerSection.classList.add("hidden");
      const setupForm = this.setupSection.querySelector("setup-form");
      if (setupForm) {
        setupForm.remove();
        this.setupSection.innerHTML = "<setup-form></setup-form>";
      }
    }
    _showPlanner() {
      this.setupSection.classList.add("hidden");
      this.plannerSection.classList.remove("hidden");
    }
    _handleSetupComplete({ defaultOfficeDays, requiredDays }) {
      const state = store.getState();
      const year = state.year;
      const defaultDates = generateDefaultOfficeDates(year, defaultOfficeDays);
      const complianceResults = calculateCompliance(year, defaultDates, requiredDays);
      store.setState({
        setupComplete: true,
        defaultOfficeDays,
        requiredDays,
        confirmedDates: defaultDates,
        pendingDates: defaultDates,
        complianceResults
      });
      this._showPlanner();
      console.log("Setup complete:", {
        defaultOfficeDays,
        requiredDays,
        totalDefaultDates: defaultDates.length,
        isCompliant: complianceResults.isCompliant
      });
    }
    _handleReset() {
      this._showSetup();
      console.log("Reset complete - returned to setup");
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    window.app = new RTOPlannerApp();
  });
})();
