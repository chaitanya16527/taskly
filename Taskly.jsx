import { useEffect, useState } from "react";
// Taskly: complete app in a single file (Days 1-3 combined).
// Frontend prototype: data lives in React state + browser localStorage only.

// ===== utils/dateUtils.js =====
// All dates are plain "YYYY-MM-DD" strings in LOCAL time.
// Comparing these strings with < and > works correctly, and we never
// convert through UTC, so dates never shift by a day.

const pad = (n) => String(n).padStart(2, "0");

function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getToday() {
  return toDateString(new Date());
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateString, amount) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
}

// Local timestamp such as "2026-09-30T20:30:00" (no UTC conversion)
function nowLocalISO() {
  const now = new Date();
  return `${toDateString(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function isDateInRange(date, start, end) {
  return date >= start && date <= end;
}

function formatShort(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLong(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekdayLong(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatRange(start, end) {
  return start === end ? formatShort(start) : `${formatShort(start)} – ${formatShort(end)}`;
}

// "19:00" -> "7:00 PM"
function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
}

function formatTimeFromISO(iso) {
  return formatTime(iso.slice(11, 16));
}

function getDatePart(iso) {
  return iso.slice(0, 10);
}

function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getRelativeDateLabel(dateString, today = getToday()) {
  if (dateString === today) return "Today";
  if (dateString === addDays(today, -1)) return "Yesterday";
  return formatLong(dateString);
}

function getMonthName(year, month) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(year, month, delta) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

// Returns the cells of a Monday-first month grid (full weeks only).
function getMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 - offset + i);
    cells.push({ date: toDateString(date), inMonth: date.getMonth() === month });
  }
  return cells;
}

// ===== utils/curriculumUtils.js =====
// Curriculum shape:
// { id, name, description, subjects: [{ id, name, topics: [
//   { id, name, completed, completedAt, scheduledTaskId } ] }] }

function calcProgress(completed, total) {
  // Avoid NaN when there are no topics
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

function getSubjectProgress(subject) {
  const done = subject.topics.filter((topic) => topic.completed).length;
  return calcProgress(done, subject.topics.length);
}

// Flat list of every topic, with its subject name attached
function getAllTopics(curriculum) {
  if (!curriculum) return [];
  return curriculum.subjects.flatMap((subject) =>
    subject.topics.map((topic) => ({ ...topic, subjectName: subject.name }))
  );
}

function getCurriculumProgress(curriculum) {
  const topics = getAllTopics(curriculum);
  return calcProgress(topics.filter((topic) => topic.completed).length, topics.length);
}

// "JavaScript → Functions", or null if the topic no longer exists
function getTopicLabel(curriculum, topicId) {
  if (!topicId) return null;
  const topic = getAllTopics(curriculum).find((item) => item.id === topicId);
  return topic ? `${topic.subjectName} → ${topic.name}` : null;
}

// Returns a new curriculum with every topic run through `change`
function mapTopics(curriculum, change) {
  return {
    ...curriculum,
    subjects: curriculum.subjects.map((subject) => ({
      ...subject,
      topics: subject.topics.map(change),
    })),
  };
}

// Point `topicId` at `taskId` (and remove the task from any other topic)
function linkTaskToTopic(curriculum, taskId, topicId) {
  return mapTopics(curriculum, (topic) => {
    if (topic.id === topicId) return { ...topic, scheduledTaskId: taskId };
    if (topic.scheduledTaskId === taskId) return { ...topic, scheduledTaskId: null };
    return topic;
  });
}

// Used when a task is deleted, so no topic keeps a broken reference
function unlinkTask(curriculum, taskId) {
  return mapTopics(curriculum, (topic) =>
    topic.scheduledTaskId === taskId ? { ...topic, scheduledTaskId: null } : topic
  );
}

// ===== utils/taskUtils.js =====
// Task shape:
// { id, title, description, startDate, endDate, hasTime, startTime, endTime,
//   priority, completed, completedAt, topicId }

let idCounter = 0;
function makeId() {
  idCounter += 1;
  return Date.now() * 1000 + (idCounter % 1000);
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

// A task belongs to every date from startDate to endDate (inclusive)
function isTaskOnDate(task, date) {
  return isDateInRange(date, task.startDate, task.endDate);
}

function compareByDate(a, b) {
  if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
  const timeA = a.hasTime ? a.startTime : "99:99";
  const timeB = b.hasTime ? b.startTime : "99:99";
  if (timeA !== timeB) return timeA.localeCompare(timeB);
  return a.title.localeCompare(b.title);
}

function getTasksForDate(tasks, date) {
  return tasks.filter((task) => isTaskOnDate(task, date)).sort(compareByDate);
}

const getCompletedTasks = (tasks) => tasks.filter((task) => task.completed);
const getPendingTasks = (tasks) => tasks.filter((task) => !task.completed);

// Pending tasks that start after today
function getUpcomingTasks(tasks, today) {
  return tasks.filter((task) => !task.completed && task.startDate > today).sort(compareByDate);
}

function filterTasks(tasks, search, status, priority) {
  const query = search.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.description || "").toLowerCase().includes(query);
    const matchesStatus =
      status === "all" || (status === "completed" ? task.completed : !task.completed);
    const matchesPriority = priority === "all" || task.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });
}

// Returns a sorted COPY; the original array is never changed
function sortTasks(tasks, sortBy) {
  const copy = [...tasks];
  if (sortBy === "priority") {
    return copy.sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || compareByDate(a, b)
    );
  }
  if (sortBy === "recent") return copy.sort((a, b) => b.id - a.id);
  return copy.sort(compareByDate);
}

// History is derived from completed tasks and completed topics
function getHistoryItems(tasks, curriculum) {
  const items = [];

  tasks.forEach((task) => {
    if (task.completed && task.completedAt) {
      items.push({
        key: `task-${task.id}`,
        type: "task",
        title: task.title,
        detail: `${task.priority} priority task`,
        completedAt: task.completedAt,
      });
    }
  });

  if (curriculum) {
    curriculum.subjects.forEach((subject) => {
      subject.topics.forEach((topic) => {
        if (topic.completed && topic.completedAt) {
          items.push({
            key: `topic-${topic.id}`,
            type: "curriculum",
            title: topic.name,
            detail: `Topic in ${subject.name}`,
            completedAt: topic.completedAt,
          });
        }
      });
    });
  }

  return items.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

// ===== utils/useLocalStorage.js =====
// Works like useState, but also saves the value in this browser's localStorage.
// This is TEMPORARY, browser-only persistence: it is not private, secure or shared
// between devices. It will be replaced by API/database calls for a signed-in user.
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore unreadable data and fall back to the initial value
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage may be full or blocked; the app still works in memory
    }
  }, [key, value]);

  return [value, setValue];
}

// ===== data/sampleData.js =====
// Sample data for first launch. Dates are relative to "today" so the demo always looks alive.
// Replace or empty these arrays to start fresh.
function createSampleData() {
  const today = getToday();
  const day = (offset) => addDays(today, offset);

  const tasks = [
    {
      id: 1, title: "Build Taskly components", description: "Finish the first version of Taskly",
      startDate: today, endDate: day(2), hasTime: true, startTime: "19:00", endTime: "21:00",
      priority: "High", completed: false, completedAt: null, topicId: 1014,
    },
    {
      id: 2, title: "Practice JavaScript functions", description: "Write five small practice functions",
      startDate: today, endDate: today, hasTime: false, startTime: "", endTime: "",
      priority: "Medium", completed: false, completedAt: null, topicId: 1009,
    },
    {
      id: 3, title: "Review CSS selectors", description: "",
      startDate: day(-1), endDate: day(-1), hasTime: true, startTime: "17:00", endTime: "18:00",
      priority: "Low", completed: true, completedAt: `${day(-1)}T17:30:00`, topicId: null,
    },
    {
      id: 4, title: "Flexbox practice", description: "Rebuild a navbar and a card row",
      startDate: day(1), endDate: day(1), hasTime: true, startTime: "10:00", endTime: "11:30",
      priority: "Medium", completed: false, completedAt: null, topicId: 1005,
    },
    {
      id: 5, title: "Read about accessibility", description: "Labels, focus states and contrast",
      startDate: day(4), endDate: day(6), hasTime: false, startTime: "", endTime: "",
      priority: "Low", completed: false, completedAt: null, topicId: 1003,
    },
    {
      id: 6, title: "HTML forms exercise", description: "Build a signup form",
      startDate: day(-2), endDate: day(-2), hasTime: false, startTime: "", endTime: "",
      priority: "High", completed: true, completedAt: `${day(-2)}T20:45:00`, topicId: 1002,
    },
  ];

  const topic = (id, name, completed = false, completedAt = null, scheduledTaskId = null) => ({
    id, name, completed, completedAt, scheduledTaskId,
  });

  const curriculum = {
    id: 1,
    name: "Frontend Development",
    description: "My roadmap for becoming a frontend developer.",
    subjects: [
      {
        id: 101, name: "HTML",
        topics: [
          topic(1001, "Semantic HTML", true, `${day(-3)}T18:00:00`),
          topic(1002, "Forms", true, `${day(-2)}T20:45:00`, 6),
          topic(1003, "Accessibility", false, null, 5),
        ],
      },
      {
        id: 102, name: "CSS",
        topics: [
          topic(1004, "Selectors", true, `${day(-1)}T17:30:00`),
          topic(1005, "Flexbox", false, null, 4),
          topic(1006, "Grid"),
          topic(1007, "Responsive Design"),
        ],
      },
      {
        id: 103, name: "JavaScript",
        topics: [
          topic(1008, "Variables", true, `${day(-4)}T16:00:00`),
          topic(1009, "Functions", false, null, 2),
          topic(1010, "Arrays"),
          topic(1011, "DOM"),
          topic(1012, "Events"),
        ],
      },
      {
        id: 104, name: "React",
        topics: [
          topic(1013, "Components"),
          topic(1014, "Props", false, null, 1),
          topic(1015, "State"),
        ],
      },
    ],
  };

  const profile = {
    name: "Taskly User",
    bio: "Building better study and work habits, one task at a time.",
    learningFocus: "JavaScript, React, Full Stack",
  };

  return { tasks, curriculum, profile };
}

// ===== components/Icon.jsx =====
// Small outline icons drawn with inline SVG (no icon library needed).
const PATHS = {
  dashboard: (<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>),
  tasks: (<><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  curriculum: (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  history: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  user: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  plus: (<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>),
  trash: (<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>),
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>),
  menu: (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>),
  check: <polyline points="20 6 9 17 4 12" />,
  left: <polyline points="15 18 9 12 15 6" />,
  right: <polyline points="9 18 15 12 9 6" />,
  search: (<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>),
  x: (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>),
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

// ===== components/Modal.jsx =====
// Simple dialog: Escape or a click on the backdrop closes it, background scroll is locked.
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== components/ConfirmModal.jsx =====
function ConfirmModal({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="muted">{message}</p>
      <p className="muted small">This action cannot be undone.</p>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ===== components/EmptyState.jsx =====
function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {actionLabel && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          <Icon name="plus" size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ===== components/ProgressBar.jsx =====
function ProgressBar({ percent, label }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

// ===== components/Segmented.jsx =====
// A row of buttons where exactly one option is selected (used for filters).
function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "active" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ===== components/SearchBar.jsx =====
function SearchBar({ value, onChange, placeholder = "Search tasks..." }) {
  return (
    <div className="search">
      <label htmlFor="task-search" className="visually-hidden">
        Search tasks
      </label>
      <Icon name="search" size={16} />
      <input
        id="task-search"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

// ===== components/InlineAdd.jsx =====
// Small "+ Add ..." control that expands into a one-field form with inline validation.
function InlineAdd({ itemName, placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!value.trim()) {
      setError(`${itemName} name is required.`);
      return;
    }
    onAdd(value.trim());
    setValue("");
    setError("");
  }

  function handleClose() {
    setOpen(false);
    setValue("");
    setError("");
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-link" onClick={() => setOpen(true)}>
        <Icon name="plus" size={16} />
        Add {itemName.toLowerCase()}
      </button>
    );
  }

  const errorId = `inline-error-${itemName}`;
  return (
    <form className="inline-add" onSubmit={handleSubmit} noValidate>
      <div className="inline-add-row">
        <label className="visually-hidden" htmlFor={`inline-${itemName}`}>
          {itemName} name
        </label>
        <input
          id={`inline-${itemName}`}
          type="text"
          autoFocus
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
        />
        <button type="submit" className="btn btn-primary">Add</button>
        <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancel</button>
      </div>
      {error && <p className="error" id={errorId}>{error}</p>}
    </form>
  );
}

// ===== components/Header.jsx =====
function Header({ profile, pageLabel, onMenu, onProfile }) {
  const initial = (profile.name.trim()[0] || "?").toUpperCase();

  return (
    <header className="header">
      <button type="button" className="icon-btn menu-btn" aria-label="Open navigation menu" onClick={onMenu}>
        <Icon name="menu" />
      </button>
      <span className="header-brand">Taskly</span>
      <span className="header-page">{pageLabel}</span>
      <button type="button" className="profile-btn" aria-label="Open my workspace" onClick={onProfile}>
        <span className="avatar sm" aria-hidden="true">{initial}</span>
        <span className="profile-name">{profile.name}</span>
      </button>
    </header>
  );
}

// ===== components/Sidebar.jsx =====
const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "curriculum", label: "Curriculum", icon: "curriculum" },
  { id: "history", label: "History", icon: "history" },
  { id: "workspace", label: "My Workspace", icon: "user" },
];

function Sidebar({ page, open, onNavigate, onClose }) {
  const renderItem = (item) => (
    <li key={item.id}>
      <button
        type="button"
        className={`nav-item${page === item.id ? " active" : ""}`}
        aria-current={page === item.id ? "page" : undefined}
        onClick={() => onNavigate(item.id)}
      >
        <Icon name={item.icon} />
        {item.label}
      </button>
    </li>
  );

  return (
    <>
      {open && <button type="button" className="scrim" aria-label="Close navigation menu" onClick={onClose} />}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          <span className="brand-name">Taskly</span>
          <span className="brand-tag">Plan it. Do it. Done.</span>
        </div>
        <nav aria-label="Main navigation">
          <ul className="nav-list">{PAGES.slice(0, 5).map(renderItem)}</ul>
        </nav>
        <div className="sidebar-foot">
          <ul className="nav-list">{renderItem(PAGES[5])}</ul>
        </div>
      </aside>
    </>
  );
}

// ===== components/TaskStats.jsx =====
function TaskStats({ tasks }) {
  const stats = [
    { label: "Total", value: tasks.length },
    { label: "Completed", value: getCompletedTasks(tasks).length, tone: "done" },
    { label: "Pending", value: getPendingTasks(tasks).length },
  ];

  return (
    <section className="stats" aria-label="Task statistics">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat ${stat.tone || ""}`}>
          <p className="stat-label">{stat.label}</p>
          <p className="stat-value">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}

