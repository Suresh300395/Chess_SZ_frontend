/**
 * Centralized Animation Configuration
 * iPhone-style Spring / Pop Entrance Physics & Timing Presets
 */

export const ANIMATION_CONFIG = {
    // iPhone-style Spring Physics (snappy, subtle overshoot, organic settling)
    spring: {
        // Default spring for cards and major elements
        default: {
            type: 'spring',
            stiffness: 320,
            damping: 24,
            mass: 0.85,
        },
        // Smoother, slightly more relaxed spring for page-level transitions
        gentle: {
            type: 'spring',
            stiffness: 260,
            damping: 26,
            mass: 0.95,
        },
        // Fast, crisp spring for small items, icons, badges, and buttons
        bisk: {
            type: 'spring',
            stiffness: 380,
            damping: 22,
            mass: 0.7,
        },
        // Card entrance spring resembling iPhone home screen app launch
        appIcon: {
            type: 'spring',
            stiffness: 340,
            damping: 25,
            mass: 0.8,
        },
    },

    // Smooth bezier easings as alternatives or for opacity transitions
    easing: {
        appleEase: [0.25, 0.1, 0.25, 1.0],
        appleEaseOut: [0.16, 1, 0.3, 1],
        appleSpringEase: [0.34, 1.3, 0.64, 1],
    },

    // Standardized Timings (in seconds)
    timings: {
        pageEntrance: 0.55,
        sectionEntrance: 0.5,
        cardEntrance: 0.45,
        textReveal: 0.45,
        itemEntrance: 0.4,
        cardStagger: 0.09,
        itemStagger: 0.06,
        defaultDelay: 0.05,
    },

    // Distance Offsets (in pixels) - smooth bottom-to-top entrance motion
    offsets: {
        small: 14,
        medium: 26,
        large: 40,
    },

    // Initial Scales for Pop Entrance
    scales: {
        initialPop: 0.94,
        subtlePop: 0.97,
        badgePop: 0.90,
    },

    // Viewport Observation Options for scroll-triggered entrance
    viewport: {
        once: true,
        amount: 0.08,
        margin: '0px 0px -40px 0px',
    },

    // Reduced Motion Fallback
    reducedMotion: {
        duration: 0.2,
        ease: 'easeOut',
    },
};

export default ANIMATION_CONFIG;

