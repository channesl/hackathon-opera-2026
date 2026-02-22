import { useState, useEffect, useRef, useCallback } from 'react';
import { RouteStep } from '../api/mazemap';
import { speakClue, SpeechHandle } from '../api/openai';
import PiratePopupAd from './PiratePopupAd';

interface TreasureStepProps {
    steps: RouteStep[];
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    apiKey: string | null;
}

type SpeechState = 'idle' | 'loading' | 'playing';

export default function TreasureStep({ steps, currentStep, onNext, onPrev, onReset, apiKey }: TreasureStepProps) {
    const [speechState, setSpeechState] = useState<SpeechState>('idle');
    const speechRef = useRef<SpeechHandle | null>(null);
    const [showAd, setShowAd] = useState(false);
    const pendingActionRef = useRef<'next' | 'finish' | null>(null);

    const stopSpeech = useCallback(() => {
        if (speechRef.current) {
            speechRef.current.stop();
            speechRef.current = null;
        }
        setSpeechState('idle');
    }, []);

    // Auto-stop when step changes or component unmounts
    useEffect(() => {
        return () => stopSpeech();
    }, [currentStep, stopSpeech]);

    const handleSpeak = async () => {
        if (speechState !== 'idle') {
            stopSpeech();
            return;
        }

        if (!apiKey || !step) return;

        setSpeechState('loading');
        const handle = speakClue(step.text, apiKey);
        speechRef.current = handle;

        // Once the fetch resolves and audio starts, switch to 'playing'
        // We detect this by waiting a tick after the promise starts
        // The done promise resolves when audio finishes
        handle.done.then(() => {
            setSpeechState('idle');
            speechRef.current = null;
        });

        // Small delay to transition from loading → playing
        // (the audio starts playing inside speakClue once the blob is ready)
        setSpeechState('playing');
    };

    // Show popup ad on every 2nd clue (when moving to step index 1, 3, 5, etc.)
    const shouldShowAd = (nextStep: number): boolean => {
        // Show ad when navigating TO an even-indexed step (0-indexed),
        // which means every 2nd clue the user sees (clue 2, 4, 6...)
        return nextStep > 0 && nextStep % 2 === 1;
    };

    const handleNext = () => {
        const nextStep = currentStep + 1;
        if (shouldShowAd(nextStep)) {
            pendingActionRef.current = 'next';
            setShowAd(true);
        } else {
            onNext();
        }
    };

    const handleFinish = () => {
        // Also potentially show an ad before claiming treasure for extra annoyance
        if (shouldShowAd(currentStep + 1)) {
            pendingActionRef.current = 'finish';
            setShowAd(true);
        } else {
            onNext();
        }
    };

    const handleAdClose = () => {
        setShowAd(false);
        // Execute the pending action after ad is dismissed
        if (pendingActionRef.current === 'next' || pendingActionRef.current === 'finish') {
            onNext();
        }
        pendingActionRef.current = null;
    };

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
        <>
            {showAd && <PiratePopupAd onClose={handleAdClose} />}

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
                    {apiKey && (
                        <button
                            className={`btn-speak${speechState !== 'idle' ? ' active' : ''}${speechState === 'loading' ? ' loading' : ''}`}
                            onClick={handleSpeak}
                            title={speechState === 'idle' ? 'Read clue aloud' : 'Stop'}
                        >
                            {speechState === 'loading' ? '⏳' : speechState === 'playing' ? '⏹️' : '🔊'}
                        </button>
                    )}
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
                            onClick={handleFinish}
                        >
                            🏴‍☠️ Claim Treasure!
                        </button>
                    ) : (
                        <button
                            className="btn-treasure-nav btn-treasure-next"
                            onClick={handleNext}
                        >
                            Next Clue ▶
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
