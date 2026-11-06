import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Box } from '@mui/material';
import { springPopVariants, reducedMotionVariants } from './animationVariants';
import { ANIMATION_CONFIG } from './animationConfig';

const MotionBox = motion.create(Box);

/**
 * AnimatedCard Component
 * Delivers the signature iPhone-style Spring / Pop entrance animation.
 * Enters with a smooth scale-up effect, subtle overshoot, and settles organically.
 */
export const AnimatedCard = forwardRef(({
    children,
    className = '',
    style = {},
    direction = 'up',
    delay = 0,
    duration,
    scale = ANIMATION_CONFIG.scales.initialPop,
    springPreset = 'appIcon',
    whileInView = true,
    once = true,
    amount = 0.08,
    margin = '0px 0px -40px 0px',
    hoverEffect = false,
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

    const variants = shouldReduceMotion ? reducedMotionVariants : springPopVariants;
    const custom = {
        direction,
        delay,
        scale,
        duration: duration || ANIMATION_CONFIG.timings.cardEntrance,
        spring: ANIMATION_CONFIG.spring[springPreset] || ANIMATION_CONFIG.spring.appIcon,
        distance: ANIMATION_CONFIG.offsets.medium,
    };

    const isUsingBox = Boolean(sx) || as === 'Box';
    const MotionComponent = isUsingBox ? MotionBox : (motion[as] || motion.div);

    // Optional subtle iOS card hover lift
    const hoverProps = (!shouldReduceMotion && hoverEffect) ? {
        whileHover: {
            y: -3,
            scale: 1.012,
            transition: { duration: 0.22, ease: 'easeOut' },
        },
        whileTap: {
            scale: 0.985,
            transition: { duration: 0.12, ease: 'easeInOut' },
        },
    } : {};

    // Viewport scroll trigger (smooth bottom-to-top entrance as cards scroll into view)
    const triggerProps = whileInView ? {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once, amount, margin },
    } : {
        // Inherits parent variants if inside a stagger container, or runs independently
        initial: 'hidden',
        animate: 'visible',
    };

    const baseStyle = {
        display: 'flex',
        flexDirection: 'column',
        ...style,
        ...(hoverEffect ? { cursor: 'pointer' } : {})
    };

    return (
        <MotionComponent
            ref={ref}
            className={`animated-card ${className}`.trim()}
            style={baseStyle}
            variants={variants}
            custom={custom}
            {...(isUsingBox ? { sx } : {})}
            {...triggerProps}
            {...hoverProps}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
});

AnimatedCard.displayName = 'AnimatedCard';
export default AnimatedCard;

