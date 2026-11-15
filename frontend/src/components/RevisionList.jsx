// Questions the student saved with "Revise later" (kept in localStorage)
export default function RevisionList({ items, onRemove, onPractice }) {
  return (
    <section className="card tool-card mt-4" aria-labelledby="revision-title">
      <div className="card-body">
        <h2 className="h6 mb-3" id="revision-title">Revision list ({items.length})</h2>

        {items.length === 0 ? (
          <p className="small text-secondary mb-0">
            Nothing saved yet. Open a question and click “Revise later” to keep it here.
          </p>
        ) : (
          <ul className="list-unstyled mb-0">
            {items.map((item) => (
              <li className="revision-item" key={item.question}>
                <p className="mb-1">{item.question}</p>
                <p className="small text-secondary mb-2">{item.topic} / {item.difficulty}</p>
                <details className="small mb-2">
                  <summary>Show hint</summary>
                  <p className="mt-1 mb-0">{item.hint}</p>
                </details>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-accent" onClick={() => onPractice(item)}>Practise</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => onRemove(item)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
