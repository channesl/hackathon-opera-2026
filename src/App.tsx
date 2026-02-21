import { useState } from 'react';
import SearchInput from './components/SearchInput';
import TreasureStep from './components/TreasureStep';
import { fetchRoute, extractInstructions, Poi, RouteStep } from './api/mazemap';

interface RouteData {
  steps: RouteStep[];
  stepsError: string | null;
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
  const [currentStep, setCurrentStep] = useState(0);

  const handleSwap = () => {
    setStartValue(endValue);
    setEndValue(startValue);
    setSelectedStart(selectedEnd);
    setSelectedEnd(selectedStart);
  };

  const handleFindRoute = async () => {
    if (!selectedStart || !selectedEnd) {
      setStatus({ msg: '⚠️ Pick both yer departure port and treasure destination, matey!', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ msg: '🔍 Chartin\' yer course across the campus seas...', type: 'loading' });
    setRouteData(null);
    setCurrentStep(0);

    try {
      const { tripData } = await fetchRoute(selectedStart, selectedEnd);
      const { steps, error: stepsError } = extractInstructions(tripData, selectedStart, selectedEnd);

      setRouteData({ steps, stepsError });

      if (stepsError) {
        setStatus({ msg: `☠️ ${stepsError}`, type: 'error' });
      } else {
        setStatus({ msg: '🏴‍☠️ Yer treasure map be ready! Follow the clues...', type: 'success' });
      }
    } catch (err) {
      console.error('Routing error:', err);
      setStatus({ msg: `☠️ Arr! The seas be rough: ${(err as Error).message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRouteData(null);
    setCurrentStep(0);
    setStartValue('');
    setEndValue('');
    setSelectedStart(null);
    setSelectedEnd(null);
    setStatus(null);
  };

  return (
    <>
      <div className="app-header">
        <h1>🏴‍☠️ Campus Treasure Hunt</h1>
        <p>Chart yer course across Campus Valla, ye scallywag!</p>
      </div>

      <div className="card">
        <SearchInput
          label="⚓ Departure Port"
          placeholder="e.g. Kårallen, Studenthuset..."
          value={startValue}
          onChange={setStartValue}
          onSelect={setSelectedStart}
          onClear={() => setSelectedStart(null)}
        />

        <button className="swap-btn" onClick={handleSwap} title="Swap start and end">⇅</button>

        <SearchInput
          label="🏴‍☠️ Treasure Location"
          placeholder="e.g. C1, Key1, Zenit..."
          value={endValue}
          onChange={setEndValue}
          onSelect={setSelectedEnd}
          onClear={() => setSelectedEnd(null)}
        />

        <button className="btn-route" onClick={handleFindRoute} disabled={loading}>
          🗺️ Find Treasure Route
        </button>

        {status && (
          <div className={`status ${status.type}`}>{status.msg}</div>
        )}
      </div>

      {routeData && !routeData.stepsError && routeData.steps.length > 0 && (
        <TreasureStep
          steps={routeData.steps}
          currentStep={currentStep}
          onNext={() => setCurrentStep(s => s + 1)}
          onPrev={() => setCurrentStep(s => Math.max(0, s - 1))}
          onReset={handleReset}
        />
      )}
    </>
  );
}
