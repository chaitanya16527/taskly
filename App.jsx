import { useState } from "react";
import Header from "./components/Header";
import Sidebar, { PAGES } from "./components/Sidebar";
import TaskForm from "./components/TaskForm";
import ConfirmModal from "./components/ConfirmModal";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import CurriculumPage from "./pages/CurriculumPage";
import HistoryPage from "./pages/HistoryPage";
import WorkspacePage from "./pages/WorkspacePage";
import useLocalStorage from "./utils/useLocalStorage";
import { createSampleData } from "./data/sampleData";
import { getToday, nowLocalISO } from "./utils/dateUtils";
import { makeId } from "./utils/taskUtils";
import { linkTaskToTopic, unlinkTask, mapTopics } from "./utils/curriculumUtils";

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
