export default function ScoreBar({ label, score, muted }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between small mb-1">
        <span>{label}</span>
        <strong>{score}/10</strong>
      </div>
      <div className="progress" style={{ height: "10px" }}>
        <div
          className={`progress-bar ${muted ? "bar-muted" : "bar-accent"}`}
          role="progressbar"
          style={{ width: `${score * 10}%` }}
          aria-label={label}
          aria-valuenow={score}
          aria-valuemin={1}
          aria-valuemax={10}
        ></div>
      </div>
    </div>
  );
}