// ===== components/TaskItem.jsx =====
function TaskItem({ task, topicLabel, compact, onToggle, onEdit, onDelete }) {
  return (
    <li className={`task${task.completed ? " is-done" : ""}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "pending" : "completed"}`}
        />
        <span className="check-box" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      </label>

      <div className="task-body">
        <p className="task-title">{task.title}</p>
        {!compact && task.description && <p className="task-desc">{task.description}</p>}
        <div className="task-meta">
          <span>{formatRange(task.startDate, task.endDate)}</span>
          {task.hasTime && (
            <span>
              {formatTime(task.startTime)} – {formatTime(task.endTime)}
            </span>
          )}
          <span className={`pill p-${task.priority.toLowerCase()}`}>{task.priority} priority</span>
          {task.completed && <span className="pill p-done">Completed</span>}
          {!compact && topicLabel && <span className="pill p-topic">{topicLabel}</span>}
        </div>
      </div>

      {!compact && (
        <div className="task-actions">
          <button type="button" className="icon-btn" aria-label={`Edit "${task.title}"`} onClick={() => onEdit(task)}>
            <Icon name="edit" />
          </button>
          <button type="button" className="icon-btn danger" aria-label={`Delete "${task.title}"`} onClick={() => onDelete(task)}>
            <Icon name="trash" />
          </button>
        </div>
      )}
    </li>
  );
}

