import { useState } from "react";
import HistoryItem from "./HistoryItem";
import Segmented from "../Segmented";
import EmptyState from "../EmptyState";
import { getHistoryItems } from "../../utils/taskUtils";
import { getDatePart, getRelativeDateLabel } from "../../utils/dateUtils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "task", label: "Tasks" },
  { value: "curriculum", label: "Curriculum" },
];

export default function History({ tasks, curriculum, today }) {
  const [filter, setFilter] = useState("all");

  const items = getHistoryItems(tasks, curriculum).filter((item) => filter === "all" || item.type === filter);

  // Group items by the date they were completed (items are already newest first)
  const groups = [];
  items.forEach((item) => {
    const date = getDatePart(item.completedAt);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  });

  return (
    <>
      <div className="page-head row">
        <div>
          <h1>History</h1>
          <p className="muted">What you have already completed.</p>
        </div>
        <Segmented label="Filter history" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No completed activities yet."
          text="Complete a task or curriculum topic and your activity will appear here."
        />
      ) : (
        groups.map((group) => (
          <section key={group.date} className="card history-group">
            <h2 className="card-title">{getRelativeDateLabel(group.date, today)}</h2>
            <ul className="history-list">
              {group.items.map((item) => (
                <HistoryItem key={item.key} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
