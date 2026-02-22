import { useState } from 'react';
import SearchInput from './components/SearchInput';
import TreasureStep from './components/TreasureStep';
import { fetchRoute, extractInstructions, Poi, RouteStep } from './api/mazemap';
import { pirateifyInstructions, Difficulty } from './api/openai';

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
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

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

      if (stepsError || steps.length === 0) {
        setRouteData({ steps, stepsError });
        setStatus({ msg: `☠️ ${stepsError || 'No route found'}`, type: 'error' });
        return;
      }

      // Transform instructions into pirate riddles via AI
      setStatus({ msg: '🦜 Yer parrot be translatin\' the clues into pirate speak...', type: 'loading' });

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      let pirateSteps = steps;

      if (apiKey && apiKey !== 'your-api-key-here') {
        try {
          const originalTexts = steps.map(s => s.text);
          const pirateTexts = await pirateifyInstructions(originalTexts, apiKey, difficulty);
          pirateSteps = steps.map((s, i) => ({ ...s, text: pirateTexts[i] }));
        } catch (aiErr) {
          console.warn('AI riddle generation failed, using original instructions:', aiErr);
          // Fall through with original steps — still works, just not pirate-ified
        }
      }

      setRouteData({ steps: pirateSteps, stepsError: null });
      setStatus({ msg: '🏴‍☠️ Yer treasure map be ready! Follow the clues...', type: 'success' });

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
      {/* ── Decorative Background Layers ── */}
      <div className="map-vignette" />

      {/* Floating pirate particles */}
      <div className="pirate-particles">
        <span className="pirate-particle">⚓</span>
        <span className="pirate-particle">⚔️</span>
        <span className="pirate-particle">🧭</span>
        <span className="pirate-particle">☠️</span>
        <span className="pirate-particle">🗡️</span>
        <span className="pirate-particle">🪙</span>
      </div>

      {/* Compass Rose */}
      <div className="compass-rose">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" stroke="rgba(212,168,67,0.4)" strokeWidth="1" />
          <circle cx="50" cy="50" r="38" stroke="rgba(212,168,67,0.2)" strokeWidth="0.5" />
          {/* N/S/E/W points */}
          <polygon points="50,2 45,35 50,28 55,35" fill="rgba(212,168,67,0.5)" />
          <polygon points="50,98 55,65 50,72 45,65" fill="rgba(212,168,67,0.3)" />
          <polygon points="2,50 35,45 28,50 35,55" fill="rgba(212,168,67,0.3)" />
          <polygon points="98,50 65,55 72,50 65,45" fill="rgba(212,168,67,0.3)" />
          {/* Diagonal points */}
          <polygon points="15,15 38,38 32,40 40,32" fill="rgba(212,168,67,0.15)" />
          <polygon points="85,85 62,62 68,60 60,68" fill="rgba(212,168,67,0.15)" />
          <polygon points="85,15 62,38 60,32 68,40" fill="rgba(212,168,67,0.15)" />
          <polygon points="15,85 38,62 40,68 32,60" fill="rgba(212,168,67,0.15)" />
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="rgba(212,168,67,0.5)" />
          {/* Cardinal labels */}
          <text x="50" y="16" textAnchor="middle" fill="rgba(212,168,67,0.5)" fontSize="8" fontFamily="Pirata One">N</text>
          <text x="50" y="92" textAnchor="middle" fill="rgba(212,168,67,0.3)" fontSize="8" fontFamily="Pirata One">S</text>
          <text x="9" y="53" textAnchor="middle" fill="rgba(212,168,67,0.3)" fontSize="8" fontFamily="Pirata One">W</text>
          <text x="91" y="53" textAnchor="middle" fill="rgba(212,168,67,0.3)" fontSize="8" fontFamily="Pirata One">E</text>
        </svg>
      </div>

      {/* Ocean Waves */}
      <div className="ocean-waves">
        <div className="wave wave1">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,40 C120,80 240,10 360,40 C480,70 600,20 720,40 C840,60 960,10 1080,40 C1200,70 1320,20 1440,40 L1440,100 L0,100 Z" />
          </svg>
        </div>
        <div className="wave wave2">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,50 C160,20 320,70 480,50 C640,30 800,70 960,50 C1120,30 1280,70 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
        <div className="wave wave3">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,60 C200,30 400,80 600,60 C800,40 1000,80 1200,60 C1400,40 1440,70 1440,60 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </div>

      {/* ── Main Content ── */}
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

        {/* Difficulty Selector */}
        <div className="difficulty-selector">
          <label className="difficulty-label">⚔️ Clue Difficulty</label>
          <div className="difficulty-options">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                className={`difficulty-btn difficulty-btn-${level}${difficulty === level ? ' active' : ''}`}
                onClick={() => setDifficulty(level)}
                disabled={loading}
              >
                <span className="difficulty-icon">
                  {level === 'easy' ? '🧭' : level === 'normal' ? '🗺️' : '💀'}
                </span>
                <span className="difficulty-text">
                  {level === 'easy' ? 'Easy' : level === 'normal' ? 'Normal' : 'Hard'}
                </span>
                <span className="difficulty-desc">
                  {level === 'easy' ? 'Clear directions' : level === 'normal' ? 'Pirate clues' : 'Cryptic riddles'}
                </span>
              </button>
            ))}
          </div>
        </div>

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
          apiKey={import.meta.env.VITE_OPENAI_API_KEY || null}
        />
      )}
    </>
  );
}
