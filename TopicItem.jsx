import Icon from "../Icon";
import { formatRange } from "../../utils/dateUtils";

// `task` is the connected task (or undefined). A deleted task simply means "Not scheduled".
export default function TopicItem({ topic, task, onToggle, onSchedule, onDelete }) {
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
