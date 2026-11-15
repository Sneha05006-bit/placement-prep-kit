// Grey placeholder cards shown while the AI is working
export default function SkeletonCards({ count = 3 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="card tool-card mb-3 placeholder-glow" key={i}>
          <div className="card-body">
            <span className="placeholder col-3 d-block mb-3"></span>
            <span className="placeholder col-12 d-block mb-2"></span>
            <span className="placeholder col-9 d-block mb-2"></span>
            <span className="placeholder col-6 d-block"></span>
          </div>
        </div>
      ))}
    </div>
  );
}
