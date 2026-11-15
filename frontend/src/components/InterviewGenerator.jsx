import { useState } from "react";
import { generateQuestions } from "../api.js";
import QuestionAccordion from "./QuestionAccordion.jsx";
import RevisionList from "./RevisionList.jsx";
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

export default function InterviewGenerator({ onRemaining, revision, onToggleRevise, onPractice }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  // Every question shown so far for this topic + difficulty (sent to the AI to avoid repeats)
  const [seen, setSeen] = useState([]);
  // Questions the student marked "Got it" in the current set
  const [known, setKnown] = useState([]);

  // newSet = true  -> keep the history so the AI avoids earlier questions
  // newSet = false -> fresh start (used by the main Generate button)
  async function generate(newSet) {
    if (loading) return;
    setError("");
    setLoading(true);
    const previousQuestions = newSet ? seen : [];
    try {
      const data = await generateQuestions({ topic, difficulty, previousQuestions });
      setQuestions(data.questions);
      setKnown([]);
      setSeen([...previousQuestions, ...data.questions.map((q) => q.question)]);
      onRemaining(data.remaining);
    } catch (err) {
      setError(err.message);
      if (err.status === 429) onRemaining(0);
    } finally {
      setLoading(false);
    }
  }

  const toItem = (q) => ({ question: q.question, hint: q.hint, topic, difficulty });
  const toggleKnown = (q) =>
    setKnown((k) => (k.includes(q.question) ? k.filter((x) => x !== q.question) : [...k, q.question]));

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <form
          className="card tool-card"
          onSubmit={(e) => {
            e.preventDefault();
            generate(false);
          }}
        >
          <div className="card-body">
            <h2 className="h5 mb-3">Pick a topic</h2>

            <label htmlFor="topic-select" className="form-label">Topic</label>
            <select id="topic-select" className="form-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>

            <label htmlFor="difficulty-select" className="form-label mt-3">Difficulty</label>
            <select id="difficulty-select" className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>

            <button type="submit" className="btn btn-accent w-100 mt-4" disabled={loading}>
              {loading ? "Generating..." : "Generate questions"}
            </button>
          </div>
        </form>
      </div>

      <div className="col-lg-8" aria-live="polite">
        <ErrorAlert message={error} onClose={() => setError("")} />

        {loading && (
          <>
            <LoadingSpinner label="Preparing 5 questions..." />
            <SkeletonCards count={4} />
          </>
        )}

        {!loading && questions.length === 0 && (
          <div className="empty-state">
            <p className="h5 mb-1">Your interview questions will appear here</p>
            <p className="mb-0 text-secondary">Choose a topic and difficulty, then generate a set of 5.</p>
          </div>
        )}

        {!loading && questions.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="h5 mb-0">
                {topic} <span className="badge accent-badge ms-1">{difficulty}</span>
                <span className="small text-secondary ms-2 fw-normal">Got it: {known.length}/{questions.length}</span>
              </h2>
              <button className="btn btn-outline-accent btn-sm" onClick={() => generate(true)} disabled={loading}>
                Generate New Set
              </button>
            </div>
            <QuestionAccordion
              questions={questions}
              known={known}
              saved={revision.map((r) => r.question)}
              onKnow={toggleKnown}
              onRevise={(q) => onToggleRevise(toItem(q))}
              onPractice={(q) => onPractice({ topic, difficulty, question: q.question })}
            />
          </>
        )}

        <RevisionList
          items={revision}
          onRemove={onToggleRevise}
          onPractice={(item) => onPractice({ topic: item.topic, difficulty: item.difficulty, question: item.question })}
        />
      </div>
    </div>
  );
}
