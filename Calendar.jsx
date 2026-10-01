import { useState } from "react";
import Icon from "../Icon";
import SelectedDateTasks from "./SelectedDateTasks";
import { getMonthGrid, getMonthName, shiftMonth, parseDate, formatLong } from "../../utils/dateUtils";
import { getTasksForDate } from "../../utils/taskUtils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar({ tasks, curriculum, today, taskActions, onAddTask }) {
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
