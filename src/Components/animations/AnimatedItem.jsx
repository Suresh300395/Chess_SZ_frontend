import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    springPopVariants,
    slideVariants,
    fadeScaleVariants,
    reducedMotionVariants
} from './animationVariants';
import { ANIMATION_CONFIG } from './animationConfig';

/**
 * AnimatedItem Component
 * Reusable wrapper for individual elements (buttons, badges, icons, list items).
 * Seamlessly integrates into staggered containers or stands alone.
 */
export const AnimatedItem = forwardRef(({
    children,
    className = '',
    style = {},
    direction = 'up',
    delay = 0,
    duration,
    scale = ANIMATION_CONFIG.scales.badgePop,
    animationType = 'springPop',
    springPreset = 'bisk',
    whileInView = true,
    once = true,
    amount = 0.1,
    margin = '0px 0px -30px 0px',
    hoverTap = false,
    disabled = false,
    as = 'div',
    ...rest
}, ref) => {
    const shouldReduceMotion = useReducedMotion();

    if (disabled) {
        const Component = as;
        return (
            <Component ref={ref} className={className} style={style} {...rest}>
                {children}
            </Component>
        );
    }

    let variants;
    if (shouldReduceMotion) {
        variants = reducedMotionVariants;
    } else if (animationType === 'slide') {
        variants = slideVariants;
    } else if (animationType === 'fade') {
        variants = fadeScaleVariants;
    } else {
        variants = springPopVariants;
    }

    const custom = {
        direction,
        delay,
        scale,
        duration: duration || ANIMATION_CONFIG.timings.itemEntrance,
        spring: ANIMATION_CONFIG.spring[springPreset] || ANIMATION_CONFIG.spring.bisk,
        distance: ANIMATION_CONFIG.offsets.small,
    };

    const MotionComponent = motion[as] || motion.div;

    const hoverProps = (!shouldReduceMotion && hoverTap) ? {
        whileHover: { scale: 1.03, transition: { duration: 0.18, ease: 'easeOut' } },
        whileTap: { scale: 0.96, transition: { duration: 0.1, ease: 'easeInOut' } },
    } : {};

    const triggerProps = whileInView ? {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once, amount, margin },
    } : {
        initial: 'hidden',
        animate: 'visible',
    };

    return (
        <MotionComponent
            ref={ref}
            className={`animated-item ${className}`.trim()}
            style={style}
            variants={variants}
            custom={custom}
            {...triggerProps}
            {...hoverProps}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
});

AnimatedItem.displayName = 'AnimatedItem';
export default AnimatedItem;

