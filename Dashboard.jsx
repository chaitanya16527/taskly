import Icon from "../components/Icon";
import TaskStats from "../components/TaskStats";
import TaskList from "../components/TaskList";
import EmptyState from "../components/EmptyState";
import ProgressBar from "../components/ProgressBar";
import HistoryItem from "../components/History/HistoryItem";
import { getGreeting, formatWeekdayLong } from "../utils/dateUtils";
import { getTasksForDate, getUpcomingTasks, getHistoryItems } from "../utils/taskUtils";
import { getCurriculumProgress } from "../utils/curriculumUtils";

export default function Dashboard({ tasks, curriculum, today, taskActions, onAddTask, onNavigate }) {
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
