import { isDateInRange } from "./dateUtils";

// Task shape:
// { id, title, description, startDate, endDate, hasTime, startTime, endTime,
//   priority, completed, completedAt, topicId }

let idCounter = 0;
export function makeId() {
  idCounter += 1;
  return Date.now() * 1000 + (idCounter % 1000);
}

export const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

// A task belongs to every date from startDate to endDate (inclusive)
export function isTaskOnDate(task, date) {
  return isDateInRange(date, task.startDate, task.endDate);
}

function compareByDate(a, b) {
  if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
  const timeA = a.hasTime ? a.startTime : "99:99";
  const timeB = b.hasTime ? b.startTime : "99:99";
  if (timeA !== timeB) return timeA.localeCompare(timeB);
  return a.title.localeCompare(b.title);
}

export function getTasksForDate(tasks, date) {
  return tasks.filter((task) => isTaskOnDate(task, date)).sort(compareByDate);
}

export const getCompletedTasks = (tasks) => tasks.filter((task) => task.completed);
export const getPendingTasks = (tasks) => tasks.filter((task) => !task.completed);

// Pending tasks that start after today
export function getUpcomingTasks(tasks, today) {
  return tasks.filter((task) => !task.completed && task.startDate > today).sort(compareByDate);
}

export function filterTasks(tasks, search, status, priority) {
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
export function sortTasks(tasks, sortBy) {
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
export function getHistoryItems(tasks, curriculum) {
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
