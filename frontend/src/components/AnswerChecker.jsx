import { useEffect, useRef, useState } from "react";
import { checkAnswer } from "../api.js";
import ScoreBar from "./ScoreBar.jsx";
import SkeletonCards from "./SkeletonCards.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import ErrorAlert from "./ErrorAlert.jsx";

const TOPICS = [
  "React",
  "JavaScript",
  "Node.js",
  "HTML/CSS",
  "DBMS",
  "Operating Systems",
  "Data Structures",
  "Computer Networks",
];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const MAX_QUESTION = 300;
const MAX_ANSWER = 1000;

export default function AnswerChecker({ prefill, onRemaining }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const answerRef = useRef(null);

  // "Practise this answer" from the Interview tab fills the question and jumps to the answer box
  useEffect(() => {
    if (!prefill) return;
    setTopic(prefill.topic);
    setDifficulty(prefill.difficulty);
    setQuestion(prefill.question);
    setAnswer("");
    setResult(null);
    setError("");
    answerRef.current?.focus();
  }, [prefill]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!question.trim()) return setError("Enter the interview question first.");
    if (!answer.trim()) return setError("Write your answer first, then click Check.");

    setError("");
    setLoading(true);
    try {
      const data = await checkAnswer({ topic, difficulty, question: question.trim(), answer: answer.trim() });
      setResult(data);
      onRemaining(data.remaining);
    } catch (err) {
      setError(err.message);
      if (err.status === 429) onRemaining(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <form className="card tool-card" onSubmit={handleSubmit}>
          <div className="card-body">
            <h2 className="h5 mb-3">Your answer</h2>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <label htmlFor="chk-topic" className="form-label">Topic</label>
                <select id="chk-topic" className="form-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label htmlFor="chk-diff" className="form-label">Difficulty</label>
                <select id="chk-diff" className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <label htmlFor="chk-question" className="form-label mt-2">Interview question</label>
            <textarea
              id="chk-question"
              className="form-control"
              rows={2}
              maxLength={MAX_QUESTION}
              value={question}
              placeholder="e.g. What is the difference between let and var?"
              onChange={(e) => setQuestion(e.target.value)}
            />

            <label htmlFor="chk-answer" className="form-label mt-3">Your answer</label>
            <textarea
              id="chk-answer"
              ref={answerRef}
              className="form-control"
              rows={6}
              maxLength={MAX_ANSWER}
              value={answer}
              placeholder="Answer it the way you would in the interview."
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && handleSubmit(e)}
            />
            <div className="d-flex justify-content-between mt-1">
              <span className="form-text">Ctrl + Enter to submit</span>
              <span className={`form-text ${answer.length >= MAX_ANSWER - 50 ? "text-danger" : ""}`}>
                {answer.length}/{MAX_ANSWER}
              </span>
            </div>

            <button type="submit" className="btn btn-accent w-100 mt-3" disabled={loading}>
              {loading ? "Checking..." : "Check my answer"}
            </button>
          </div>
        </form>
      </div>

      <div className="col-lg-7" aria-live="polite">
        <ErrorAlert message={error} onClose={() => setError("")} />

        {loading && (
          <>
            <LoadingSpinner label="Reading your answer..." />
            <SkeletonCards count={2} />
          </>
        )}

        {!loading && !result && (
          <div className="empty-state">
            <p className="h5 mb-1">Your feedback will appear here</p>
            <p className="mb-0 text-secondary">
              Type a question and your answer, or click “Practise this answer” on any generated question.
            </p>
          </div>
        )}

        {!loading && result && (
          <>
            <div className="card tool-card mb-3">
              <div className="card-body">
                <ScoreBar label="Answer score" score={result.score} />
                <p className="mb-0">{result.verdict}</p>
              </div>
            </div>

            <div className="row g-3 mb-3">
              {result.strengths.length > 0 && (
                <div className="col-md-6">
                  <div className="card tool-card h-100">
                    <div className="card-body">
                      <h3 className="h6">What you did well</h3>
                      <ul className="mb-0 ps-3">{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  </div>
                </div>
              )}
              <div className={result.strengths.length > 0 ? "col-md-6" : "col-12"}>
                <div className="card tool-card h-100">
                  <div className="card-body">
                    <h3 className="h6">What to add or fix</h3>
                    <ul className="mb-0 ps-3">{result.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card suggestion-card is-best">
              <div className="card-body">
                <h3 className="h6">A stronger answer</h3>
                <p className="mb-0">{result.modelAnswer}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
