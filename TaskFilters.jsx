import Segmented from "./Segmented";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

export default function TaskFilters({ status, priority, sortBy, onStatus, onPriority, onSort }) {
  return (
    <div className="filters">
      <Segmented label="Filter by status" options={STATUS_OPTIONS} value={status} onChange={onStatus} />

      <div className="select-field">
        <label htmlFor="filter-priority">Priority</label>
        <select id="filter-priority" value={priority} onChange={(event) => onPriority(event.target.value)}>
          <option value="all">All</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="select-field">
        <label htmlFor="sort-by">Sort</label>
        <select id="sort-by" value={sortBy} onChange={(event) => onSort(event.target.value)}>
          <option value="date">Date</option>
          <option value="priority">Priority</option>
          <option value="recent">Recently added</option>
        </select>
      </div>
    </div>
  );
}
