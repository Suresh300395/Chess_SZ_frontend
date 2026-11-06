/**
 * Centralized Reusable Animation Variants for Framer Motion
 * Supports iPhone-style Spring Pops, Directional Slides, Staggers, and Text Reveals
 */

import { ANIMATION_CONFIG } from './animationConfig';

const { spring, timings, offsets, scales, reducedMotion } = ANIMATION_CONFIG;

/**
 * Creates direction-based offset vector
 */
export const getDirectionOffset = (direction, distance = offsets.medium) => {
    switch (direction) {
        case 'up':
            return { x: 0, y: distance };
        case 'down':
            return { x: 0, y: -distance };
        case 'left':
            return { x: distance, y: 0 };
        case 'right':
            return { x: -distance, y: 0 };
        case 'none':
        default:
            return { x: 0, y: 0 };
    }
};

/**
 * iPhone-style Spring Pop Entrance
 * Elements scale up with subtle overshoot and settle smoothly
 */
export const springPopVariants = {
    hidden: (custom = {}) => {
        const offset = getDirectionOffset(custom.direction || 'up', custom.distance ?? offsets.medium);
        return {
            opacity: 0,
            scale: custom.scale ?? scales.initialPop,
            x: offset.x,
            y: offset.y,
        };
    },
    visible: (custom = {}) => ({
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: {
            ...(custom.spring || spring.default),
            delay: custom.delay || 0,
            opacity: {
                duration: custom.duration || timings.cardEntrance,
                ease: 'easeOut',
            },
        },
    }),
    exit: (_custom = {}) => ({
        opacity: 0,
        scale: scales.subtlePop,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
        },
    }),
};

/**
 * Slide Entrance (directional entry with smooth deceleration)
 */
export const slideVariants = {
    hidden: (custom = {}) => {
        const offset = getDirectionOffset(custom.direction || 'up', custom.distance ?? offsets.medium);
        return {
            opacity: 0,
            x: offset.x,
            y: offset.y,
            scale: custom.scale ?? 1,
        };
    },
    visible: (custom = {}) => ({
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        transition: {
            ...(custom.spring || spring.gentle),
            delay: custom.delay || 0,
            opacity: {
                duration: custom.duration || timings.sectionEntrance,
                ease: 'easeOut',
            },
        },
    }),
    exit: {
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

/**
 * Text Reveal Animation
 * Enters from slightly above or below with refined scale & opacity
 */
export const textRevealVariants = {
    hidden: (custom = {}) => {
        const offset = getDirectionOffset(custom.direction || 'up', custom.distance ?? offsets.small);
        return {
            opacity: 0,
            y: offset.y,
            x: offset.x,
            scale: custom.scale ?? scales.subtlePop,
        };
    },
    visible: (custom = {}) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            ...(custom.spring || spring.bisk),
            delay: custom.delay || 0,
            opacity: {
                duration: custom.duration || timings.textReveal,
                ease: 'easeOut',
            },
        },
    }),
};

/**
 * Stagger Container Variants
 * Automatically triggers sequential child animations
 */
export const staggerContainerVariants = {
    hidden: {
        opacity: 0,
    },
    visible: (custom = {}) => ({
        opacity: 1,
        transition: {
            delayChildren: custom.delayChildren || 0,
            staggerChildren: custom.stagger ?? timings.cardStagger,
        },
    }),
};

/**
 * Subtle Fade + Scale (ideal for background cards & decorative shapes)
 */
export const fadeScaleVariants = {
    hidden: (custom = {}) => ({
        opacity: 0,
        scale: custom.scale ?? scales.subtlePop,
    }),
    visible: (custom = {}) => ({
        opacity: 1,
        scale: 1,
        transition: {
            ...(custom.spring || spring.gentle),
            delay: custom.delay || 0,
            duration: custom.duration || timings.sectionEntrance,
        },
    }),
};

/**
 * Reduced Motion Fallback Variants (accessibility compliant)
 */
export const reducedMotionVariants = {
    hidden: { opacity: 0 },
    visible: (custom = {}) => ({
        opacity: 1,
        transition: {
            duration: custom.duration || reducedMotion.duration,
            ease: reducedMotion.ease,
            delay: custom.delay || 0,
        },
    }),
    exit: { opacity: 0 },
};
