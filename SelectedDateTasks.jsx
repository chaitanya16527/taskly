import Icon from "../Icon";
import TaskList from "../TaskList";
import EmptyState from "../EmptyState";
import { formatLong } from "../../utils/dateUtils";
import { getTasksForDate } from "../../utils/taskUtils";

export default function SelectedDateTasks({ date, today, tasks, curriculum, taskActions, onAddTask }) {
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
