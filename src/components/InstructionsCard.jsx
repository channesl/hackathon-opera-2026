export default function InstructionsCard({ steps, onDownload }) {
  return (
    <div className="card" id="instructionsCard">
      <h3 className="card-section-title">📋 Route Instructions</h3>
      <div className="instructions-panel">
        {steps.map((step, i) => {
          const distInfo = step.distanceMeters
            ? step.distanceMeters >= 1000
              ? (step.distanceMeters / 1000).toFixed(1) + ' km'
              : Math.round(step.distanceMeters) + ' m'
            : '';
          return (
            <div key={i} className="instruction-step">
              <div className="step-number">{i + 1}</div>
              <div className="step-content">
                <div className="step-text">{step.text}</div>
                {distInfo && <div className="step-distance">📏 {distInfo}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn-download" onClick={onDownload}>
        ⬇ Save Instructions
      </button>
    </div>
  );
}
