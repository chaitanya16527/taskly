import Icon from "./Icon";

export default function Header({ profile, pageLabel, onMenu, onProfile }) {
  const initial = (profile.name.trim()[0] || "?").toUpperCase();

  return (
    <header className="header">
      <button type="button" className="icon-btn menu-btn" aria-label="Open navigation menu" onClick={onMenu}>
        <Icon name="menu" />
      </button>
      <span className="header-brand">Taskly</span>
      <span className="header-page">{pageLabel}</span>
      <button type="button" className="profile-btn" aria-label="Open my workspace" onClick={onProfile}>
        <span className="avatar sm" aria-hidden="true">{initial}</span>
        <span className="profile-name">{profile.name}</span>
      </button>
    </header>
  );
}
