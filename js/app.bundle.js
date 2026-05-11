(() => {
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
  var COMPANY_HOLIDAYS = {
    // 2026
    "2026-02-16": "Presidents' Day",
    "2026-05-25": "Memorial Day",
    "2026-07-03": "Independence Day",
    "2026-09-07": "Labor Day",
    "2026-11-26": "Thanksgiving Day",
    "2026-11-27": "Day after Thanksgiving",
    "2026-12-24": "Christmas Eve",
    "2026-12-25": "Christmas Day",
    // 2027
    "2027-01-01": "New Year's Day",
    "2027-01-18": "Martin Luther King Jr. Day",
    "2027-02-15": "Presidents' Day",
    "2027-05-31": "Memorial Day",
    "2027-07-05": "Independence Day (Observed)",
    "2027-09-06": "Labor Day",
    "2027-11-25": "Thanksgiving Day",
    "2027-11-26": "Day after Thanksgiving",
    "2027-12-24": "Christmas Eve",
    "2027-12-25": "Christmas Day",
    // 2028
    "2028-01-17": "Martin Luther King Jr. Day",
    "2028-02-21": "Presidents' Day",
    "2028-05-29": "Memorial Day",
    "2028-07-04": "Independence Day",
    "2028-09-04": "Labor Day",
    "2028-11-23": "Thanksgiving Day",
    "2028-11-24": "Day after Thanksgiving",
    "2028-12-25": "Christmas Day",
    "2028-12-26": "Day after Christmas"
  };
  function isCompanyHoliday(isoString) {
    return isoString in COMPANY_HOLIDAYS;
  }
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
  function isToday(isoString) {
    return isoString === toISODateString(/* @__PURE__ */ new Date());
  }
  function isBeforePolicyStart(isoString) {
    return isoString < POLICY_START_DATE;
  }
  function getDisplayRange(today = /* @__PURE__ */ new Date()) {
    const months = [];
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 13, 1);
    const current = new Date(start);
    while (current < end) {
      months.push({ year: current.getFullYear(), month: current.getMonth() });
      current.setMonth(current.getMonth() + 1);
    }
    return {
      months,
      startYear: months[0].year,
      endYear: months[months.length - 1].year
    };
  }
  function toMonthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }
  function getWeeksInRange(rangeStart, rangeEnd) {
    const weeks = [];
    let current = getWeekStart(rangeStart);
    const lastFriday = getWeekEnd(rangeEnd);
    while (current <= lastFriday) {
      weeks.push({
        weekNumber: getISOWeekNumber(current),
        weekYear: getISOWeekYear(current),
        start: new Date(current),
        end: getWeekEnd(current)
      });
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }
  function generateDefaultOfficeDatesForMonths(months, daysOfWeek) {
    const dates = [];
    const daysSet = new Set(daysOfWeek);
    for (const { year, month } of months) {
      const date = new Date(year, month, 1);
      while (date.getMonth() === month && date.getFullYear() === year) {
        const dateStr = toISODateString(date);
        const weekday = jsDateDayToWeekday(date.getDay());
        if (daysSet.has(weekday) && dateStr >= POLICY_START_DATE && !isCompanyHoliday(dateStr)) {
          dates.push(dateStr);
        }
        date.setDate(date.getDate() + 1);
      }
    }
    return dates;
  }
  function getHolidaysInRange(months) {
    const monthKeys = new Set(months.map((m) => toMonthKey(m.year, m.month)));
    return Object.entries(COMPANY_HOLIDAYS).filter(([dateStr]) => {
      const key = dateStr.substring(0, 7);
      return monthKeys.has(key);
    }).map(([dateStr, name]) => ({ dateStr, name }));
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
    // Rolling display range (computed on load, not persisted)
    displayRange: getDisplayRange(),
    // Months that have been populated with defaults (persisted)
    populatedMonths: [],
    // Confirmed office attendance dates (array of ISO date strings)
    confirmedDates: [],
    // Pending changes (array of ISO date strings)
    pendingDates: [],
    // Compliance results
    complianceResults: null,
    // Selected sliding window index (null = none selected)
    selectedWindowIndex: null
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
        defaultOfficeDays: [...this._state.defaultOfficeDays],
        populatedMonths: [...this._state.populatedMonths]
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
      this._state = { ...initialState, displayRange: getDisplayRange() };
      storageAdapter.clear(STORAGE_KEY);
      this._notify({});
    }
    /**
     * Select a sliding window by index
     * @param {number|null} index - Window index (0-based) or null to deselect
     */
    selectWindow(index) {
      this.setState({ selectedWindowIndex: index });
    }
    /**
     * Clear window selection
     */
    clearWindowSelection() {
      this.setState({ selectedWindowIndex: null });
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
        populatedMonths: this._state.populatedMonths,
        confirmedDates: this._state.confirmedDates
      };
      storageAdapter.save(STORAGE_KEY, persistedState);
    }
    _loadFromStorage() {
      const saved = storageAdapter.load(STORAGE_KEY);
      if (!saved)
        return;
      const displayRange = getDisplayRange();
      let populatedMonths = saved.populatedMonths;
      if (!populatedMonths && saved.year) {
        populatedMonths = [];
        for (let m = 0; m < 12; m++) {
          populatedMonths.push(toMonthKey(saved.year, m));
        }
      }
      populatedMonths = populatedMonths || [];
      let confirmedDates = saved.confirmedDates || [];
      if (saved.setupComplete && saved.defaultOfficeDays && saved.defaultOfficeDays.length > 0) {
        const populatedSet = new Set(populatedMonths);
        const newMonths = displayRange.months.filter(
          (m) => !populatedSet.has(toMonthKey(m.year, m.month))
        );
        if (newMonths.length > 0) {
          const newDates = generateDefaultOfficeDatesForMonths(newMonths, saved.defaultOfficeDays);
          confirmedDates = [...confirmedDates, ...newDates];
          for (const m of newMonths) {
            populatedMonths.push(toMonthKey(m.year, m.month));
          }
        }
      }
      this._state = {
        ...this._state,
        setupComplete: saved.setupComplete || false,
        defaultOfficeDays: saved.defaultOfficeDays || [],
        requiredDays: saved.requiredDays || 3,
        displayRange,
        populatedMonths,
        confirmedDates,
        pendingDates: [...confirmedDates]
      };
      this._saveToStorage();
    }
  };
  var store = new Store();
  if (typeof window !== "undefined") {
    window.__RTO_STORE__ = store;
  }

  // js/utils/compliance.js
  function calculateWeeklyAttendance(year, selectedDates, displayRange) {
    const weeklyAttendance = /* @__PURE__ */ new Map();
    const selectedSet = new Set(selectedDates);
    let weeks;
    if (displayRange) {
      const months = displayRange.months;
      const rangeStart = new Date(months[0].year, months[0].month, 1);
      const lastMonth = months[months.length - 1];
      const rangeEnd = new Date(lastMonth.year, lastMonth.month + 1, 0);
      weeks = getWeeksInRange(rangeStart, rangeEnd);
    } else {
      weeks = getWeeksInYear(year);
    }
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
  function calculateCompliance(year, selectedDates, requiredDays, displayRange) {
    const weeklyAttendance = calculateWeeklyAttendance(year, selectedDates, displayRange);
    let weeks;
    if (displayRange) {
      const months = displayRange.months;
      const rangeStart = new Date(months[0].year, months[0].month, 1);
      const lastMonth = months[months.length - 1];
      const rangeEnd = new Date(lastMonth.year, lastMonth.month + 1, 0);
      weeks = getWeeksInRange(rangeStart, rangeEnd);
    } else {
      weeks = getWeeksInYear(year);
    }
    const policyStartWeekIndex = weeks.findIndex((w) => toISODateString(w.start) >= POLICY_START_DATE);
    if (policyStartWeekIndex === -1) {
      return {
        requiredDays,
        totalWindows: 0,
        isCompliant: true,
        windows: [],
        nonCompliantWindows: []
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
      requiredDays,
      totalWindows: windows.length,
      isCompliant: nonCompliantWindows.length === 0,
      windows,
      nonCompliantWindows
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
      return ["date", "selected", "pending-add", "pending-remove", "disabled", "in-window"];
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
    get inWindow() {
      return this.hasAttribute("in-window");
    }
    set inWindow(value) {
      if (value) {
        this.setAttribute("in-window", "");
      } else {
        this.removeAttribute("in-window");
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
      if (isCompanyHoliday(this.date)) {
        cell.classList.add("holiday");
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
      if (this.inWindow) {
        cell.classList.add("in-window");
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
      this._windowStartDate = null;
      this._windowEndDate = null;
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
     * @param {string|null} windowStartDate - ISO date string for window start
     * @param {string|null} windowEndDate - ISO date string for window end
     */
    updateDates(confirmedDates, pendingDates, windowStartDate = null, windowEndDate = null) {
      this._confirmedDates = confirmedDates;
      this._pendingDates = pendingDates;
      this._windowStartDate = windowStartDate;
      this._windowEndDate = windowEndDate;
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
        cell.inWindow = false;
        if (isConfirmed && isPending) {
          cell.selected = true;
        } else if (isConfirmed && !isPending) {
          cell.pendingRemove = true;
        } else if (!isConfirmed && isPending) {
          cell.pendingAdd = true;
        }
        if (this._windowStartDate && this._windowEndDate) {
          if (dateStr >= this._windowStartDate && dateStr <= this._windowEndDate) {
            cell.inWindow = true;
          }
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
      const displayRange = state.displayRange;
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
                <div class="legend-item">
                    <div class="legend-swatch in-window"></div>
                    <span>Selected window</span>
                </div>
            </div>
            <div class="calendar-grid" id="calendarGrid">
                ${this._renderMonths(displayRange)}
            </div>
        `;
    }
    _renderMonths(displayRange) {
      return displayRange.months.map(
        (m) => `<month-calendar year="${m.year}" month="${m.month}"></month-calendar>`
      ).join("");
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
      let windowStartDate = null;
      let windowEndDate = null;
      if (state.selectedWindowIndex !== null && state.complianceResults && state.complianceResults.windows[state.selectedWindowIndex]) {
        const selectedWindow = state.complianceResults.windows[state.selectedWindowIndex];
        windowStartDate = selectedWindow.startDate;
        windowEndDate = selectedWindow.endDate;
      }
      const monthCalendars = this.querySelectorAll("month-calendar");
      monthCalendars.forEach((cal) => {
        cal.updateDates(confirmedDates, pendingDates, windowStartDate, windowEndDate);
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
      const { defaultOfficeDays, requiredDays, complianceResults, selectedWindowIndex } = state;
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
                
                <!-- Selected Window Details -->
                ${this._renderSelectedWindowDetails(complianceResults, selectedWindowIndex)}
                
                <!-- Sliding Windows List -->
                ${this._renderSlidingWindows(complianceResults, selectedWindowIndex)}
                
                <!-- Company Holidays Section -->
                ${this._renderHolidays()}
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
      this.querySelectorAll(".window-item[data-index]").forEach((item) => {
        item.addEventListener("click", () => {
          const index = parseInt(item.dataset.index, 10);
          const currentIndex = store.get("selectedWindowIndex");
          if (currentIndex === index) {
            store.clearWindowSelection();
          } else {
            store.selectWindow(index);
          }
        });
      });
      const clearBtn = this.querySelector("#clearWindowSelection");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          store.clearWindowSelection();
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
    _renderSlidingWindows(results, selectedIndex) {
      if (!results || !results.windows || results.windows.length === 0) {
        return "";
      }
      const windows = results.windows;
      return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Sliding Windows (${windows.length})</h3>
                <p class="form-hint">Click a window to see details and highlight on calendar</p>
                <div class="windows-list">
                    ${windows.map((w, idx) => this._renderWindowItem(w, idx, selectedIndex)).join("")}
                </div>
            </section>
        `;
    }
    _renderWindowItem(window2, index, selectedIndex) {
      const formatted = formatWindowForDisplay(window2);
      const isSelected = index === selectedIndex;
      const statusClass = window2.isCompliant ? "compliant" : "non-compliant";
      const selectedClass = isSelected ? "selected" : "";
      return `
            <div class="window-item ${statusClass} ${selectedClass}" data-index="${index}">
                <div class="window-header">
                    <span class="window-dates">${formatted.weekRange}</span>
                    <span class="window-status-icon">${window2.isCompliant ? "\u2713" : "\u2717"}</span>
                </div>
                <div class="window-details">${formatted.dateRange}</div>
                <div class="window-result">
                    <span>Avg: ${formatted.average} \u2192 ${formatted.rounded}</span>
                    <span class="result-value ${statusClass}">Req: ${formatted.required}</span>
                </div>
            </div>
        `;
    }
    _renderSelectedWindowDetails(results, selectedIndex) {
      if (!results || selectedIndex === null || selectedIndex === void 0) {
        return "";
      }
      const window2 = results.windows[selectedIndex];
      if (!window2)
        return "";
      const formatted = formatWindowForDisplay(window2);
      const statusClass = window2.isCompliant ? "compliant" : "non-compliant";
      return `
            <section class="sidebar-section window-details-section">
                <div class="window-details-header">
                    <h3 class="sidebar-section-title">Window Details</h3>
                    <button class="btn btn-sm btn-ghost" id="clearWindowSelection" title="Clear selection">\u2715</button>
                </div>
                <div class="selected-window-card ${statusClass}">
                    <div class="window-detail-row">
                        <span class="detail-label">Date Range</span>
                        <span class="detail-value">${formatted.dateRange}</span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Weeks</span>
                        <span class="detail-value">${formatted.weekRange}</span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value status-badge ${statusClass}">
                            ${window2.isCompliant ? "\u2713 Compliant" : "\u2717 Non-Compliant"}
                        </span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Best 8 Avg</span>
                        <span class="detail-value">${formatted.average} \u2192 ${formatted.rounded} days/week</span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Required</span>
                        <span class="detail-value">${formatted.required} days/week</span>
                    </div>
                    ${!window2.isCompliant ? `
                    <div class="window-detail-row">
                        <span class="detail-label">Deficit</span>
                        <span class="detail-value deficit">${formatted.deficit} day(s)/week short</span>
                    </div>
                    ` : ""}
                    <div class="weekly-breakdown">
                        <span class="detail-label">Weekly Breakdown (12 weeks):</span>
                        <div class="weekly-values">
                            ${this._renderWeeklyValues(window2)}
                        </div>
                        <span class="form-hint">Highlighted values are counted in "best 8"</span>
                    </div>
                </div>
            </section>
        `;
    }
    _renderWeeklyValues(window2) {
      const indexed = window2.weeklyValues.map((v, i) => ({ value: v, index: i }));
      const sorted = [...indexed].sort((a, b) => b.value - a.value);
      const best8Indices = new Set(sorted.slice(0, 8).map((x) => x.index));
      return window2.weeklyValues.map((v, i) => {
        const isBest8 = best8Indices.has(i);
        return `<span class="week-value ${isBest8 ? "best8" : ""}" title="Week ${i + 1}">${v}</span>`;
      }).join("");
    }
    _renderHolidays() {
      const state = store.getState();
      const holidays = getHolidaysInRange(state.displayRange.months).map(({ dateStr, name }) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const monthName = MONTH_NAMES[month - 1].slice(0, 3);
        return { dateStr, name, display: `${monthName} ${day}, ${year}` };
      });
      return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Company Holidays</h3>
                <div class="holidays-list">
                    ${holidays.map((h) => `
                        <div class="holiday-item">
                            <span class="holiday-date">${h.display}</span>
                            <span class="holiday-name">${h.name}</span>
                        </div>
                    `).join("")}
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
        null,
        newConfirmedDates,
        state.requiredDays,
        state.displayRange
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
      const dr = state.displayRange;
      if (dr.startYear === dr.endYear) {
        this.yearBadge.textContent = dr.startYear;
      } else {
        this.yearBadge.textContent = `${dr.startYear}\u2013${dr.endYear}`;
      }
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
        null,
        state.confirmedDates,
        state.requiredDays,
        state.displayRange
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
      const displayRange = state.displayRange;
      const defaultDates = generateDefaultOfficeDatesForMonths(displayRange.months, defaultOfficeDays);
      const populatedMonths = displayRange.months.map((m) => toMonthKey(m.year, m.month));
      const complianceResults = calculateCompliance(null, defaultDates, requiredDays, displayRange);
      store.setState({
        setupComplete: true,
        defaultOfficeDays,
        requiredDays,
        populatedMonths,
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
