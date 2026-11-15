import Icon from "./Icon.jsx";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "bullets", label: "Bullet Improver", icon: "bullets" },
  { id: "interview", label: "Interview Questions", icon: "interview" },
  { id: "checker", label: "Answer Checker", icon: "checker" },
];

// One dot per request: filled = still available
function UsageDots({ remaining, limit }) {
  return (
    <span className="usage-dots" aria-hidden="true">
      {Array.from({ length: limit }, (_, i) => (
        <span key={i} className={`dot ${remaining !== null && i < remaining ? "on" : ""}`}></span>
      ))}
    </span>
  );
}

export default function Navbar({
  tab,
  onTabChange,
  remaining,
  limit,
  theme,
  onToggleTheme,
  onOpenHistory,
  historyCount,
}) {
  const low = remaining !== null && remaining <= 2;

  return (
    <header className="app-header">
      <div className="container nav-row">
        <button className="brand-btn" onClick={() => onTabChange("home")}>
          <span className="logo-mark"><Icon name="code" size={18} /></span>
          <span className="brand-text">Placement Prep Kit</span>
        </button>

        <ul className="nav nav-pills nav-main" role="tablist">
          {TABS.map((t) => (
            <li className="nav-item" role="presentation" key={t.id}>
              <button
                className={`nav-link ${tab === t.id ? "active" : ""}`}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => onTabChange(t.id)}
              >
                <Icon name={t.icon} size={16} />
                <span>{t.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-tools">
          <UsageDots remaining={remaining} limit={limit} />
          <span className={`badge rounded-pill usage-badge ${low ? "low" : ""}`} aria-live="polite">
            <Icon name="bolt" size={13} />
            Requests left: {remaining ?? "-"}/{limit}
          </span>
          <button className="btn btn-sm btn-soft" onClick={onOpenHistory}>
            <Icon name="history" size={15} />
            <span>History{historyCount > 0 ? ` (${historyCount})` : ""}</span>
          </button>
          <button
            className="btn btn-sm btn-soft"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
            <span className="d-none d-xxl-inline">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