// ===== components/TaskList.jsx =====
// `actions` = { onToggle(id), onEdit(task), onDelete(task) }
// `empty` = what to show when there are no tasks
function TaskList({ tasks, curriculum, actions, compact = false, empty = null }) {
  if (tasks.length === 0) return empty;

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          compact={compact}
          topicLabel={getTopicLabel(curriculum, task.topicId)}
          onToggle={actions.onToggle}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      ))}
    </ul>
  );
}

// ===== components/TaskFilters.jsx =====
const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

function TaskFilters({ status, priority, sortBy, onStatus, onPriority, onSort }) {
  return (
    <div className="filters">
      <Segmented label="Filter by status" options={STATUS_OPTIONS} value={status} onChange={onStatus} />

      <div className="select-field">
        <label htmlFor="filter-priority">Priority</label>
        <select id="filter-priority" value={priority} onChange={(event) => onPriority(event.target.value)}>
          <option value="all">All</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="select-field">
        <label htmlFor="sort-by">Sort</label>
        <select id="sort-by" value={sortBy} onChange={(event) => onSort(event.target.value)}>
          <option value="date">Date</option>
          <option value="priority">Priority</option>
          <option value="recent">Recently added</option>
        </select>
      </div>
    </div>
  );
}

// ===== components/TaskForm.jsx =====
function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.startDate) errors.startDate = "Start date is required.";
  if (!values.endDate) errors.endDate = "End date is required.";
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be after or equal to start date.";
  }
  if (values.hasTime) {
    if (!values.startTime) errors.startTime = "Start time is required.";
    if (!values.endTime) errors.endTime = "End time is required.";
    if (values.startTime && values.endTime && values.endTime < values.startTime) {
      errors.endTime = "Please enter a valid time range.";
    }
  }
  return errors;
}

