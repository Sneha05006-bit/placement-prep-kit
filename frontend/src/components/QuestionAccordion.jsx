import { useState } from "react";

// Bootstrap accordion markup, opened/closed with React state (one open at a time)
export default function QuestionAccordion({ questions, known, saved, onKnow, onRevise, onPractice }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="accordion tool-accordion">
      {questions.map((q, i) => {
        const open = openIndex === i;
        const isKnown = known.includes(q.question);
        const isSaved = saved.includes(q.question);
        return (
          <div className="accordion-item" key={i}>
            <h3 className="accordion-header">
              <button
                type="button"
                className={`accordion-button ${open ? "" : "collapsed"}`}
                aria-expanded={open}
                aria-controls={`hint-${i}`}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                <span className="me-2 text-secondary">Q{i + 1}.</span> {q.question}
                {isKnown && <span className="badge accent-badge ms-2">Got it</span>}
                {isSaved && <span className="badge text-bg-warning ms-2">Revise</span>}
              </button>
            </h3>
            <div id={`hint-${i}`} className={`accordion-collapse collapse ${open ? "show" : ""}`}>
              <div className="accordion-body">
                <p className="mb-3"><strong>Hint:</strong> {q.hint}</p>
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-accent" onClick={() => onPractice(q)}>
                    Practise this answer
                  </button>
                  <button
                    className={`btn btn-sm ${isKnown ? "btn-accent" : "btn-outline-accent"}`}
                    aria-pressed={isKnown}
                    onClick={() => onKnow(q)}
                  >
                    {isKnown ? "Got it ✓" : "Got it"}
                  </button>
                  <button
                    className={`btn btn-sm ${isSaved ? "btn-warning" : "btn-outline-secondary"}`}
                    aria-pressed={isSaved}
                    onClick={() => onRevise(q)}
                  >
                    {isSaved ? "Saved for revision" : "Revise later"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
