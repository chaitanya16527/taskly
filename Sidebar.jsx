import Icon from "./Icon";

export const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "curriculum", label: "Curriculum", icon: "curriculum" },
  { id: "history", label: "History", icon: "history" },
  { id: "workspace", label: "My Workspace", icon: "user" },
];

export default function Sidebar({ page, open, onNavigate, onClose }) {
  const renderItem = (item) => (
    <li key={item.id}>
      <button
        type="button"
        className={`nav-item${page === item.id ? " active" : ""}`}
        aria-current={page === item.id ? "page" : undefined}
        onClick={() => onNavigate(item.id)}
      >
        <Icon name={item.icon} />
        {item.label}
      </button>
    </li>
  );

  return (
    <>
      {open && <button type="button" className="scrim" aria-label="Close navigation menu" onClick={onClose} />}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          <span className="brand-name">Taskly</span>
          <span className="brand-tag">Plan it. Do it. Done.</span>
        </div>
        <nav aria-label="Main navigation">
          <ul className="nav-list">{PAGES.slice(0, 5).map(renderItem)}</ul>
        </nav>
        <div className="sidebar-foot">
          <ul className="nav-list">{renderItem(PAGES[5])}</ul>
        </div>
      </aside>
    </>
  );
}
