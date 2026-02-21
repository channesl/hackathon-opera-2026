import { RouteStep } from '../api/mazemap';

interface RouteInstructionsProps {
  steps: RouteStep[];
  error: string | null;
}

export default function RouteInstructions({ steps, error }: RouteInstructionsProps) {
  if (error) {
    return (
      <div className="route-instructions-card">
        <p className="route-instructions-error">❌ {error}</p>
      </div>
    );
  }

  if (!steps || steps.length === 0) return null;

  return (
    <div className="route-instructions-card">
      <h3 className="route-instructions-title">Step-by-Step Instructions</h3>
      <ol className="route-instructions-list">
        {steps.map((step, i) => {
          const distLabel = step.distanceMeters
            ? step.distanceMeters >= 1000
              ? (step.distanceMeters / 1000).toFixed(1) + ' km'
              : Math.round(step.distanceMeters) + ' m'
            : null;

          return (
            <li key={i} className="route-instructions-item">
              <span className="route-instructions-text">{step.text}</span>
              {distLabel && (
                <span className="route-instructions-dist">{distLabel}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
