import Icon from "../Icon";
import { formatTimeFromISO } from "../../utils/dateUtils";

export default function HistoryItem({ item }) {
  return (
    <li className="history-item">
      <span className="history-check"><Icon name="check" size={14} /></span>
      <div className="history-text">
        <p className="history-title">{item.title}</p>
        <p className="muted small">{item.detail}</p>
      </div>
      <time className="muted small" dateTime={item.completedAt}>{formatTimeFromISO(item.completedAt)}</time>
    </li>
  );
}
