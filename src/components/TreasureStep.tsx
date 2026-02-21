import { RouteStep } from '../api/mazemap';

interface TreasureStepProps {
    steps: RouteStep[];
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
}

export default function TreasureStep({ steps, currentStep, onNext, onPrev, onReset }: TreasureStepProps) {
    if (!steps || steps.length === 0) return null;

    const isLast = currentStep >= steps.length - 1;
    const isFirst = currentStep === 0;
    const step = steps[currentStep];
    const finished = currentStep >= steps.length;

    const distLabel = step?.distanceMeters
        ? step.distanceMeters >= 1000
            ? (step.distanceMeters / 1000).toFixed(1) + ' leagues'
            : Math.round(step.distanceMeters) + ' paces'
        : null;

    if (finished) {
        return (
            <div className="treasure-card treasure-card-fade">
                <div className="treasure-celebration">
                    <div className="treasure-icon-big">🏴‍☠️</div>
                    <h2 className="treasure-found-title">X Marks the Spot!</h2>
                    <p className="treasure-found-text">
                        Ye've followed all the clues and found yer treasure, matey!
                    </p>
                    <button className="btn-treasure-reset" onClick={onReset}>
                        🗺️ Chart a New Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="treasure-card treasure-card-fade">
            {/* Progress */}
            <div className="treasure-progress">
                <span className="treasure-progress-label">
                    Clue {currentStep + 1} of {steps.length}
                </span>
                <div className="treasure-progress-bar">
                    <div
                        className="treasure-progress-fill"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* The Clue */}
            <div className="treasure-clue-wrapper">
                <div className="treasure-clue-decoration">☠️</div>
                <div className="treasure-clue">
                    <p className="treasure-clue-text">{step.text}</p>
                    {distLabel && (
                        <p className="treasure-clue-distance">⚓ {distLabel}</p>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="treasure-nav">
                <button
                    className="btn-treasure-nav btn-treasure-prev"
                    onClick={onPrev}
                    disabled={isFirst}
                >
                    ◀ Back
                </button>

                {isLast ? (
                    <button
                        className="btn-treasure-nav btn-treasure-finish"
                        onClick={onNext}
                    >
                        🏴‍☠️ Claim Treasure!
                    </button>
                ) : (
                    <button
                        className="btn-treasure-nav btn-treasure-next"
                        onClick={onNext}
                    >
                        Next Clue ▶
                    </button>
                )}
            </div>
        </div>
    );
}
