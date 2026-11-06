import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Box } from '@mui/material';
import {
    springPopVariants,
    slideVariants,
    fadeScaleVariants,
    staggerContainerVariants,
    reducedMotionVariants
} from './animationVariants';
import { ANIMATION_CONFIG } from './animationConfig';

const MotionBox = motion.create(Box);

/**
 * AnimatedSection Component
 * Viewport-aware section entrance animation with optional stagger orchestration for children.
 */
export const AnimatedSection = forwardRef(({
    children,
    className = '',
    style = {},
    direction = 'up',
    delay = 0,
    duration,
    stagger = false,
    staggerDelay,
    animationType = 'springPop',
    once = true,
    amount = 0.08,
    margin = '0px 0px -40px 0px',
    disabled = false,
    as = 'div',
    sx,
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

    // Select base variants
    let variants;
    if (shouldReduceMotion) {
        variants = reducedMotionVariants;
    } else if (stagger) {
        variants = staggerContainerVariants;
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
        duration: duration || ANIMATION_CONFIG.timings.sectionEntrance,
        stagger: typeof stagger === 'number' ? stagger : (staggerDelay || ANIMATION_CONFIG.timings.cardStagger),
        delayChildren: delay,
        spring: ANIMATION_CONFIG.spring.gentle,
        distance: ANIMATION_CONFIG.offsets.medium,
    };

    const isUsingBox = Boolean(sx) || as === 'Box';
    const MotionComponent = isUsingBox ? MotionBox : (motion[as] || motion.div);

    return (
        <MotionComponent
            ref={ref}
            className={`animated-section ${className}`.trim()}
            style={style}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount, margin }}
            custom={custom}
            {...(isUsingBox ? { sx } : {})}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
});

AnimatedSection.displayName = 'AnimatedSection';
export default AnimatedSection;

