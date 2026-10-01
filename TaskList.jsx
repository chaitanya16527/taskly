import TaskItem from "./TaskItem";
import { getTopicLabel } from "../utils/curriculumUtils";

// `actions` = { onToggle(id), onEdit(task), onDelete(task) }
// `empty` = what to show when there are no tasks
export default function TaskList({ tasks, curriculum, actions, compact = false, empty = null }) {
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
