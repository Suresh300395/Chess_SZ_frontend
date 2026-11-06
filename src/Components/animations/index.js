/**
 * Centralized Reusable Animation System
 * Premium iPhone-style Spring / Pop Entrance Animations
 */

export { ANIMATION_CONFIG } from './animationConfig';
export {
    springPopVariants,
    slideVariants,
    textRevealVariants,
    staggerContainerVariants,
    fadeScaleVariants,
    reducedMotionVariants,
    getDirectionOffset,
} from './animationVariants';

export { AnimatedPage } from './AnimatedPage';
export { AnimatedSection } from './AnimatedSection';
export { AnimatedCard } from './AnimatedCard';
export { AnimatedText } from './AnimatedText';
export { AnimatedItem } from './AnimatedItem';

// Re-export core framer-motion primitives
export { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

