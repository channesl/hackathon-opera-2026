import { useState } from 'react';
import SearchInput from './components/SearchInput';
import RouteStats from './components/RouteStats';
import MapCard from './components/MapCard';
import RouteInstructions from './components/RouteInstructions';
import { fetchRoute, extractInstructions, buildMapEmbedUrl, getPoiLatLng, Poi, RouteStep } from './api/mazemap';

interface RouteData {
  steps: RouteStep[];
  stepsError: string | null;
  totalDistance: number;
  totalTime: number;
  embedUrl: string;
  mapOnly: boolean;
}

interface Status {
  msg: string;
  type: 'error' | 'loading' | 'success';
}

export default function App() {
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [selectedStart, setSelectedStart] = useState<Poi | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Poi | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  const handleSwap = () => {
    setStartValue(endValue);
    setEndValue(startValue);
    setSelectedStart(selectedEnd);
    setSelectedEnd(selectedStart);
  };

  const handleFindRoute = async () => {
    if (!selectedStart || !selectedEnd) {
      setStatus({ msg: '⚠️ Please select both a start and end location from the suggestions.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ msg: '🔍 Finding the best route...', type: 'loading' });
    setRouteData(null);

    try {
      const { tripData, startCoords, endCoords, startZ, endZ } = await fetchRoute(selectedStart, selectedEnd);
      const { steps, error: stepsError, totalDistance, totalTime } = extractInstructions(tripData, selectedStart, selectedEnd);
      const embedUrl = buildMapEmbedUrl(startCoords, endCoords, startZ, endZ);

      setRouteData({ steps, stepsError, totalDistance, totalTime, embedUrl, mapOnly: false });
      setStatus({ msg: '🎉 Route found! Follow the instructions below.', type: 'success' });

    } catch (err) {
      console.error('Routing error:', err);
      try {
        const startCoords = getPoiLatLng(selectedStart);
        const endCoords = getPoiLatLng(selectedEnd);
        if (startCoords && endCoords) {
          const embedUrl = buildMapEmbedUrl(startCoords, endCoords, selectedStart.z || 0, selectedEnd.z || 0);
          setRouteData({ steps: [], stepsError: 'Turn-by-turn instructions could not be loaded for this route.', totalDistance: 0, totalTime: 0, embedUrl, mapOnly: true });
          setStatus({ msg: '🗺️ Route shown on map. Turn-by-turn instructions unavailable for this route.', type: 'loading' });
        } else {
          setStatus({ msg: `❌ Could not find route: ${(err as Error).message}`, type: 'error' });
        }
      } catch {
        setStatus({ msg: `❌ Could not find route: ${(err as Error).message}`, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="app-header">
        <h1>🗺️ LiU Campus Navigator</h1>
        <p>Find routes between any locations on Campus Valla</p>
      </div>

      <div className="card">
        <SearchInput
          label="📍 Start Location"
          placeholder="e.g. Kårallen, Studenthuset..."
          value={startValue}
          onChange={setStartValue}
          onSelect={setSelectedStart}
          onClear={() => setSelectedStart(null)}
        />

        <button className="swap-btn" onClick={handleSwap} title="Swap start and end">⇅</button>

        <SearchInput
          label="🏁 Destination"
          placeholder="e.g. C1, Key1, Zenit..."
          value={endValue}
          onChange={setEndValue}
          onSelect={setSelectedEnd}
          onClear={() => setSelectedEnd(null)}
        />

        <button className="btn-route" onClick={handleFindRoute} disabled={loading}>
          🚶 Find Route
        </button>

        {status && (
          <div className={`status ${status.type}`}>{status.msg}</div>
        )}
      </div>

      {routeData && !routeData.mapOnly && (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <RouteStats
            totalDistance={routeData.totalDistance}
            totalTime={routeData.totalTime}
            stepCount={routeData.steps.length}
          />
        </div>
      )}

      {routeData && (
        <div className="results-row" style={{ maxWidth: '1200px' }}>
          <MapCard embedUrl={routeData.embedUrl} />
        </div>
      )}

      {routeData && (
        <RouteInstructions
          steps={routeData.steps}
          error={routeData.stepsError}
        />
      )}
    </>
  );
}
