import { useEffect, useState } from "react";
import { improveBullet } from "../api.js";
import { copyToClipboard } from "../copy.js";
import SuggestionCard from "./SuggestionCard.jsx";
import ScoreBar from "./ScoreBar.jsx";
import SkeletonCards from "./SkeletonCards.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import ErrorAlert from "./ErrorAlert.jsx";

const ROLES = ["Frontend Developer", "Backend Developer", "Full-Stack Developer", "Data Analyst"];
const TONES = ["Concise", "Impactful", "Technical"];
const EXAMPLES = [
  "Made a website for the college fest",
  "Worked on a REST API for our project",
  "Did analysis of sales data in Excel",
  "Helped in making a chat app",
];
const MAX_LENGTH = 300;

export default function BulletImprover({ reuse, onRemaining, onSave, notify }) {
  const [original, setOriginal] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [tone, setTone] = useState(TONES[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Reuse from History, or "Try this on my own bullet" from the Home screen
  useEffect(() => {
    if (!reuse) return;
    setOriginal(reuse.original);
    if (reuse.role) setRole(reuse.role);
    if (reuse.tone) setTone(reuse.tone);
    if (reuse.suggestions) {
      setResult({ original: reuse.original, originalScore: reuse.originalScore, suggestions: reuse.suggestions });
    }
    setError("");
  }, [reuse]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const text = original.trim();
    if (!text) {
      setError("Paste a resume bullet first, or click one of the examples.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await improveBullet({ original: text, role, tone });
      setResult({ ...data, original: text });
      onRemaining(data.remaining);
      onSave({
        id: crypto.randomUUID?.() ?? String(Date.now()),
        original: text,
        role,
        tone,
        originalScore: data.originalScore,
        suggestions: data.suggestions,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
      if (err.status === 429) onRemaining(0);
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    const text = result.suggestions.map((s, i) => `${i + 1}. ${s.text}`).join("\n");
    notify((await copyToClipboard(text)) ? "Copied all 3 bullets" : "Could not copy. Copy them one by one.");
  }

  const bestScore = result ? Math.max(...result.suggestions.map((s) => s.score)) : 0;
  const bestIndex = result ? result.suggestions.findIndex((s) => s.score === bestScore) : -1;
  const hasPlaceholder = result?.suggestions.some((s) => /\[[^\]]+\]/.test(s.text));

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <form className="card tool-card" onSubmit={handleSubmit}>
          <div className="card-body">
            <h2 className="h5 mb-3">Your bullet point</h2>

            <label htmlFor="bullet-input" className="form-label">Original bullet</label>
            <textarea
              id="bullet-input"
              className="form-control"
              rows={4}
              maxLength={MAX_LENGTH}
              value={original}
              placeholder="e.g. Made a website for the college fest"
              onChange={(e) => setOriginal(e.target.value)}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && handleSubmit(e)}
            />
            <div className="d-flex justify-content-between align-items-start gap-2 mt-1">
              <span className="form-text">Ctrl + Enter to submit</span>
              <span className={`form-text ${original.length >= MAX_LENGTH - 20 ? "text-danger" : ""}`}>
                {original.length}/{MAX_LENGTH}
              </span>
            </div>

            <div className="d-flex flex-wrap gap-2 my-2" aria-label="Example bullets">
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex} className="btn btn-sm btn-outline-secondary rounded-pill chip" onClick={() => setOriginal(ex)}>
                  {ex}
                </button>
              ))}
            </div>

            <label htmlFor="role-select" className="form-label mt-2">Target role</label>
            <select id="role-select" className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>

            <fieldset className="mt-3">
              <legend className="form-label fs-6">Tone</legend>
              <div className="btn-group w-100" role="group">
                {TONES.map((t) => (
                  <span className="flex-fill" key={t}>
                    <input type="radio" className="btn-check" name="tone" id={`tone-${t}`} checked={tone === t} onChange={() => setTone(t)} />
                    <label className="btn btn-outline-accent w-100 rounded-0" htmlFor={`tone-${t}`}>{t}</label>
                  </span>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="btn btn-accent w-100 mt-4" disabled={loading}>
              {loading ? "Improving..." : "Improve my bullet"}
            </button>
          </div>
        </form>
      </div>

      <div className="col-lg-7" aria-live="polite">
        <ErrorAlert message={error} onClose={() => setError("")} />

        {loading && (
          <>
            <LoadingSpinner label="Writing 3 stronger versions..." />
            <SkeletonCards count={3} />
          </>
        )}

        {!loading && !result && (
          <div className="empty-state">
            <p className="h5 mb-1">Your improved bullets will appear here</p>
            <p className="mb-0 text-secondary">Paste a bullet or click an example, then choose a role and tone.</p>
          </div>
        )}

        {!loading && result && (
          <>
            <div className="card tool-card mb-3">
              <div className="card-body">
                <p className="small text-secondary mb-1">Before</p>
                <p className="original-text mb-3">“{result.original}”</p>
                <ScoreBar label="Original bullet strength" score={result.originalScore} muted />
                <ScoreBar label="Best suggestion strength" score={bestScore} />
              </div>
            </div>

            {hasPlaceholder && (
              <div className="alert alert-info py-2 small">
                Replace placeholders like [N] with real numbers, and delete any claim that is not true for your project.
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="h6 mb-0">After: 3 rewrites</h2>
              <button className="btn btn-sm btn-outline-accent" onClick={copyAll}>Copy all</button>
            </div>

            {result.suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} index={i} isBest={i === bestIndex} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
