interface RouteStatsProps {
  totalDistance: number;
  totalTime: number;
  stepCount: number;
}

export default function RouteStats({ totalDistance, totalTime, stepCount }: RouteStatsProps) {
  const distanceStr = totalDistance >= 1000
    ? (totalDistance / 1000).toFixed(1) + ' km'
    : Math.round(totalDistance) + ' m';
  const timeMin = Math.max(1, Math.ceil(totalTime / 60));

  return (
    <div className="card card-fade" style={{ maxWidth: '720px' }}>
      <div className="card-label">📊 Route Summary</div>
      <div className="route-summary">
        <div className="route-stat">
          <div className="value">{distanceStr}</div>
          <div className="label">Distance</div>
        </div>
        <div className="route-stat">
          <div className="value">~{timeMin} min</div>
          <div className="label">Walking</div>
        </div>
        <div className="route-stat">
          <div className="value">{stepCount}</div>
          <div className="label">Steps</div>
        </div>
      </div>
    </div>
  );
}
