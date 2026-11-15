export default function ErrorAlert({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="alert alert-danger alert-dismissible mb-3" role="alert">
      {message}
      <button type="button" className="btn-close" aria-label="Dismiss error" onClick={onClose}></button>
    </div>
  );
}
