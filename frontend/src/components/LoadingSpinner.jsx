export default function LoadingSpinner({ label = "Working on it..." }) {
  return (
    <div className="d-flex align-items-center gap-2 py-3 text-secondary" role="status">
      <div className="spinner-border spinner-border-sm accent-text" aria-hidden="true"></div>
      <span>{label}</span>
    </div>
  );
}
