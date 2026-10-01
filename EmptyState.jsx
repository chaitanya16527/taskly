import Icon from "./Icon";

export default function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {actionLabel && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          <Icon name="plus" size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
