# Taskly

**Plan it. Do it. Done.**

## About

Taskly is a productivity and curriculum-planning app. You can manage tasks, see them on a calendar, build your own learning curriculum, and schedule curriculum topics as tasks. Completed work shows up in History, and a personal workspace summarises your progress.

> **Frontend prototype.** There is no authentication, backend or database yet. Data is kept in React state and saved to this browser's `localStorage` as temporary persistence. It is not private, not secure, and not shared between devices or users.

## Features

- Task management: add, edit, delete, complete and un-complete
- Date-range scheduling with optional start and end times
- Priority levels (Low, Medium, High)
- Search, status and priority filters, and sorting on the Tasks page
- Monthly calendar with month navigation, selected-date task list and add-task from any date
- Curriculum planning: subjects, topics, per-subject and overall progress
- Curriculum-to-task connection ("Schedule topic")
- History grouped by date, filterable by tasks or curriculum
- Personal workspace: editable prototype profile and productivity overview
- Inline validation, delete confirmations, responsive layout, keyboard-friendly controls

## Technology

React 18, Vite, JavaScript (JSX), plain CSS. No other runtime dependencies.

## Install and run

```bash
npm install
npm run dev      # development server, usually http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Folder structure

```text
src/
├── App.jsx                 # owns all shared state (tasks, curriculum, profile)
├── main.jsx
├── index.css               # design tokens and all styles
├── data/sampleData.js      # first-launch sample data (easy to replace)
├── utils/
│   ├── dateUtils.js        # YYYY-MM-DD helpers, calendar grid
│   ├── taskUtils.js        # filtering, sorting, date-range logic, history
│   ├── curriculumUtils.js  # progress and topic-task linking
│   └── useLocalStorage.js  # temporary browser persistence
├── pages/                  # Dashboard, Tasks, Calendar, Curriculum, History, Workspace
└── components/             # Header, Sidebar, Task*, Modal, Calendar/, Curriculum/, History/, Workspace/
```

## Current architecture

`App` holds `tasks`, `curriculum` and `profile`. Pages receive data and callback functions as props, so every screen reads the same single source of truth.

## Resetting data

Open your browser's developer tools, clear the `taskly.tasks`, `taskly.curriculum` and `taskly.profile` keys in Local Storage, and reload.

## Future development

```text
Phase 2
- Google Authentication
- Backend API
- Database
- User-specific storage
- Secure authorization

Phase 3
- Notifications
- Advanced analytics
- Additional productivity features
```

Authentication, backend, database and real multi-user storage are planned for a future phase.
