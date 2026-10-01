import { useState } from "react";
import Icon from "../components/Icon";
import SearchBar from "../components/SearchBar";
import TaskFilters from "../components/TaskFilters";
import TaskList from "../components/TaskList";
import EmptyState from "../components/EmptyState";
import { filterTasks, sortTasks } from "../utils/taskUtils";

export default function TasksPage({ tasks, curriculum, taskActions, onAddTask }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Derived data: search -> status -> priority -> sort. The original array is untouched.
  const visibleTasks = sortTasks(filterTasks(tasks, search, status, priority), sortBy);

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <h1>Tasks</h1>
          <p className="muted">Showing {visibleTasks.length} of {tasks.length}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onAddTask()}>
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="You're all clear."
          text="Create your first task to get started."
          actionLabel="Add task"
          onAction={() => onAddTask()}
        />
      ) : (
        <>
          <div className="card toolbar">
            <SearchBar value={search} onChange={setSearch} />
            <TaskFilters
              status={status}
              priority={priority}
              sortBy={sortBy}
              onStatus={setStatus}
              onPriority={setPriority}
              onSort={setSortBy}
            />
          </div>
          <TaskList
            tasks={visibleTasks}
            curriculum={curriculum}
            actions={taskActions}
            empty={<EmptyState title="No tasks found." text="Try changing your search or filters." />}
          />
        </>
      )}
    </div>
  );
}
