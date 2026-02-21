export default function MapCard({ embedUrl }) {
  return (
    <div className="card" id="mapCard">
      <h3 className="card-section-title">🗺️ Route Map</h3>
      <iframe className="map-embed" src={embedUrl} title="Route Map" />
    </div>
  );
}
