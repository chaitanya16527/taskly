import { getCompletedTasks, getPendingTasks } from "../utils/taskUtils";

export default function TaskStats({ tasks }) {
  const stats = [
    { label: "Total", value: tasks.length },
    { label: "Completed", value: getCompletedTasks(tasks).length, tone: "done" },
    { label: "Pending", value: getPendingTasks(tasks).length },
  ];

  return (
    <section className="stats" aria-label="Task statistics">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat ${stat.tone || ""}`}>
          <p className="stat-label">{stat.label}</p>
          <p className="stat-value">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
