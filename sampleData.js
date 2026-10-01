import { getToday, addDays } from "../utils/dateUtils";

// Sample data for first launch. Dates are relative to "today" so the demo always looks alive.
// Replace or empty these arrays to start fresh.
export function createSampleData() {
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
