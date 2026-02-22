import { useState, useEffect, useCallback } from 'react';

interface PiratePopupAdProps {
    onClose: () => void;
}

interface AdContent {
    headline: string;
    body: string;
    cta: string;
    icon: string;
    accent: string;     // CSS color for the ad
    tag: string;        // "AD" label style
    fine: string;       // fine print
}

const ADS: AdContent[] = [
    {
        headline: '🧜‍♀️ HOT SINGLE MERMAIDS',
        body: 'in yer waters! Only 3 nautical miles away! They be DYING to meet a scallywag like ye!',
        cta: '💋 Meet Mermaids Now',
        icon: '🧜‍♀️',
        accent: '#e91e8f',
        tag: 'SPONSORED',
        fine: '*Mermaids may actually be manatees. Results may vary. Not responsible for shipwrecks.',
    },
    {
        headline: '⚠️ YER SHIP HAS 47 BARNACLES!',
        body: 'Download BarnacleBlocker™ PRO to clean yer hull INSTANTLY! Yer vessel be runnin\' 300% slower!',
        cta: '🛡️ Download FREE Scan',
        icon: '🦠',
        accent: '#ff4444',
        tag: 'WARNING',
        fine: '*BarnacleBlocker™ will install 14 additional toolbars on yer helm.',
    },
    {
        headline: '🏴‍☠️ CAPTAIN HOOK HATES HIM!',
        body: 'Local pirate discovers ONE WEIRD TRICK to find treasure 10x faster. Treasure hunters FURIOUS!',
        cta: '🤯 Learn His Secret',
        icon: '💰',
        accent: '#ff8800',
        tag: 'PROMOTED',
        fine: '*This pirate was later arrested for fraud on seven seas.',
    },
    {
        headline: '🦜 FREE PARROT — CLAIM NOW!',
        body: 'Congratulations! Ye be the 1,000,000th pirate to visit this island! Click below to claim yer FREE parrot!',
        cta: '🎁 Claim Free Parrot',
        icon: '🎉',
        accent: '#44bb44',
        tag: 'WINNER!!',
        fine: '*One parrot per pirate. Parrot may bite. Parrot may reveal location of yer secret treasure.',
    },
    {
        headline: '🦿 IS YER PEG LEG SLOW?',
        body: 'Upgrade to PegLeg PRO™ — carbon fiber, spring-loaded, with GPS navigation! Now 50% off!',
        cta: '🛒 Shop PegLeg PRO',
        icon: '🦿',
        accent: '#6c5ce7',
        tag: 'AD',
        fine: '*Side effects include: excessive speed, involuntary jigs, and splinters.',
    },
    {
        headline: '📜 EXTEND YER PLANK WARRANTY!',
        body: 'We\'ve been tryin\' to reach ye about yer plank\'s extended warranty! It expires in 2 tides!',
        cta: '📞 Call Now — 1-800-PLANK',
        icon: '📞',
        accent: '#0984e3',
        tag: 'URGENT',
        fine: '*Plank warranty does not cover walk-the-plank incidents.',
    },
    {
        headline: '🍺 GROG DELIVERY IN 30 MIN!',
        body: 'Order now from GrogDash™! Premium rum, ale & hardtack delivered straight to yer ship!',
        cta: '🍻 Order Grog Now',
        icon: '🍺',
        accent: '#e17055',
        tag: 'NEW',
        fine: '*Minimum order: 12 barrels. Delivery by cannon. Breakage expected.',
    },
    {
        headline: '💀 LEARN PIRACY IN 6 WEEKS!',
        body: 'PirateBootcamp™ Online Academy — Get certified in Plundering, Swashbuckling & Sea Shanties!',
        cta: '🎓 Enroll FREE Trial',
        icon: '🏴‍☠️',
        accent: '#fdcb6e',
        tag: 'EDUCATION',
        fine: '*Degree not recognized by any navy. 98% of graduates still get caught.',
    },
];

// Pick a random ad, different from last shown
let lastAdIndex = -1;
function getRandomAd(): AdContent {
    let idx = Math.floor(Math.random() * ADS.length);
    while (idx === lastAdIndex && ADS.length > 1) {
        idx = Math.floor(Math.random() * ADS.length);
    }
    lastAdIndex = idx;
    return ADS[idx];
}

export default function PiratePopupAd({ onClose }: PiratePopupAdProps) {
    const [ad] = useState<AdContent>(() => getRandomAd());
    const [countdown, setCountdown] = useState(5);
    const [canClose, setCanClose] = useState(false);
    const [fakeClicks, setFakeClicks] = useState(0);

    useEffect(() => {
        if (countdown <= 0) {
            setCanClose(true);
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleFakeClick = useCallback(() => {
        setFakeClicks(c => c + 1);
    }, []);

    return (
        <div className="popup-overlay" onClick={handleFakeClick}>
            <div className="popup-ad" onClick={(e) => e.stopPropagation()} style={{ '--ad-accent': ad.accent } as React.CSSProperties}>
                {/* Fake close button that doesn't work until countdown is done */}
                <div className="popup-close-area">
                    {canClose ? (
                        <button className="popup-close-btn popup-close-real" onClick={onClose} title="Close">
                            ✕
                        </button>
                    ) : (
                        <div className="popup-countdown">
                            <span className="popup-countdown-text">Skip in {countdown}s</span>
                        </div>
                    )}
                </div>

                {/* Tag */}
                <div className="popup-tag" style={{ background: ad.accent }}>{ad.tag}</div>

                {/* Content */}
                <div className="popup-content">
                    <div className="popup-icon-big">{ad.icon}</div>
                    <h2 className="popup-headline">{ad.headline}</h2>
                    <p className="popup-body">{ad.body}</p>

                    {/* Fake CTA button */}
                    <button className="popup-cta" style={{ background: ad.accent }} onClick={handleFakeClick}>
                        {ad.cta}
                    </button>

                    {/* Fake "other offers" that jiggle annoyingly */}
                    <div className="popup-extras">
                        <button className="popup-extra-btn" onClick={handleFakeClick}>🎰 Spin to Win!</button>
                        <button className="popup-extra-btn" onClick={handleFakeClick}>🗺️ Free Map!</button>
                    </div>

                    {/* Fine print */}
                    <p className="popup-fine">{ad.fine}</p>
                </div>

                {/* Amusing message when they click around */}
                {fakeClicks > 0 && fakeClicks < 3 && (
                    <div className="popup-click-msg">Arr, that button don't work, matey!</div>
                )}
                {fakeClicks >= 3 && fakeClicks < 6 && (
                    <div className="popup-click-msg">Ye keep clickin' but nothin' happens! 😂</div>
                )}
                {fakeClicks >= 6 && (
                    <div className="popup-click-msg">STOP CLICKIN'! Just wait for the timer! ☠️</div>
                )}

                {/* Fake "x" buttons that are actually misplaced */}
                {!canClose && (
                    <>
                        <div className="popup-fake-x popup-fake-x-1" onClick={handleFakeClick}>✕</div>
                        <div className="popup-fake-x popup-fake-x-2" onClick={handleFakeClick}>✕</div>
                    </>
                )}
            </div>
        </div>
    );
}
