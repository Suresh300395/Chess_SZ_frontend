import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { springPopVariants, reducedMotionVariants } from './animationVariants';
import { ANIMATION_CONFIG } from './animationConfig';

/**
 * AnimatedPage Component
 * Provides a fluid iPhone-style entrance for entire pages or major route views.
 */
export const AnimatedPage = forwardRef(({
    children,
    className = '',
    style = {},
    direction = 'up',
    delay = 0,
    duration,
    disabled = false,
    ...rest
}, ref) => {
    const shouldReduceMotion = useReducedMotion();

    if (disabled) {
        return (
            <div ref={ref} className={className} style={style} {...rest}>
                {children}
            </div>
        );
    }

    const variants = shouldReduceMotion ? reducedMotionVariants : springPopVariants;
    const custom = {
        direction,
        delay,
        duration: duration || ANIMATION_CONFIG.timings.pageEntrance,
        scale: ANIMATION_CONFIG.scales.subtlePop,
        spring: ANIMATION_CONFIG.spring.gentle,
        distance: ANIMATION_CONFIG.offsets.small,
    };

    return (
        <motion.div
            ref={ref}
            className={`animated-page ${className}`.trim()}
            style={{ width: '100%', ...style }}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={custom}
            {...rest}
        >
            {children}
        </motion.div>
    );
});

AnimatedPage.displayName = 'AnimatedPage';
export default AnimatedPage;

