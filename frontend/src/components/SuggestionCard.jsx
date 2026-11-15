import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../copy.js";

export default function SuggestionCard({ suggestion, index, isBest }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    if (!(await copyToClipboard(suggestion.text))) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000); // "Copied!" for 2 seconds
  }

  return (
    <div className={`card suggestion-card mb-3 ${isBest ? "is-best" : ""}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 mb-0">
            Option {index + 1}
            {isBest && <span className="badge accent-badge ms-2">Strongest</span>}
          </h3>
          <span className="badge text-bg-light border">Score {suggestion.score}/10</span>
        </div>

        <p className="mb-2 suggestion-text">{suggestion.text}</p>
        <p className="small text-secondary mb-3">
          <strong>Why this works:</strong> {suggestion.why}
        </p>

        <button
          className="btn btn-sm btn-outline-accent"
          onClick={handleCopy}
          aria-label={`Copy option ${index + 1}`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
