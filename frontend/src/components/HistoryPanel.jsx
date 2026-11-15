import { useEffect } from "react";

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

// Bootstrap offcanvas markup, shown/hidden with React state
export default function HistoryPanel({ show, onClose, history, onReuse, onClear }) {
  // Close with the Escape key
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="offcanvas-backdrop fade show" onClick={onClose}></div>
      <aside
        className="offcanvas offcanvas-end show"
        style={{ visibility: "visible" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <div className="offcanvas-header border-bottom">
          <h2 className="offcanvas-title h5" id="history-title">Bullet history</h2>
          <button type="button" className="btn-close" aria-label="Close history" onClick={onClose}></button>
        </div>

        <div className="offcanvas-body">
          {history.length === 0 ? (
            <p className="text-secondary">
              Nothing here yet. Your last 20 improved bullets will be saved on this device.
            </p>
          ) : (
            <>
              <button className="btn btn-outline-danger btn-sm mb-3" onClick={onClear}>
                Clear history
              </button>
              <ul className="list-unstyled mb-0">
                {history.map((item) => (
                  <li className="card history-item mb-2" key={item.id}>
                    <div className="card-body p-3">
                      <p className="mb-1 small">{item.original}</p>
                      <p className="mb-2 small text-secondary">
                        {item.role} / {item.tone} / {formatTime(item.timestamp)}
                      </p>
                      <button
                        className="btn btn-sm btn-outline-accent"
                        onClick={() => {
                          onReuse(item);
                          onClose();
                        }}
                      >
                        Reuse
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
