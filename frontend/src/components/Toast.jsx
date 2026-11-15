import { useEffect } from "react";

// Small message in the corner that disappears after 2.5 seconds
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 2500);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3">
      <div className="toast show align-items-center" role="status" aria-live="polite">
        <div className="d-flex">
          <div className="toast-body">{toast.text}</div>
          <button type="button" className="btn-close me-2 m-auto" aria-label="Close message" onClick={onClose}></button>
        </div>
      </div>
    </div>
  );
}