function Field({ id, label, required, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className="error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

// Used for both "Add task" (task = null) and "Edit task" (task = existing task).
function TaskForm({ task, defaults = {}, curriculum, today, onSave, onCancel }) {
  const isEdit = Boolean(task);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({
    title: task?.title ?? defaults.title ?? "",
    description: task?.description ?? "",
    startDate: task?.startDate ?? defaults.startDate ?? today,
    endDate: task?.endDate ?? defaults.startDate ?? today,
    hasTime: task?.hasTime ?? false,
    startTime: task?.startTime || "09:00",
    endTime: task?.endTime || "10:00",
    priority: task?.priority ?? "Medium",
    topicId: task?.topicId ?? defaults.topicId ?? null,
  });

  // After the first submit attempt, errors update live as the user fixes the fields.
  const errors = submitted ? validate(values) : {};

  function setField(name, value) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Keep the end date from falling behind a newly chosen start date
      if (name === "startDate" && value && next.endDate < value) next.endDate = value;
      return next;
    });
  }

  // Only offer topics that are free, or already linked to this task
  const topicGroups = (curriculum ? curriculum.subjects : [])
    .map((subject) => ({
      subject,
      topics: subject.topics.filter(
        (topic) =>
          !topic.scheduledTaskId ||
          topic.scheduledTaskId === task?.id ||
          topic.id === defaults.topicId
      ),
    }))
    .filter((group) => group.topics.length > 0);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values)).length > 0) return;

    onSave({
      id: task?.id,
      title: values.title.trim(),
      description: values.description.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      hasTime: values.hasTime,
      startTime: values.hasTime ? values.startTime : "",
      endTime: values.hasTime ? values.endTime : "",
      priority: values.priority,
      topicId: values.topicId,
    });
  }

  const describe = (name) => (errors[name] ? `${name}-error` : undefined);

  return (
    <Modal title={isEdit ? "Edit task" : "Add task"} onClose={onCancel}>
      <form onSubmit={handleSubmit} noValidate>
        <Field id="title" label="Task title" required error={errors.title}>
          <input
            id="title"
            type="text"
            autoFocus
            placeholder="What needs to be done?"
            value={values.title}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describe("title")}
            onChange={(event) => setField("title", event.target.value)}
          />
        </Field>

        <Field id="description" label="Description">
          <textarea
            id="description"
            rows={3}
            placeholder="Add some details..."
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
          />
        </Field>

        <div className="form-grid">
          <Field id="startDate" label="Start date" required error={errors.startDate}>
            <input
              id="startDate"
              type="date"
              value={values.startDate}
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={describe("startDate")}
              onChange={(event) => setField("startDate", event.target.value)}
            />
          </Field>
          <Field id="endDate" label="End date" required error={errors.endDate}>
            <input
              id="endDate"
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              aria-invalid={Boolean(errors.endDate)}
              aria-describedby={describe("endDate")}
              onChange={(event) => setField("endDate", event.target.value)}
            />
          </Field>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={values.hasTime}
            onChange={(event) => setField("hasTime", event.target.checked)}
          />
          {values.hasTime ? "Specific time" : "No specific time"}
        </label>

        {values.hasTime && (
          <div className="form-grid">
            <Field id="startTime" label="Start time" required error={errors.startTime}>
              <input
                id="startTime"
                type="time"
                value={values.startTime}
                aria-invalid={Boolean(errors.startTime)}
                aria-describedby={describe("startTime")}
                onChange={(event) => setField("startTime", event.target.value)}
              />
            </Field>
            <Field id="endTime" label="End time" required error={errors.endTime}>
              <input
                id="endTime"
                type="time"
                value={values.endTime}
                aria-invalid={Boolean(errors.endTime)}
                aria-describedby={describe("endTime")}
                onChange={(event) => setField("endTime", event.target.value)}
              />
            </Field>
          </div>
        )}

        <div className="form-grid">
          <Field id="priority" label="Priority">
            <select id="priority" value={values.priority} onChange={(event) => setField("priority", event.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </Field>

          {topicGroups.length > 0 && (
            <Field id="topicId" label="Curriculum topic (optional)">
              <select
                id="topicId"
                value={values.topicId ?? ""}
                onChange={(event) => setField("topicId", event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">None</option>
                {topicGroups.map((group) => (
                  <optgroup key={group.subject.id} label={group.subject.name}>
                    {group.topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {group.subject.name} → {topic.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">{isEdit ? "Save changes" : "Add task"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ===== components/Calendar/SelectedDateTasks.jsx =====
function SelectedDateTasks({ date, today, tasks, curriculum, taskActions, onAddTask }) {
  const dayTasks = getTasksForDate(tasks, date);

  return (
    <section className="card" aria-label="Tasks for the selected date" aria-live="polite">
      <div className="row">
        <div>
          <h2 className="card-title">{formatLong(date)}</h2>
          <p className="muted small">
            {date === today ? "Today, " : ""}
            {dayTasks.length === 0 ? "no tasks" : `${dayTasks.length} ${dayTasks.length === 1 ? "task" : "tasks"}`}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onAddTask({ startDate: date })}>
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      <TaskList
        tasks={dayTasks}
        curriculum={curriculum}
        actions={taskActions}
        empty={<EmptyState title="Nothing scheduled for this day." text="Add a task to plan this date." />}
      />
    </section>
  );
}

// ===== components/Calendar/Calendar.jsx =====
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Calendar({ tasks, curriculum, today, taskActions, onAddTask }) {
  const start = parseDate(today);
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const [selected, setSelected] = useState(today);

  const cells = getMonthGrid(view.year, view.month);

  function goToMonth(delta) {
    setView((current) => shiftMonth(current.year, current.month, delta));
  }

  function goToToday() {
    setView({ year: start.getFullYear(), month: start.getMonth() });
    setSelected(today);
  }

  // Clicking a day from the previous/next month also moves the view there
  function selectDate(cell) {
    setSelected(cell.date);
    if (!cell.inMonth) {
      const date = parseDate(cell.date);
      setView({ year: date.getFullYear(), month: date.getMonth() });
    }
  }

  return (
    <div className="cal-layout">
      <section className="card" aria-label="Monthly calendar">
        <div className="cal-head">
          <h2 className="card-title" aria-live="polite">{getMonthName(view.year, view.month)}</h2>
          <div className="cal-controls">
            <button type="button" className="btn btn-ghost" onClick={goToToday}>Today</button>
            <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => goToMonth(-1)}>
              <Icon name="left" />
            </button>
            <button type="button" className="icon-btn" aria-label="Next month" onClick={() => goToMonth(1)}>
              <Icon name="right" />
            </button>
          </div>
        </div>

        <div className="cal-weekdays" aria-hidden="true">
          {WEEKDAYS.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>

        <div className="cal-grid">
          {cells.map((cell) => {
            const dayTasks = getTasksForDate(tasks, cell.date);
            const count = dayTasks.length;
            const classes = [
              "cal-day",
              cell.inMonth ? "" : "outside",
              cell.date === today ? "today" : "",
              cell.date === selected ? "selected" : "",
            ].join(" ");

            return (
              <button
                key={cell.date}
                type="button"
                className={classes}
                aria-pressed={cell.date === selected}
                aria-label={`${formatLong(cell.date)}, ${count} ${count === 1 ? "task" : "tasks"}${cell.date === today ? ", today" : ""}`}
                onClick={() => selectDate(cell)}
              >
                <span className="cal-num">{Number(cell.date.slice(8))}</span>
                <span className="cal-titles">
                  {dayTasks.slice(0, 2).map((task) => (
                    <span key={task.id} className={`cal-task p-${task.priority.toLowerCase()}${task.completed ? " done" : ""}`}>
                      {task.title}
                    </span>
                  ))}
                  {count > 2 && <span className="cal-more">+{count - 2} more</span>}
                </span>
                <span className="cal-dots" aria-hidden="true">
                  {dayTasks.slice(0, 3).map((task) => (
                    <i key={task.id} className={`dot p-${task.priority.toLowerCase()}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <SelectedDateTasks
        date={selected}
        today={today}
        tasks={tasks}
        curriculum={curriculum}
        taskActions={taskActions}
        onAddTask={onAddTask}
      />
    </div>
  );
}

// ===== components/Curriculum/CurriculumForm.jsx =====
function CurriculumForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Curriculum name is required.");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="cur-name">Curriculum name <span className="req" aria-hidden="true">*</span></label>
        <input
          id="cur-name"
          type="text"
          autoFocus
          placeholder="Frontend Development"
          value={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "cur-name-error" : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
        {error && <p className="error" id="cur-name-error">{error}</p>}
      </div>
      <div className="field">
        <label htmlFor="cur-desc">Description</label>
        <textarea
          id="cur-desc"
          rows={3}
          placeholder="My roadmap for becoming a frontend developer."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Create curriculum</button>
      </div>
    </form>
  );
}

// ===== components/Curriculum/TopicItem.jsx =====
// `task` is the connected task (or undefined). A deleted task simply means "Not scheduled".
function TopicItem({ topic, task, onToggle, onSchedule, onDelete }) {
  return (
    <li className={`topic${topic.completed ? " is-done" : ""}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={topic.completed}
          onChange={() => onToggle(topic.id)}
          aria-label={`Mark topic "${topic.name}" as ${topic.completed ? "incomplete" : "complete"}`}
        />
        <span className="check-box" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      </label>

      <div className="topic-body">
        <p className="topic-name">{topic.name}</p>
        <p className={`topic-status${task ? " scheduled" : ""}`}>
          {task
            ? `Scheduled: ${formatRange(task.startDate, task.endDate)}${task.completed ? " (task done)" : ""}`
            : "Not scheduled"}
        </p>
      </div>

      {!topic.completed && !task && (
        <button type="button" className="btn btn-link" onClick={() => onSchedule(topic)}>
          Schedule topic
        </button>
      )}
      <button type="button" className="icon-btn danger" aria-label={`Remove topic "${topic.name}"`} onClick={() => onDelete(topic)}>
        <Icon name="trash" size={16} />
      </button>
    </li>
  );
}

// ===== components/Curriculum/SubjectCard.jsx =====
function SubjectCard({ subject, tasks, actions }) {
  const progress = getSubjectProgress(subject);

  return (
    <section className="card subject">
      <div className="row">
        <div>
          <h3 className="card-title">{subject.name}</h3>
          <p className="muted small">
            {progress.completed} / {progress.total} topics completed
          </p>
        </div>
        <div className="row tight">
          <span className="percent">{progress.percent}%</span>
          <button type="button" className="icon-btn danger" aria-label={`Remove subject "${subject.name}"`} onClick={() => actions.onDeleteSubject(subject)}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      <ProgressBar percent={progress.percent} label={`${subject.name} progress`} />

      {subject.topics.length === 0 ? (
        <p className="muted small">No topics yet. Add the first one below.</p>
      ) : (
        <ul className="topic-list">
          {subject.topics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              task={tasks.find((task) => task.id === topic.scheduledTaskId)}
              onToggle={actions.onToggleTopic}
              onSchedule={actions.onScheduleTopic}
              onDelete={actions.onDeleteTopic}
            />
          ))}
        </ul>
      )}

      <InlineAdd itemName="Topic" placeholder="e.g. Functions" onAdd={(name) => actions.onAddTopic(subject.id, name)} />
    </section>
  );
}

// ===== components/Curriculum/Curriculum.jsx =====
function Curriculum({ curriculum, tasks, actions }) {
  const [showForm, setShowForm] = useState(false);

  if (!curriculum) {
    return (
      <>
        <div className="page-head"><h1>Curriculum</h1></div>
        {showForm ? (
          <div className="card narrow">
            <h2 className="card-title">Create curriculum</h2>
            <CurriculumForm
              onSubmit={(values) => {
                actions.onCreate(values);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <EmptyState
            title="Build your curriculum"
            text="Create a learning plan and track your progress topic by topic."
            actionLabel="Create curriculum"
            onAction={() => setShowForm(true)}
          />
        )}
      </>
    );
  }

  const progress = getCurriculumProgress(curriculum);

  return (
    <>
      <div className="page-head row">
        <div>
          <h1>{curriculum.name}</h1>
          {curriculum.description && <p className="muted">{curriculum.description}</p>}
        </div>
        <button type="button" className="btn btn-ghost danger-text" onClick={actions.onDelete}>
          <Icon name="trash" size={16} />
          Delete curriculum
        </button>
      </div>

      <section className="card overall">
        <div className="row">
          <h2 className="card-title">Overall progress</h2>
          <span className="percent big">{progress.percent}%</span>
        </div>
        <ProgressBar percent={progress.percent} label="Overall curriculum progress" />
        <p className="muted small">
          {progress.completed} / {progress.total} topics completed
        </p>
      </section>

      {curriculum.subjects.length === 0 && (
        <p className="muted">Add your first subject, such as HTML or JavaScript.</p>
      )}

      <div className="stack">
        {curriculum.subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} tasks={tasks} actions={actions} />
        ))}
      </div>

      <div className="add-subject">
        <InlineAdd itemName="Subject" placeholder="e.g. JavaScript" onAdd={actions.onAddSubject} />
      </div>
    </>
  );
}

// ===== components/History/HistoryItem.jsx =====
function HistoryItem({ item }) {
  return (
    <li className="history-item">
      <span className="history-check"><Icon name="check" size={14} /></span>
      <div className="history-text">
        <p className="history-title">{item.title}</p>
        <p className="muted small">{item.detail}</p>
      </div>
      <time className="muted small" dateTime={item.completedAt}>{formatTimeFromISO(item.completedAt)}</time>
    </li>
  );
}

// ===== components/History/History.jsx =====
const FILTERS = [
  { value: "all", label: "All" },
  { value: "task", label: "Tasks" },
  { value: "curriculum", label: "Curriculum" },
];

function History({ tasks, curriculum, today }) {
  const [filter, setFilter] = useState("all");

  const items = getHistoryItems(tasks, curriculum).filter((item) => filter === "all" || item.type === filter);

  // Group items by the date they were completed (items are already newest first)
  const groups = [];
  items.forEach((item) => {
    const date = getDatePart(item.completedAt);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  });

  return (
    <>
      <div className="page-head row">
        <div>
          <h1>History</h1>
          <p className="muted">What you have already completed.</p>
        </div>
        <Segmented label="Filter history" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No completed activities yet."
          text="Complete a task or curriculum topic and your activity will appear here."
        />
      ) : (
        groups.map((group) => (
          <section key={group.date} className="card history-group">
            <h2 className="card-title">{getRelativeDateLabel(group.date, today)}</h2>
            <ul className="history-list">
              {group.items.map((item) => (
                <HistoryItem key={item.key} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}

// ===== components/Workspace/Profile.jsx =====
function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("") || "?";
}

// Prototype profile: stored in this browser only. There is no real account yet.
function Profile({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");

  function startEditing() {
    setDraft(profile);
    setError("");
    setEditing(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    onSave({
      name: draft.name.trim(),
      bio: draft.bio.trim(),
      learningFocus: draft.learningFocus.trim(),
    });
    setEditing(false);
  }

  return (
    <>
      <section className="card">
        <div className="row">
          <h2 className="card-title">Profile</h2>
          {!editing && (
            <button type="button" className="btn btn-ghost" onClick={startEditing}>Edit profile</button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="p-name">Name <span className="req" aria-hidden="true">*</span></label>
              <input
                id="p-name"
                type="text"
                autoFocus
                value={draft.name}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "p-name-error" : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setError("");
                }}
              />
              {error && <p className="error" id="p-name-error">{error}</p>}
            </div>
            <div className="field">
              <label htmlFor="p-focus">Learning focus</label>
              <input
                id="p-focus"
                type="text"
                value={draft.learningFocus}
                onChange={(event) => setDraft({ ...draft, learningFocus: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="p-bio">Short bio</label>
              <textarea
                id="p-bio"
                rows={3}
                value={draft.bio}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save profile</button>
            </div>
          </form>
        ) : (
          <div className="profile">
            <span className="avatar lg" aria-hidden="true">{getInitials(profile.name)}</span>
            <div>
              <p className="profile-title">{profile.name}</p>
              {profile.bio && <p className="muted">{profile.bio}</p>}
              <dl className="details">
                <div><dt>Learning focus</dt><dd>{profile.learningFocus || "Not set"}</dd></div>
                <div><dt>Email</dt><dd>Not connected yet</dd></div>
                <div><dt>Member since</dt><dd>Local prototype</dd></div>
              </dl>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Account</h2>
        <dl className="details">
          <div><dt>Google account</dt><dd>Not connected</dd></div>
        </dl>
        <p className="muted small">
          Authentication will be added in a future version. Until then, your data stays in this browser only.
        </p>
      </section>
    </>
  );
}

// ===== components/Workspace/ProductivityOverview.jsx =====
function ProductivityOverview({ tasks, curriculum }) {
  const taskProgress = calcProgress(getCompletedTasks(tasks).length, tasks.length);
  const curriculumProgress = getCurriculumProgress(curriculum);

  return (
    <section className="card">
      <h2 className="card-title">Productivity overview</h2>
      <TaskStats tasks={tasks} />

      <div className="meter">
        <div className="row">
          <p>Task completion</p>
          <p className="percent">{taskProgress.percent}%</p>
        </div>
        <ProgressBar percent={taskProgress.percent} label="Task completion" />
        <p className="muted small">{taskProgress.completed} / {taskProgress.total} tasks completed</p>
      </div>

      <div className="meter">
        <div className="row">
          <p>Curriculum progress{curriculum ? `: ${curriculum.name}` : ""}</p>
          <p className="percent">{curriculumProgress.percent}%</p>
        </div>
        <ProgressBar percent={curriculumProgress.percent} label="Curriculum progress" />
        <p className="muted small">
          {curriculum
            ? `${curriculumProgress.completed} / ${curriculumProgress.total} topics completed`
            : "No curriculum yet."}
        </p>
      </div>
    </section>
  );
}

// ===== pages/Dashboard.jsx =====
function Dashboard({ tasks, curriculum, today, taskActions, onAddTask, onNavigate }) {
  const todayTasks = getTasksForDate(tasks, today);
  const upcoming = getUpcomingTasks(tasks, today).slice(0, 5);
  const recent = getHistoryItems(tasks, curriculum).slice(0, 4);
  const progress = getCurriculumProgress(curriculum);

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <h1>{getGreeting()}</h1>
          <p className="muted">{formatWeekdayLong(today)}. Here is your overview.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onAddTask()}>
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      <TaskStats tasks={tasks} />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          text="Start planning your day by adding your first task."
          actionLabel="Add task"
          onAction={() => onAddTask()}
        />
      ) : (
        <div className="grid-2">
          <div className="stack">
            <section className="card">
              <h2 className="card-title">Today's tasks</h2>
              <TaskList
                tasks={todayTasks}
                curriculum={curriculum}
                actions={taskActions}
                empty={<EmptyState title="No tasks scheduled for today." text="You're all caught up!" />}
              />
            </section>

            <section className="card">
              <h2 className="card-title">Upcoming</h2>
              <TaskList
                tasks={upcoming}
                curriculum={curriculum}
                actions={taskActions}
                compact
                empty={<p className="muted">Nothing coming up yet.</p>}
              />
            </section>
          </div>

          <div className="stack">
            <section className="card">
              <h2 className="card-title">Curriculum progress</h2>
              {curriculum ? (
                <>
                  <div className="row">
                    <p>{curriculum.name}</p>
                    <span className="percent">{progress.percent}%</span>
                  </div>
                  <ProgressBar percent={progress.percent} label="Curriculum progress" />
                  <p className="muted small">{progress.completed} / {progress.total} topics completed</p>
                  <button type="button" className="btn btn-link" onClick={() => onNavigate("curriculum")}>
                    Open curriculum
                  </button>
                </>
              ) : (
                <>
                  <p className="muted">Create a learning plan and track your progress.</p>
                  <button type="button" className="btn btn-link" onClick={() => onNavigate("curriculum")}>
                    Build your curriculum
                  </button>
                </>
              )}
            </section>

            <section className="card">
              <h2 className="card-title">Recent activity</h2>
              {recent.length === 0 ? (
                <p className="muted">No completed activities yet.</p>
              ) : (
                <ul className="history-list">
                  {recent.map((item) => (
                    <HistoryItem key={item.key} item={item} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== pages/TasksPage.jsx =====
function TasksPage({ tasks, curriculum, taskActions, onAddTask }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Derived data: search -> status -> priority -> sort. The original array is untouched.
  const visibleTasks = sortTasks(filterTasks(tasks, search, status, priority), sortBy);

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <h1>Tasks</h1>
          <p className="muted">Showing {visibleTasks.length} of {tasks.length}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onAddTask()}>
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="You're all clear."
          text="Create your first task to get started."
          actionLabel="Add task"
          onAction={() => onAddTask()}
        />
      ) : (
        <>
          <div className="card toolbar">
            <SearchBar value={search} onChange={setSearch} />
            <TaskFilters
              status={status}
              priority={priority}
              sortBy={sortBy}
              onStatus={setStatus}
              onPriority={setPriority}
              onSort={setSortBy}
            />
          </div>
          <TaskList
            tasks={visibleTasks}
            curriculum={curriculum}
            actions={taskActions}
            empty={<EmptyState title="No tasks found." text="Try changing your search or filters." />}
          />
        </>
      )}
    </div>
  );
}

// ===== pages/CalendarPage.jsx =====
function CalendarPage({ tasks, curriculum, today, taskActions, onAddTask }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Calendar</h1>
        <p className="muted">What do you have to do on each date?</p>
      </div>
      <Calendar tasks={tasks} curriculum={curriculum} today={today} taskActions={taskActions} onAddTask={onAddTask} />
    </div>
  );
}

// ===== pages/CurriculumPage.jsx =====
function CurriculumPage({ curriculum, tasks, curriculumActions }) {
  return (
    <div className="page">
      <Curriculum curriculum={curriculum} tasks={tasks} actions={curriculumActions} />
    </div>
  );
}

// ===== pages/HistoryPage.jsx =====
function HistoryPage({ tasks, curriculum, today }) {
  return (
    <div className="page">
      <History tasks={tasks} curriculum={curriculum} today={today} />
    </div>
  );
}

// ===== pages/WorkspacePage.jsx =====
function WorkspacePage({ profile, tasks, curriculum, onSaveProfile }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>My Workspace</h1>
        <p className="muted">Who you are, what you are learning, and how you are progressing.</p>
      </div>
      <div className="grid-2">
        <div className="stack">
          <Profile profile={profile} onSave={onSaveProfile} />
        </div>
        <div className="stack">
          <ProductivityOverview tasks={tasks} curriculum={curriculum} />
        </div>
      </div>
    </div>
  );
}

// ===== App.jsx =====
// App owns ALL shared state (tasks, curriculum, profile). Pages only receive props.
// Later, each setX call here can become an API request for the signed-in user.
export default function App() {
  const [tasks, setTasks] = useLocalStorage("taskly.tasks", () => createSampleData().tasks);
  const [curriculum, setCurriculum] = useLocalStorage("taskly.curriculum", () => createSampleData().curriculum);
  const [profile, setProfile] = useLocalStorage("taskly.profile", () => createSampleData().profile);

  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(null); // null or { task, defaults }
  const [confirm, setConfirm] = useState(null); // null or { title, message, onConfirm }

  const today = getToday();

  function navigate(pageId) {
    setPage(pageId);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }

  function askConfirm(options) {
    setConfirm(options);
  }

  // ---------- Tasks ----------
  function saveTask(data) {
    const existing = tasks.find((task) => task.id === data.id);
    const id = existing ? existing.id : makeId();
    const saved = {
      ...data,
      id,
      completed: existing ? existing.completed : false,
      completedAt: existing ? existing.completedAt : null,
    };

    setTasks((current) => {
      // A topic can only point to one task, so release it from any other task
      const released = current.map((task) =>
        saved.topicId && task.id !== id && task.topicId === saved.topicId ? { ...task, topicId: null } : task
      );
      return existing
        ? released.map((task) => (task.id === id ? saved : task))
        : [saved, ...released];
    });
    setCurriculum((current) => (current ? linkTaskToTopic(current, id, saved.topicId) : current));
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, completedAt: task.completed ? null : nowLocalISO() }
          : task
      )
    );
  }

  function requestDeleteTask(task) {
    askConfirm({
      title: "Delete this task?",
      message: `"${task.title}" will be removed from Tasks, Calendar and History.`,
      onConfirm: () => {
        setTasks((current) => current.filter((item) => item.id !== task.id));
        setCurriculum((current) => (current ? unlinkTask(current, task.id) : current));
      },
    });
  }

  const taskActions = {
    onToggle: toggleTask,
    onEdit: (task) => setTaskForm({ task, defaults: {} }),
    onDelete: requestDeleteTask,
  };

  const openAddTask = (defaults = {}) => setTaskForm({ task: null, defaults });

  // ---------- Curriculum ----------
  function clearTopicLinks(topicIds) {
    setTasks((current) => current.map((task) => (topicIds.includes(task.topicId) ? { ...task, topicId: null } : task)));
  }

  const curriculumActions = {
    onCreate: ({ name, description }) =>
      setCurriculum({ id: makeId(), name, description, subjects: [] }),

    onDelete: () =>
      askConfirm({
        title: "Delete this curriculum?",
        message: "All subjects and topics will be removed. Your tasks stay, but lose their topic link.",
        onConfirm: () => {
          setTasks((current) => current.map((task) => ({ ...task, topicId: null })));
          setCurriculum(null);
        },
      }),

    onAddSubject: (name) =>
      setCurriculum((current) => ({
        ...current,
        subjects: [...current.subjects, { id: makeId(), name, topics: [] }],
      })),

    onDeleteSubject: (subject) =>
      askConfirm({
        title: "Delete this subject?",
        message: `"${subject.name}" and its ${subject.topics.length} topics will be removed.`,
        onConfirm: () => {
          clearTopicLinks(subject.topics.map((topic) => topic.id));
          setCurriculum((current) => ({
            ...current,
            subjects: current.subjects.filter((item) => item.id !== subject.id),
          }));
        },
      }),

    onAddTopic: (subjectId, name) =>
      setCurriculum((current) => ({
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                topics: [
                  ...subject.topics,
                  { id: makeId(), name, completed: false, completedAt: null, scheduledTaskId: null },
                ],
              }
            : subject
        ),
      })),

    onDeleteTopic: (topic) =>
      askConfirm({
        title: "Delete this topic?",
        message: `"${topic.name}" will be removed from your curriculum.`,
        onConfirm: () => {
          clearTopicLinks([topic.id]);
          setCurriculum((current) => ({
            ...current,
            subjects: current.subjects.map((subject) => ({
              ...subject,
              topics: subject.topics.filter((item) => item.id !== topic.id),
            })),
          }));
        },
      }),

    // Completing a topic is controlled only by this checkbox, not by its task
    onToggleTopic: (topicId) =>
      setCurriculum((current) =>
        mapTopics(current, (topic) =>
          topic.id === topicId
            ? { ...topic, completed: !topic.completed, completedAt: topic.completed ? null : nowLocalISO() }
            : topic
        )
      ),

    onScheduleTopic: (topic) => openAddTask({ topicId: topic.id, title: topic.name }),
  };

  // ---------- Rendering ----------
  const pageLabel = PAGES.find((item) => item.id === page).label;

  function renderPage() {
    switch (page) {
      case "tasks":
        return <TasksPage tasks={tasks} curriculum={curriculum} taskActions={taskActions} onAddTask={openAddTask} />;
      case "calendar":
        return <CalendarPage tasks={tasks} curriculum={curriculum} today={today} taskActions={taskActions} onAddTask={openAddTask} />;
      case "curriculum":
        return <CurriculumPage curriculum={curriculum} tasks={tasks} curriculumActions={curriculumActions} />;
      case "history":
        return <HistoryPage tasks={tasks} curriculum={curriculum} today={today} />;
      case "workspace":
        return <WorkspacePage profile={profile} tasks={tasks} curriculum={curriculum} onSaveProfile={setProfile} />;
      default:
        return (
          <Dashboard
            tasks={tasks}
            curriculum={curriculum}
            today={today}
            taskActions={taskActions}
            onAddTask={openAddTask}
            onNavigate={navigate}
          />
        );
    }
  }

  return (
    <div className="app">
      <style>{CSS}</style>
      <Sidebar page={page} open={menuOpen} onNavigate={navigate} onClose={() => setMenuOpen(false)} />
      <div className="main">
        <Header
          profile={profile}
          pageLabel={pageLabel}
          onMenu={() => setMenuOpen(true)}
          onProfile={() => navigate("workspace")}
        />
        <main>{renderPage()}</main>
      </div>

      {taskForm && (
        <TaskForm
          task={taskForm.task}
          defaults={taskForm.defaults}
          curriculum={curriculum}
          today={today}
          onSave={(data) => {
            saveTask(data);
            setTaskForm(null);
          }}
          onCancel={() => setTaskForm(null)}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

// ===== Styles (from index.css) =====
const CSS = `
/* ---------- Design tokens ---------- */
:root {
  --bg: #F7F8FA;
  --card: #FFFFFF;
  --text: #172033;
  --muted: #667085;
  --blue: #4F7CFF;
  --blue-hover: #3F68E8;
  --blue-soft: #EEF3FF;
  --mint: #DDF5E9;
  --green: #238B57;
  --border: #E6E9EF;
  /* Priority tints (only used for the priority labels and calendar markers) */
  --high-bg: #FDECEA; --high-text: #B42318;
  --med-bg: #FFF3E0; --med-text: #A04A00;
  --low-bg: #F2F4F7; --low-text: #475467;
  --radius: 12px;
  --shadow: 0 1px 2px rgba(23, 32, 51, 0.05);
}

/* ---------- Base ---------- */
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.5;
}
h1, h2, h3, p, dl, dd, ul { margin: 0; }
ul { padding: 0; list-style: none; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
h2, h3 { font-weight: 600; }
.muted { color: var(--muted); }
.small { font-size: 13px; }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* ---------- Layout ---------- */
.sidebar {
  position: fixed; inset: 0 auto 0 0; width: 240px; z-index: 30;
  background: var(--card); border-right: 1px solid var(--border);
  padding: 20px 14px; display: flex; flex-direction: column; gap: 20px;
  transition: transform 0.2s ease, visibility 0.2s;
}
.brand { display: flex; flex-direction: column; padding: 0 8px; }
.brand-name { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
.brand-tag { font-size: 12px; color: var(--muted); }
.nav-list { display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border: 0; border-radius: 8px; background: transparent;
  color: var(--muted); font-weight: 500; text-align: left;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover { background: var(--bg); color: var(--text); }
.nav-item.active { background: var(--blue-soft); color: var(--blue-hover); font-weight: 600; }
.sidebar-foot { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border); }
.scrim { position: fixed; inset: 0; z-index: 20; border: 0; background: rgba(23, 32, 51, 0.35); }

.main { margin-left: 240px; min-width: 0; }
.header {
  position: sticky; top: 0; z-index: 10; height: 60px; padding: 0 24px;
  display: flex; align-items: center; gap: 12px;
  background: var(--bg); border-bottom: 1px solid var(--border);
}
.header-brand { display: none; font-weight: 700; font-size: 18px; }
.header-page { font-weight: 600; color: var(--muted); }
.menu-btn { display: none; }
.profile-btn {
  margin-left: auto; display: flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px; border: 1px solid var(--border); border-radius: 999px; background: var(--card);
}
.profile-btn:hover { border-color: var(--blue); }
.profile-name { font-weight: 500; font-size: 14px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.page { max-width: 1080px; margin: 0 auto; padding: 28px 24px 64px; display: flex; flex-direction: column; gap: 20px; }
.page-head { display: flex; flex-direction: column; gap: 2px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.row.tight { gap: 6px; flex-wrap: nowrap; }
.stack { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.grid-2 { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.narrow { max-width: 520px; }

/* ---------- Cards, buttons ---------- */
.card {
  background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 20px; display: flex; flex-direction: column; gap: 14px; min-width: 0;
}
.card-title { font-size: 16px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid transparent;
  font-weight: 600; font-size: 14px; transition: background 0.15s, border-color 0.15s;
}
.btn-primary { background: var(--blue); color: #fff; }
.btn-primary:hover { background: var(--blue-hover); }
.btn-ghost { background: var(--card); border-color: var(--border); }
.btn-ghost:hover { background: var(--bg); }
.btn-danger { background: #B42318; color: #fff; }
.btn-danger:hover { background: #912018; }
.btn-link { background: transparent; color: var(--blue-hover); padding: 0 6px; min-height: 36px; align-self: flex-start; }
.btn-link:hover { text-decoration: underline; }
.danger-text { color: var(--high-text); }
.icon-btn {
  display: inline-grid; place-items: center; width: 36px; height: 36px; flex: none;
  border: 0; border-radius: 8px; background: transparent; color: var(--muted);
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: var(--bg); color: var(--text); }
.icon-btn.danger:hover { background: var(--high-bg); color: var(--high-text); }
.avatar {
  display: grid; place-items: center; border-radius: 50%; flex: none;
  background: var(--blue-soft); color: var(--blue-hover); font-weight: 700;
}
.avatar.sm { width: 30px; height: 30px; font-size: 13px; }
.avatar.lg { width: 64px; height: 64px; font-size: 22px; }

/* ---------- Stats, progress ---------- */
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.stat { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 18px; }
.stat.done { background: var(--mint); border-color: var(--mint); }
.stat-label { color: var(--muted); font-size: 13px; }
.stat.done .stat-label { color: var(--green); }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.progress { height: 8px; border-radius: 999px; background: var(--border); overflow: hidden; }
.progress-fill { height: 100%; background: var(--blue); border-radius: 999px; transition: width 0.4s ease; }
.percent { font-weight: 700; }
.percent.big { font-size: 22px; }
.meter { display: flex; flex-direction: column; gap: 8px; }

/* ---------- Tasks ---------- */
.task-list { display: flex; flex-direction: column; gap: 10px; }
.task {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px;
  background: var(--card); border: 1px solid var(--border); border-radius: 10px;
  animation: rise 0.18s ease;
}
.card .task { background: var(--bg); }
.task.is-done .task-title { text-decoration: line-through; color: var(--muted); }
.task.is-done { opacity: 0.85; }
.task-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.task-title { font-weight: 600; overflow-wrap: anywhere; }
.task-desc { color: var(--muted); font-size: 14px; overflow-wrap: anywhere; }
.task-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; color: var(--muted); font-size: 13px; }
.task-actions { display: flex; flex: none; }
.pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.pill.p-high { background: var(--high-bg); color: var(--high-text); }
.pill.p-medium { background: var(--med-bg); color: var(--med-text); }
.pill.p-low { background: var(--low-bg); color: var(--low-text); }
.pill.p-done { background: var(--mint); color: var(--green); }
.pill.p-topic { background: var(--blue-soft); color: var(--blue-hover); }

/* Custom checkbox (the real input stays focusable) */
.check { position: relative; display: inline-flex; flex: none; margin-top: 2px; }
.check input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.check-box {
  width: 22px; height: 22px; display: grid; place-items: center; border-radius: 6px;
  border: 2px solid #C5CBD6; background: var(--card); color: transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.check input:checked + .check-box { background: var(--green); border-color: var(--green); color: #fff; }
.check input:focus-visible + .check-box { outline: 2px solid var(--blue); outline-offset: 2px; }

/* ---------- Toolbar, forms ---------- */
.toolbar { gap: 12px; }
.search { position: relative; display: flex; align-items: center; color: var(--muted); }
.search svg { position: absolute; left: 12px; }
.search input { padding-left: 36px; }
.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.select-field { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--muted); }
.segmented { display: inline-flex; padding: 3px; border: 1px solid var(--border); border-radius: 10px; background: var(--card); }
.segmented button { border: 0; background: transparent; padding: 6px 14px; border-radius: 7px; font-weight: 500; font-size: 14px; color: var(--muted); }
.segmented button.active { background: var(--blue-soft); color: var(--blue-hover); font-weight: 600; }

input[type="text"], input[type="search"], input[type="date"], input[type="time"], select, textarea {
  width: 100%; min-height: 40px; padding: 8px 12px; background: var(--card);
  border: 1px solid var(--border); border-radius: 8px;
}
textarea { resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: var(--blue); outline: 2px solid var(--blue-soft); }
[aria-invalid="true"] { border-color: var(--high-text); }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.field label { font-size: 14px; font-weight: 500; }
.req { color: var(--high-text); }
.error { color: var(--high-text); font-size: 13px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 14px; }
.toggle { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-weight: 500; }
.toggle input { width: 18px; height: 18px; accent-color: var(--blue); }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.inline-add-row { display: flex; gap: 8px; }
.inline-add .error { margin-top: 4px; }

/* ---------- Modal ---------- */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 50; padding: 16px; overflow-y: auto;
  background: rgba(23, 32, 51, 0.4); display: flex; align-items: flex-start; justify-content: center;
  animation: fade 0.15s ease;
}
.modal {
  width: 100%; max-width: 520px; margin: 5vh 0; padding: 22px;
  background: var(--card); border-radius: 14px; box-shadow: 0 12px 32px rgba(23, 32, 51, 0.18);
  animation: rise 0.18s ease;
}
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.modal-head h2 { font-size: 18px; }

/* ---------- Empty states ---------- */
.empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
  padding: 36px 20px; border: 1px dashed var(--border); border-radius: var(--radius); background: var(--card);
}
.empty h3 { font-size: 16px; }
.empty .btn { margin-top: 10px; }
.card .empty { background: transparent; padding: 24px 12px; }

/* ---------- Calendar ---------- */
.cal-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.cal-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cal-controls { display: flex; align-items: center; gap: 4px; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; font-size: 12px; font-weight: 600; color: var(--muted); }
.cal-grid {
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 1px;
  background: var(--border); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
}
.cal-day {
  min-height: 92px; padding: 6px; border: 0; border-radius: 0; background: var(--card);
  display: flex; flex-direction: column; align-items: stretch; gap: 4px; text-align: left; min-width: 0;
  transition: background 0.12s;
}
.cal-day:hover { background: var(--bg); }
.cal-day.outside { background: #FBFBFC; color: #98A2B3; }
.cal-day.selected { box-shadow: inset 0 0 0 2px var(--blue); position: relative; }
.cal-num { width: 24px; height: 24px; display: grid; place-items: center; font-size: 13px; font-weight: 600; }
.cal-day.today .cal-num { background: var(--blue); color: #fff; border-radius: 50%; }
.cal-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cal-task { display: block; padding: 1px 5px; border-radius: 4px; font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cal-task.p-high { background: var(--high-bg); color: var(--high-text); }
.cal-task.p-medium { background: var(--med-bg); color: var(--med-text); }
.cal-task.p-low { background: var(--low-bg); color: var(--low-text); }
.cal-task.done { text-decoration: line-through; opacity: 0.7; }
.cal-more { font-size: 11px; color: var(--muted); padding-left: 5px; }
.cal-dots { display: none; gap: 3px; justify-content: center; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--low-text); }
.dot.p-high { background: var(--high-text); }
.dot.p-medium { background: var(--med-text); }

/* ---------- Curriculum ---------- */
.overall .row { align-items: baseline; }
.subject { gap: 12px; }
.topic-list { display: flex; flex-direction: column; }
.topic { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--border); }
.topic .check { margin-top: 0; }
.topic-body { flex: 1; min-width: 0; }
.topic-name { font-weight: 500; overflow-wrap: anywhere; }
.topic.is-done .topic-name { color: var(--muted); text-decoration: line-through; }
.topic-status { font-size: 13px; color: var(--muted); }
.topic-status.scheduled { color: var(--blue-hover); }
.add-subject { margin-top: -4px; }

/* ---------- History, profile ---------- */
.history-list { display: flex; flex-direction: column; }
.history-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--border); }
.history-item:first-child { border-top: 0; }
.history-check { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--mint); color: var(--green); flex: none; }
.history-text { flex: 1; min-width: 0; }
.history-title { font-weight: 500; overflow-wrap: anywhere; }
.profile { display: flex; gap: 16px; align-items: flex-start; }
.profile-title { font-size: 18px; font-weight: 700; }
.details { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.details div { display: flex; gap: 8px; flex-wrap: wrap; }
.details dt { color: var(--muted); min-width: 120px; }
.details dd { font-weight: 500; }

/* ---------- Motion ---------- */
@keyframes rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); visibility: hidden; }
  .sidebar.open { transform: none; visibility: visible; box-shadow: 0 0 32px rgba(23, 32, 51, 0.2); }
  .main { margin-left: 0; }
  .menu-btn { display: inline-grid; margin-left: -8px; }
  .header { padding: 0 16px; }
  .header-brand { display: inline; }
  .header-page { display: none; }
  .page { padding: 20px 16px 48px; }
  .grid-2, .cal-layout { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .form-grid { grid-template-columns: minmax(0, 1fr); }
  .profile-name { display: none; }
  .profile-btn { padding: 4px; }
  .stat { padding: 12px; }
  .stat-value { font-size: 24px; }
  .card { padding: 16px; }
  .filters > * { flex: 1 1 100%; }
  .segmented { display: flex; }
  .segmented button { flex: 1; }
  .cal-day { min-height: 52px; align-items: center; padding: 4px 2px; }
  .cal-titles { display: none; }
  .cal-dots { display: flex; min-height: 6px; }
  .inline-add-row { flex-wrap: wrap; }
  .inline-add-row input { flex: 1 1 100%; }
  .profile { flex-direction: column; }
  .details dt { min-width: 100px; }
  .btn { min-height: 44px; }
  .form-actions .btn { flex: 1; }
}
`;
