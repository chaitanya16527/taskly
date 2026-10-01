import Icon from "./Icon";
import { formatRange, formatTime } from "../utils/dateUtils";

export default function TaskItem({ task, topicLabel, compact, onToggle, onEdit, onDelete }) {
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
